// Quick simulation: compare candidate weight sets on real DB data.
// Reads stored dimension scores, simulates total with each candidate weight,
// outputs grade distribution + top-20 rank changes.
// Usage: node node_modules/tsx/dist/cli.mjs scripts/weight-simulate.mts
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "fs";

// ─── Load .env.local ───────────────────────────────────────────────────────────
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

const MAXES = [30, 25, 30, 15]; // dimension max scores (unchanged)
const MAX_STARS = 7; // ecosystem stars part cap

function simTotal(dims: number[], w: number[]): number {
  let t = 0;
  for (let i = 0; i < 4; i++) t += (dims[i] / MAXES[i]) * w[i] * 100;
  return t;
}
function gradeOf(t: number): "A" | "B" | "C" | "D" {
  return t >= 80 ? "A" : t >= 60 ? "B" : t >= 40 ? "C" : "D";
}

async function main() {
  const plugins = await prisma.plugin.findMany({
    select: { id: true, name: true, score: true, grade: true, maintenance: true, docs: true, npm: true, ecosystem: true, flags: true },
  });

  const rows = plugins.map(p => ({
    name: p.name,
    score: p.score,
    grade: p.grade,
    dims: [p.maintenance ?? 0, p.docs ?? 0, p.npm ?? 0, p.ecosystem ?? 0],
    hasDanger: (() => {
      try { return Array.isArray(p.flags) && (p.flags as { type?: string }[]).some(f => f?.type === "danger"); }
      catch { return false; }
    })(),
  }));

  const candidates: Array<[string, number[]]> = [
    ["CURRENT  30/25/30/15", [0.30, 0.25, 0.30, 0.15]],
    ["MethodC  26/26/24/24", [0.26, 0.26, 0.24, 0.24]],
    ["OptA     28/28/24/20", [0.28, 0.28, 0.24, 0.20]],
    ["OptB     30/26/24/20", [0.30, 0.26, 0.24, 0.20]],
    ["OptC     28/27/25/20", [0.28, 0.27, 0.25, 0.20]],
  ];

  const lines: string[] = [];
  lines.push(`Loaded ${plugins.length} plugins.\n`);
  lines.push("=".repeat(70));
  lines.push("CANDIDATE WEIGHT COMPARISON");
  lines.push("=".repeat(70));

  // DB current state
  const dbG = { A: 0, B: 0, C: 0, D: 0 };
  rows.forEach(r => { dbG[r.grade as keyof typeof dbG]++; });
  lines.push(`\nStored DB grades: A=${dbG.A} B=${dbG.B} C=${dbG.C} D=${dbG.D}\n`);

  for (const [label, w] of candidates) {
    const g = { A: 0, B: 0, C: 0, D: 0 };
    const ranked: Array<{ name: string; total: number; oldScore: number; grade: string }> = [];
    for (const r of rows) {
      let t = simTotal(r.dims, w);
      if (r.hasDanger) { g.D++; ranked.push({ name: r.name, total: t, oldScore: r.score, grade: "D" }); continue; }
      const gr = gradeOf(t);
      g[gr]++;
      ranked.push({ name: r.name, total: t, oldScore: r.score, grade: gr });
    }
    lines.push(`\n--- ${label} ---`);
    lines.push(`  Grades: A=${g.A} B=${g.B} C=${g.C} D=${g.D}`);
    // rank change: how many positions moved vs current score order
    const byNew = [...ranked].sort((a, b) => b.total - a.total);
    const byOld = [...ranked].sort((a, b) => b.oldScore - a.oldScore);
    const newRank = new Map(byNew.map((r, i) => [r.name, i + 1]));
    const oldRank = new Map(byOld.map((r, i) => [r.name, i + 1]));
    let moved = 0;
    let moved5 = 0;
    byNew.slice(0, 30).forEach(r => {
      const delta = Math.abs(newRank.get(r.name)! - oldRank.get(r.name)!);
      if (delta > 0) moved++;
      if (delta >= 5) moved5++;
    });
    lines.push(`  Top-30: ${moved} moved, ${moved5} moved ≥5 positions`);
    // top 10
    lines.push(`  Top 10:`);
    byNew.slice(0, 10).forEach((r, i) => {
      const oldPos = oldRank.get(r.name);
      const arrow = oldPos === i + 1 ? "=" : oldPos! < i + 1 ? `↑${oldPos}` : `↓${oldPos}`;
      lines.push(`    ${(i + 1).toString().padStart(2)}. ${r.name.padEnd(42)} ${Math.round(r.total)}  (was ${r.oldScore} #${oldPos}) ${arrow}`);
    });
  }

  const out = lines.join("\n");
  console.log(out);
  writeFileSync("C:/worktmp/weight-simulate-result.txt", out, "utf8");
  console.log("\n✅ Saved to C:/worktmp/weight-simulate-result.txt");
}

main()
  .catch(e => { console.error("FAILED:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
