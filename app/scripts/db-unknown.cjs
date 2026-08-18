// Check what unknown plugins exist + refresh logs
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

  // Known seed owners
  const seedOwners = ["ysr666", "deepseek-harness", "dsh-community", "ai-plugins", "coder-labs", "northstar", "plugin-forge", "zhang-ai", "kai-ventures", "moonbase"];
  // Known batch2 owners
  const batchOwners = ["dsh-hub", "harness-labs", "plugin-stack", "ai-toolkit", "devflow", "opensource-ai"];

  const all = await p.plugin.findMany({
    orderBy: { createdAt: "desc" },
    select: { name: true, owner: true, score: true, grade: true, stars: true, createdAt: true },
  });

  const unknown = all.filter((x) => !seedOwners.includes(x.owner) && !batchOwners.includes(x.owner));
  lines.push("=== Unknown plugins (not seed, not batch2): " + unknown.length + " ===");
  for (const u of unknown) {
    lines.push(`  ${u.name.padEnd(40)} ${String(u.score).padStart(3)} ${u.grade} stars=${u.stars} created=${u.createdAt.toISOString()}`);
  }

  // Refresh logs
  const logs = await p.refreshLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 });
  lines.push("");
  lines.push("=== Recent refresh logs ===");
  for (const l of logs) {
    lines.push(`  trigger=${l.trigger} status=${l.status} fetched=${l.pluginsFetched} updated=${l.pluginsUpdated} error=${l.error ?? "none"} at=${l.createdAt.toISOString()}`);
  }

  // Recent score logs count
  const recentLogs = await p.scoreLog.count({ where: { createdAt: { gte: new Date(Date.now() - 3600_000) } } });
  lines.push("");
  lines.push("ScoreLogs in last hour: " + recentLogs);

  writeFileSync("C:/worktmp/db-unknown-check.txt", lines.join("\n"), "utf8");
  p.$disconnect();
}

main().catch((e) => {
  writeFileSync("C:/worktmp/db-unknown-check.txt", "ERROR: " + e.message, "utf8");
  p.$disconnect();
  process.exit(1);
});
