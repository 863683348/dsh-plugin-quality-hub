// Recalc all plugin totals with the calibrated weights (28/28/24/20) and write back.
//
// The stored dimension scores (maintenance/docs/npm/ecosystem) are RAW scores,
// independent of weights. Weights only affect the final total:
//   total = (m/30)*w_m*100 + (d/25)*w_d*100 + (n/30)*w_n*100 + (e/15)*w_e*100
// So we recompute total + grade from stored dims and write back, plus score_log.
//
// Usage: node node_modules/tsx/dist/cli.mjs scripts/recalc-weights.mts
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

// New calibrated weights
const W = { maintenance: 0.28, docs: 0.28, npm: 0.24, ecosystem: 0.2 };
const MAX = { maintenance: 30, docs: 25, npm: 30, ecosystem: 15 };

function newTotal(m: number, d: number, n: number, e: number): number {
  return (
    (m / MAX.maintenance) * W.maintenance * 100 +
    (d / MAX.docs) * W.docs * 100 +
    (n / MAX.npm) * W.npm * 100 +
    (e / MAX.ecosystem) * W.ecosystem * 100
  );
}

function assignGrade(score: number, hasDanger: boolean): string {
  let g = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
  if (hasDanger) g = "D";
  return g;
}

function hasDangerFlag(flagsJson: unknown): boolean {
  if (!Array.isArray(flagsJson)) return false;
  return flagsJson.some((f) => f && typeof f === "object" && (f as { type?: string }).type === "danger");
}

async function main() {
  const plugins = await prisma.plugin.findMany({
    select: {
      id: true,
      name: true,
      score: true,
      grade: true,
      maintenance: true,
      docs: true,
      npm: true,
      ecosystem: true,
      flags: true,
    },
  });

  const lines: string[] = [];
  lines.push(`Recalculating ${plugins.length} plugins with calibrated weights 28/28/24/20...`);
  lines.push("");

  let changed = 0;
  let up = 0;
  let down = 0;
  const changes: Array<{ name: string; old: string; nw: string; delta: number }> = [];

  for (const p of plugins) {
    const m = p.maintenance ?? 0;
    const d = p.docs ?? 0;
    const n = p.npm ?? 0;
    const e = p.ecosystem ?? 0;
    const total = Math.round(newTotal(m, d, n, e));
    const danger = hasDangerFlag(p.flags);
    const grade = assignGrade(total, danger);

    if (total !== p.score || grade !== p.grade) {
      changed++;
      if (grade < p.grade) up++; // A is "better" than B: grade char compare
      if (grade > p.grade) down++;
      changes.push({
        name: p.name,
        old: `${p.grade}(${p.score})`,
        nw: `${grade}(${total})`,
        delta: total - p.score,
      });
    }

    await prisma.plugin.update({
      where: { id: p.id },
      data: { score: total, grade },
    });

    await prisma.scoreLog.create({
      data: {
        pluginId: p.id,
        score: total,
        grade,
        details: JSON.stringify({ reason: "calibrated weights 28/28/24/20", dims: { m, d, n, e } }),
      },
    });
  }

  lines.push(`Changed: ${changed} plugins (better=${up}, worse=${down})`);
  lines.push("");

  if (changes.length > 0) {
    const sorted = [...changes].sort((a, b) => b.delta - a.delta);
    lines.push("All changes:");
    for (const c of sorted) {
      lines.push(`  ${(c.delta >= 0 ? "+" : "")}${c.delta.toString().padStart(3)}  ${c.name.padEnd(42)} ${c.old} -> ${c.nw}`);
    }
    lines.push("");
  }

  const total = await prisma.plugin.count();
  const gradeDist = await prisma.plugin.groupBy({ by: ["grade"], _count: { _all: true } });
  lines.push(`Total plugins: ${total}`);
  lines.push("By grade: " + JSON.stringify(gradeDist.map((g) => ({ grade: g.grade, cnt: g._count._all }))));

  const out = lines.join("\n");
  console.log(out);
  writeFileSync("C:/worktmp/recalc-weights-result.txt", out, "utf8");
}

main()
  .catch((e) => {
    console.error("FAILED:", e);
    writeFileSync("C:/worktmp/recalc-weights-result.txt", "FAILED: " + e.message, "utf8");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
