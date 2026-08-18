// Show real GitHub plugins detail
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
  const real = await p.plugin.findMany({
    where: { owner: { notIn: ["ysr666", "deepseek-harness", "dsh-community", "ai-plugins", "coder-labs", "northstar", "plugin-forge", "zhang-ai", "kai-ventures", "moonbase", "dsh-hub", "harness-labs", "plugin-stack", "ai-toolkit", "devflow", "opensource-ai"] } },
    select: {
      name: true, score: true, grade: true, stars: true,
      maintenance: true, docs: true, npm: true, ecosystem: true,
      flags: true, lastPush: true, archived: true, npmName: true,
    },
  });

  const lines = ["=== Real GitHub plugins (" + real.length + ") ==="];
  for (const r of real) {
    const flags = JSON.parse(r.flags).map((f) => `${f.type}:${f.label}`).join(" | ");
    lines.push("");
    lines.push(`${r.name}  ${r.score} ${r.grade}  stars=${r.stars}`);
    lines.push(`  dims: maint=${r.maintenance}/30 docs=${r.docs}/25 npm=${r.npm}/30 eco=${r.ecosystem}/15`);
    lines.push(`  npm: ${r.npmName ?? "none"}  archived=${r.archived}  lastPush=${r.lastPush ? r.lastPush.toISOString().slice(0, 10) : "none"}`);
    lines.push(`  flags: ${flags || "-"}`);
  }

  writeFileSync("C:/worktmp/real-plugins-detail.txt", lines.join("\n"), "utf8");
  p.$disconnect();
}

main().catch((e) => {
  writeFileSync("C:/worktmp/real-plugins-detail.txt", "ERROR: " + e.message, "utf8");
  p.$disconnect();
  process.exit(1);
});
