// Query Neon DB to verify daily pipeline wrote data (via tsx from app dir)
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
  const total = await prisma.plugin.count();
  console.log("Total plugins: " + total);

  const bySource = await prisma.plugin.groupBy({ by: ["evalSource"], _count: { _all: true } });
  console.log("By evalSource:");
  for (const s of bySource) {
    console.log(`  ${s.evalSource}: ${s._count._all}`);
  }

  // Recent synthetic additions from today's cloud run
  const recent = await prisma.plugin.findMany({
    where: { evalSource: "synthetic" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { name: true, score: true, grade: true, createdAt: true, evalMeta: true },
  });
  console.log("\nRecent synthetic (top 5):");
  for (const r of recent) {
    console.log(`  ${r.name} ${r.score} ${r.grade} created=${r.createdAt.toISOString()} meta=${JSON.stringify(r.evalMeta)}`);
  }

  const github = await prisma.plugin.findMany({
    where: { evalSource: "github" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { name: true, score: true, grade: true, createdAt: true, evalMeta: true },
  });
  console.log("\nRecent github (top 5):");
  for (const g of github) {
    console.log(`  ${g.name} ${g.score} ${g.grade} created=${g.createdAt.toISOString()}`);
  }
}

main().catch((e) => { console.error("FAILED:", e); process.exit(1); }).finally(() => prisma.$disconnect());
