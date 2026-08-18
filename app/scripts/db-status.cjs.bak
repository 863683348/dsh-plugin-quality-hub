// Check DB status - run from app/ directory
const { PrismaClient } = require("@prisma/client");
const { readFileSync } = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local");
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

const fsOut = require("fs");
const p = new PrismaClient();

Promise.all([
  p.$queryRaw`SELECT COUNT(*) as total FROM "plugins"`,
  p.$queryRaw`SELECT grade, COUNT(*) as cnt FROM "plugins" GROUP BY grade ORDER BY grade`,
  p.$queryRaw`SELECT name, score, grade FROM "plugins" ORDER BY score DESC LIMIT 10`,
  p.$queryRaw`SELECT COUNT(*) as danger FROM "plugins" WHERE flags::text LIKE '%danger%'`,
]).then(([total, grades, top10, danger]) => {
  const lines = [];
  lines.push("=== Database Status ===");
  lines.push("Total plugins: " + String(total[0].total));
  lines.push("Grade distribution: " + JSON.stringify(grades.map((g) => ({ grade: g.grade, cnt: String(g.cnt) }))));
  lines.push("Top 10: " + JSON.stringify(top10.map((x) => ({ name: x.name, score: x.score, grade: x.grade }))));
  lines.push("Plugins with danger flag: " + String(danger[0].danger));
  fsOut.writeFileSync("C:/worktmp/db-status-result.txt", lines.join("\n"), "utf8");
  p.$disconnect();
}).catch((e) => {
  fsOut.writeFileSync("C:/worktmp/db-status-result.txt", "Error: " + e.message, "utf8");
  p.$disconnect();
  process.exit(1);
});
