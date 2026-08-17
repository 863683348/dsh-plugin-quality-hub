/**
 * scripts/fetch-data.mjs — build the scored catalog for the Quality Hub.
 *
 * Sources (all public, no auth):
 *   1. GitHub search API: repos tagged dsh-plugin, sorted by stars (top N)
 *   2. npm registry: for each repo whose short name looks like a package —
 *      latest version, publish date, dsh.bundle declaration, INSTALL SCRIPTS
 *      (security signal, zero extra fetches), weekly downloads
 *   3. awesome-dsh-plugin curated membership (from a local clone if present)
 *
 * Scoring reuses dsh-audit's pure scoring engine (scoreRecord).
 * Output: data/catalog.json + data/meta.json
 */
import { readFileSync, existsSync, writeFileSync, statSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scoreRecord } from "../../dsh-plugin-audit/lib/scoring.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");
const UA = "dsh-plugin-quality-hub/0.1";
const TOP_N = 100;
const NPM_CONCURRENCY = 8;
const TO = 15000;

/** High-risk install-script patterns (security signal from npm metadata). */
const HIGH_RISK = [
  /curl[^|\n]*\|\s*sh/i, /wget[^|\n]*\|\s*sh/i, /\/dev\/tcp\//i, /base64\s+-d/i,
  /(?:^|[;\s&])iex\s*\(/i, /invoke-expression/i, /powershell[^\n]*-(?:enc|encodedcommand)/i,
  /certutil\s+-urlcache/i, /cmd\.exe[^\n]*\/c/i,
];
const BEACON_OK = ["registry.npmjs.org", "api.github.com", "raw.githubusercontent.com", "github.com", "jsdelivr.net", "unpkg.com"];

function scriptsFindings(scripts) {
  const out = [];
  if (!scripts) return out;
  const install = Object.entries(scripts).filter(([k]) => ["install", "postinstall", "preinstall", "prepare"].includes(k));
  for (const [k, v] of install) {
    for (const p of HIGH_RISK) if (p.test(v)) out.push({ script: k, pattern: p.source });
    const urls = String(v).match(/https?:\/\/[^\s"')]+/g) || [];
    for (const u of urls) {
      let host = "?";
      try { host = new URL(u).hostname; } catch { }
      if (!BEACON_OK.includes(host)) out.push({ script: k, beacon: u });
    }
  }
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadToken() {
  const home = process.env.DSH_HOME || join(process.env.USERPROFILE, ".dsh");
  const p = join(home, "secrets", "github-token.txt");
  if (existsSync(p)) { const t = readFileSync(p, "utf8").trim(); return t || undefined; }
  return undefined;
}

async function ghSearch() {
  const token = loadToken();
  const q = encodeURIComponent("topic:dsh-plugin");
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(`https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=${TOP_N}`, {
        headers: { "User-Agent": UA, Accept: "application/vnd.github+json", ...(token ? { Authorization: "Bearer " + token } : {}) },
        signal: AbortSignal.timeout(TO),
      });
      if (r.status === 403 || r.status === 429) {
        const reset = r.headers.get("x-ratelimit-reset");
        throw new Error("rate limited (reset=" + reset + ")");
      }
      if (!r.ok) throw new Error("GitHub search HTTP " + r.status);
      const j = await r.json();
      return (j.items || []).map((x) => ({
        repo: x.full_name,
        url: x.html_url,
        name: x.name,
        description: x.description || "",
        stars: x.stargazers_count ?? 0,
        forks: x.forks_count ?? 0,
        openIssues: x.open_issues_count ?? 0,
        pushedAt: x.pushed_at || new Date(0).toISOString(),
        createdAt: x.created_at || new Date(0).toISOString(),
        archived: !!x.archived,
        license: x.license && x.license.spdx_id ? x.license.spdx_id : null,
        topics: x.topics || [],
      }));
    } catch (err) {
      lastErr = err;
      console.log("ghSearch attempt " + attempt + " failed: " + err.message);
      await sleep(attempt * 8000);
    }
  }
  throw lastErr;
}

async function probeNpm(name) {
  try {
    const r = await fetch("https://registry.npmjs.org/" + encodeURIComponent(name), {
      headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TO),
    });
    if (r.status === 404) return { exists: false };
    if (!r.ok) return { exists: false, error: "HTTP " + r.status };
    const b = await r.json();
    const latest = b["dist-tags"]?.latest;
    const man = typeof latest === "string" ? (b.versions?.[latest] ?? null) : null;
    let weekly = null;
    try {
      const dl = await fetch("https://api.npmjs.org/downloads/point/last-week/" + encodeURIComponent(name), {
        headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TO),
      });
      if (dl.ok) weekly = (await dl.json()).downloads ?? null;
    } catch { }
    return {
      exists: true, name, version: latest ?? null,
      publishedAt: (typeof latest === "string" && b.time?.[latest]) || null,
      weeklyDownloads: weekly,
      dshBundle: !!(man?.dsh?.bundle),
      scripts: man?.scripts ?? null,
    };
  } catch { return { exists: false, error: "probe failed" }; }
}

function curatedSet() {
  const dir = join(ROOT, "..", "awesome-dsh-plugin", "data", "plugins");
  const out = new Map();
  if (!existsSync(dir)) return out;
  for (const f of readdirSafe(dir)) {
    if (!f.endsWith(".yml")) continue;
    const text = readFileSync(join(dir, f), "utf8");
    const m = text.match(/^name:\s*([^\n]+)/m);
    if (m) {
      let addedAt = null;
      try { addedAt = new Date(statSync(join(dir, f)).mtime).toISOString(); } catch { }
      out.set(m[1].trim(), addedAt);
    }
  }
  return out;
}
function readdirSafe(d) { try { return readdirSync(d); } catch { return []; } }
import { readdirSync } from "node:fs";

mkdirSync(DATA, { recursive: true });
console.log("fetching topic (top " + TOP_N + " by stars)...");
const repos = await ghSearch();
console.log("repos=" + repos.length);
const curated = curatedSet();
console.log("curated entries=" + curated.size);

const npmOut = new Map();
const withNpm = repos.filter((r) => /^[a-z0-9._-]+$/.test(r.name));
console.log("npm probes=" + withNpm.length);
for (let i = 0; i < withNpm.length; i += NPM_CONCURRENCY) {
  const batch = withNpm.slice(i, i + NPM_CONCURRENCY);
  const res = await Promise.all(batch.map((r) => probeNpm(r.name)));
  batch.forEach((r, j) => npmOut.set(r.repo, res[j]));
}

const catalog = repos.map((r) => {
  const npm = npmOut.get(r.repo) ?? { exists: false };
  const curatedAt = curated.get(r.repo) ?? null;
  const findings = npm.scripts ? scriptsFindings(npm.scripts) : [];
  const record = {
    repo: r.repo, url: r.url, name: r.name, description: r.description,
    stars: r.stars, forks: r.forks, openIssues: r.openIssues,
    pushedAt: r.pushedAt, createdAt: r.createdAt, archived: r.archived,
    license: r.license, topics: r.topics, hasReadme: null,
    npm: { exists: npm.exists, name: npm.name, version: npm.version, publishedAt: npm.publishedAt, weeklyDownloads: npm.weeklyDownloads, dshBundle: npm.dshBundle },
    curated: !!curatedAt, addedAt: curatedAt,
  };
  const score = scoreRecord(record);
  return {
    ...record,
    score,
    security: { findings, highRisk: findings.some((f) => f.pattern), beacons: findings.filter((f) => f.beacon).length },
    plausible: !!(npm.dshBundle), // lightweight "real plugin" signal from npm metadata
  };
});
catalog.sort((a, b) => b.score.total - a.score.total);

const meta = { generatedAt: new Date().toISOString(), source: "GitHub topic:dsh-plugin (stars desc) + npm registry + awesome membership", count: catalog.length, npmProbed: withNpm.length, curatedCount: curated.size };
writeFileSync(join(DATA, "catalog.json"), JSON.stringify(catalog, null, 1));
writeFileSync(join(DATA, "meta.json"), JSON.stringify(meta, null, 1));
console.log("catalog=" + catalog.length + " written. A=" + catalog.filter((x) => x.score.grade === "A").length + " B=" + catalog.filter((x) => x.score.grade === "B").length + " C=" + catalog.filter((x) => x.score.grade === "C").length + " D=" + catalog.filter((x) => x.score.grade === "D").length + " highRisk=" + catalog.filter((x) => x.security.highRisk).length);
