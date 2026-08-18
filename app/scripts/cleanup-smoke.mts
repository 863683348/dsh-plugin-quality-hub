// Clean up smoke-test synthetic plugins + verify snapshot fields on github-sourced ones
// Run with tsx from app dir so @prisma/client resolves
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";

const envContent = readFileSync(
  "C:/Users/l'x/WorkBuddy/2026-08-17-21-54-54/app/.env.local",
  "utf8"
);
for (const line of envContent.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  const k = t.slice(0, eq);
  let v = t.slice(eq + 1);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[k] = v;
}

const prisma = new PrismaClient();

async function main() {
  // 1. Remove smoke-test synthetic plugins
  const synthetics = await prisma.plugin.findMany({
    where: { evalSource: "synthetic" },
    select: { id: true, name: true },
  });
  console.log(`Synthetic plugins to remove: ${synthetics.length}`);
  for (const s of synthetics) {
    await prisma.scoreLog.deleteMany({ where: { pluginId: s.id } });
    await prisma.plugin.delete({ where: { id: s.id } });
    console.log(`  removed ${s.name}`);
  }

  // 2. Verify github-sourced plugins have snapshot fields
  const github = await prisma.plugin.findMany({
    where: { evalSource: "github" },
    select: { name: true, npmVersion: true, lastEvalAt: true, evalSource: true, evalMeta: true },
    take: 5,
  });
  console.log("\nGithub-sourced sample (first 5):");
  for (const g of github) {
    console.log(
      `  ${g.name} npmVersion=${g.npmVersion ?? "-"} lastEvalAt=${g.lastEvalAt?.toISOString() ?? "-"} meta=${JSON.stringify(g.evalMeta)}`
    );
  }

  // 3. Count all
  const total = await prisma.plugin.count();
  console.log(`\nTotal plugins now: ${total}`);
}

main()
  .catch((e) => { console.error("FAILED:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
