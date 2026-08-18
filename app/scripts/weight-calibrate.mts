// Weight calibration analysis (v2): calibrate scoring weights from real DB data.
//
// The Plugin table stores the final 4 dimension scores (maintenance/docs/npm/ecosystem)
// plus total score and grade. We use these stored values directly:
//   1. Variance / std of each dimension (discriminative power)
//   2. Pearson correlation of each dimension with the stored total score
//   3. Proposed weights from 4 methods (variance, |corr|, geometric mean, entropy)
//   4. Rank/grade impact simulation of the proposed weights
//
// Note: stored total = maintenance + docs + npm + ecosystem (weights are encoded
// inside each dimension's max 30/25/30/15), so "correlation with total" is
// partially circular — the |corr| method is shown for reference only.
//
// Usage: node node_modules/tsx/dist/cli.mjs scripts/weight-calibrate.mts
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

// ─── Stats helpers ─────────────────────────────────────────────────────────────
function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function variance(arr: number[]): number {
  const m = mean(arr);
  return arr.reduce((a, v) => a + (v - m) ** 2, 0) / arr.length;
}
function stdDev(arr: number[]): number {
  return Math.sqrt(variance(arr));
}
function pearson(x: number[], y: number[]): number {
  const n = x.length;
  const mx = mean(x), my = mean(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[i] - mx, yi = y[i] - my;
    num += xi * yi;
    dx += xi * xi;
    dy += yi * yi;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

// ─── Weighted total simulation ─────────────────────────────────────────────────
// Current architecture: score = Σ (dim/max_dim * weight_dim * 100), weight sum = 1.
function simulateTotal(dims: { maintenance: number; docs: number; npm: number; ecosystem: number }, w: number[]): number {
  const maxes = [30, 25, 30, 15];
  const d = [dims.maintenance, dims.docs, dims.npm, dims.ecosystem];
  let t = 0;
  for (let i = 0; i < 4; i++) t += (d[i] / maxes[i]) * w[i] * 100;
  return t;
}

function gradeOf(t: number): "A" | "B" | "C" | "D" {
  return t >= 80 ? "A" : t >= 60 ? "B" : t >= 40 ? "C" : "D";
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const plugins = await prisma.plugin.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      score: true,
      grade: true,
      maintenance: true,
      docs: true,
      npm: true,
      ecosystem: true,
      stars: true,
    },
  });

  console.log(`Loaded ${plugins.length} plugins.\n`);

  // Use stored dimension scores (they were computed by the current scoring engine).
  const D = ["maintenance", "docs", "npm", "ecosystem"] as const;
  const dims: Record<string, number[]> = { maintenance: [], docs: [], npm: [], ecosystem: [] };
  const totals: number[] = [];
  const rows: Array<{ name: string; maintenance: number; docs: number; npm: number; ecosystem: number; score: number; grade: string; stars: number }> = [];

  for (const p of plugins) {
    const m = p.maintenance ?? 0;
    const d = p.docs ?? 0;
    const n = p.npm ?? 0;
    const e = p.ecosystem ?? 0;
    dims.maintenance.push(m);
    dims.docs.push(d);
    dims.npm.push(n);
    dims.ecosystem.push(e);
    totals.push(p.score);
    rows.push({ name: p.name, maintenance: m, docs: d, npm: n, ecosystem: e, score: p.score, grade: p.grade, stars: p.stars });
  }

  // ─── 1. Dimension statistics ─────────────────────────────────────────────────
  console.log("=".repeat(72));
  console.log("1. DIMENSION STATISTICS (stored dimension scores)");
  console.log("=".repeat(72));
  console.log(`{"dim","mean","std","variance","corr_with_total","normalized_spread"}`);
  for (const dim of D) {
    const arr = dims[dim];
    const m = mean(arr), s = stdDev(arr), v = variance(arr), c = pearson(arr, totals);
    // normalized spread: std / max possible (30/25/30/15)
    const maxScore = { maintenance: 30, docs: 25, npm: 30, ecosystem: 15 }[dim];
    const normSpread = s / maxScore;
    console.log(`  ${dim.padEnd(14)} mean=${m.toFixed(1)} std=${s.toFixed(1)} var=${v.toFixed(1)} corr=${c.toFixed(3)} normSpread=${normSpread.toFixed(3)}`);
  }

  // ─── 2. Weight proposal methods ──────────────────────────────────────────────
  console.log("\n" + "=".repeat(72));
  console.log("2. WEIGHT PROPOSALS");
  console.log("=".repeat(72));

  // Method A: variance-proportional (raw)
  const vars = D.map(dd => variance(dims[dd]));
  const varSum = vars.reduce((a, b) => a + b, 0);
  const wA = vars.map(v => v / varSum);

  // Method A': normalized-spread-proportional (std/max, fair across different scales)
  const spreads = D.map(dd => stdDev(dims[dd]) / ({ maintenance: 30, docs: 25, npm: 30, ecosystem: 15 } as Record<string, number>)[dd]);
  const spreadSum = spreads.reduce((a, b) => a + b, 0);
  const wAp = spreads.map(s => s / spreadSum);

  // Method B: |correlation| with total (reference only, partially circular)
  const corrs = D.map(dd => Math.abs(pearson(dims[dd], totals)));
  const corrSum = corrs.reduce((a, b) => a + b, 0);
  const wB = corrs.map(c => c / corrSum);

  // Method C: geometric mean of A' and B
  const wC = D.map((_, i) => Math.sqrt(wAp[i] * wB[i]));
  const cSum = wC.reduce((a, b) => a + b, 0);
  const wCnorm = wC.map(w => w / cSum);

  // Method D: entropy-based (std proxy)
  const entropies = D.map(dd => Math.log(stdDev(dims[dd]) + 1e-10));
  const entMax = Math.max(...entropies);
  const wD = D.map((_, i) => Math.exp(entropies[i] - entMax));
  const dSum = wD.reduce((a, b) => a + b, 0);
  const wDnorm = wD.map(w => w / dSum);

  const currentW = [0.3, 0.25, 0.3, 0.15];
  const methods: Array<[string, number[]]> = [
    ["A  variance-proportional", wA],
    ["A' normalized-spread", wAp],
    ["B  |corr| with total", wB],
    ["C  geometric(A',B)", wCnorm],
    ["D  entropy", wDnorm],
  ];
  for (const [label, w] of methods) {
    console.log(`\n  ${label}:`);
    D.forEach((dd, i) => console.log(`    ${dd.padEnd(14)} ${(w[i] * 100).toFixed(1)}%  (was ${(currentW[i] * 100).toFixed(0)}%)`));
  }

  // ─── 3. Grade distribution impact per method ────────────────────────────────
  console.log("\n" + "=".repeat(72));
  console.log("3. GRADE DISTRIBUTION IMPACT (simulated)");
  console.log("=".repeat(72));

  const curGrade = { A: 0, B: 0, C: 0, D: 0 };
  rows.forEach(r => { curGrade[r.grade as keyof typeof curGrade]++; });
  console.log(`  Stored (DB):     A=${curGrade.A}  B=${curGrade.B}  C=${curGrade.C}  D=${curGrade.D}`);

  for (const [label, w] of methods) {
    const g = { A: 0, B: 0, C: 0, D: 0 };
    rows.forEach(r => {
      const t = simulateTotal(r, w);
      g[gradeOf(t)]++;
    });
    console.log(`  ${label.padEnd(26)} A=${g.A}  B=${g.B}  C=${g.C}  D=${g.D}`);
  }

  // ─── 4. Top-10 rank change (Method C) ───────────────────────────────────────
  console.log("\n" + "=".repeat(72));
  console.log("4. TOP-10 RANK CHANGE (Method C weights)");
  console.log("=".repeat(72));

  const oldTop = [...rows].sort((a, b) => b.score - a.score).slice(0, 10);
  const newTop = [...rows].sort((a, b) => simulateTotal(b, wCnorm) - simulateTotal(a, wCnorm)).slice(0, 10);

  console.log(`  {"rank","old_name","old_score","new_name","new_score"}`);
  for (let i = 0; i < 10; i++) {
    console.log(`  ${i + 1}. ${oldTop[i].name.padEnd(45)} ${oldTop[i].score}  |  ${newTop[i].name.padEnd(45)} ${Math.round(simulateTotal(newTop[i], wCnorm))}`);
  }

  // ─── 5. Recommendation ──────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(72));
  console.log("5. RECOMMENDATION (Method C: geometric of spread & correlation)");
  console.log("=".repeat(72));

  // Round to clean percentages summing to 100
  const raw = wCnorm.map((w, i) => ({ dim: D[i], w }));
  raw.sort((a, b) => b.w - a.w);
  const pcts = raw.map(r => Math.round(r.w * 100));
  const sumP = pcts.reduce((a, b) => a + b, 0);
  if (sumP !== 100 && pcts.length > 0) pcts[0] += 100 - sumP;

  console.log(`\n  Suggested clean weights (sum=100%):`);
  raw.forEach((r, i) => {
    const oldPct = Math.round(currentW[D.indexOf(r.dim)] * 100);
    const diff = pcts[i] - oldPct;
    const arrow = diff > 0 ? `↑ +${diff}` : diff < 0 ? `↓ ${diff}` : "→ 0";
    console.log(`    ${r.dim.padEnd(14)} ${oldPct}% → ${pcts[i]}%  (${arrow})`);
  });

  // Save JSON
  const jsonOut = JSON.stringify({
    loaded: plugins.length,
    dimensions: D.map(dd => ({
      dim: dd,
      mean: mean(dims[dd]).toFixed(1),
      std: stdDev(dims[dd]).toFixed(1),
      variance: variance(dims[dd]).toFixed(1),
      corrWithTotal: pearson(dims[dd], totals).toFixed(3),
      normalizedSpread: (stdDev(dims[dd]) / ({ maintenance: 30, docs: 25, npm: 30, ecosystem: 15 } as Record<string, number>)[dd]).toFixed(3),
    })),
    proposals: methods.map(([label, w]) => ({
      method: label,
      weights: D.map((dd, i) => ({ dim: dd, weight: Number((w[i] * 100).toFixed(1)) })),
    })),
    gradeImpact: methods.map(([label, w]) => {
      const g = { A: 0, B: 0, C: 0, D: 0 };
      rows.forEach(r => { g[gradeOf(simulateTotal(r, w))]++; });
      return { method: label, ...g };
    }),
    cleanWeights: raw.map((r, i) => ({ dim: r.dim, pct: pcts[i] })),
  }, null, 2);
  writeFileSync("C:/worktmp/weight-calibrate-result.txt", jsonOut, "utf8");
  console.log("\n✅ Results saved to C:/worktmp/weight-calibrate-result.txt");
}

main()
  .catch((e) => {
    console.error("FAILED:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
