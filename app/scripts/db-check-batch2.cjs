// Check DB for batch2 plugins after re-evaluate
const { PrismaClient } = require("@prisma/client");
const { readFileSync, writeFileSync } = require("fs");

const envPath = "C:/Users/l'x/WorkBuddy/2026-08-17-21-54-54/app/.env.local";
const envContent = readFileSync(envPath, "utf8");
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

const p = new PrismaClient();

async function main() {
  const lines = [];
  const total = await p.plugin.count();
  lines.push("Total plugins: " + total);

  const gradeDist = await p.plugin.groupBy({ by: ["grade"], _count: { _all: true } });
  lines.push("Grade dist: " + JSON.stringify(gradeDist.map((g) => ({ grade: g.grade, cnt: String(g._count._all) }))));

  const batchNames = [
    "json-viewer", "csv-converter", "markdown-lint", "shell-completer", "http-mock",
    "grpc-client", "webrtc-helper", "vector-search", "embedding-tool", "llm-cache",
    "prompt-store", "workflow-builder", "agent-memory", "tool-catalog", "health-check",
    "etl-pipeline", "schema-validator", "log-viewer", "metrics-dashboard", "cost-tracker",
    "context-compressor", "model-router", "guardrail-engine", "sandbox-runner",
  ];

  const batch2 = await p.plugin.findMany({
    where: { repoName: { in: batchNames } },
    orderBy: { score: "desc" },
    select: { name: true, owner: true, score: true, grade: true, stars: true, flags: true },
  });
  lines.push("");
  lines.push("Batch2 plugins found: " + batch2.length);
  for (const b of batch2) {
    const flagText = JSON.parse(b.flags).map((f) => f.type).join(",");
    lines.push(`  ${b.name.padEnd(30)} ${String(b.score).padStart(3)} ${b.grade} stars=${b.stars} flags=[${flagText}]`);
  }

  const all = await p.plugin.findMany({ select: { flags: true } });
  const dangerCount = all.filter((x) => JSON.parse(x.flags).some((f) => f.type === "danger")).length;
  lines.push("");
  lines.push("Total danger-flagged: " + dangerCount);

  writeFileSync("C:/worktmp/batch2-final-check.txt", lines.join("\n"), "utf8");
  p.$disconnect();
}

main().catch((e) => {
  writeFileSync("C:/worktmp/batch2-final-check.txt", "ERROR: " + e.message, "utf8");
  p.$disconnect();
  process.exit(1);
});
