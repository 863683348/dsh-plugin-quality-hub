// Compare old vs new ecosystem stars scoring on real DB data (READ-ONLY, no writes)
// Usage: node node_modules/tsx/dist/cli.mjs scripts/recalc-compare.mts
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "fs";

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

function starsPartOld(stars: number): number {
  if (stars >= 1000) return 7;
  if (stars >= 100) return 5;
  if (stars >= 10) return 2;
  return 0;
}

function starsPartNew(stars: number): number {
  if (stars <= 0) return 0;
  return Math.min(7, Math.log10(stars + 1) * 1.1);
}

function assignGrade(score: number, hasDanger: boolean): string {
  let g = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
  if (hasDanger) g = "D";
  return g;
}

function hasDangerFlag(flagsJson: string | null): boolean {
  if (!flagsJson) return false;
  try {
    const flags = JSON.parse(flagsJson);
    return Array.isArray(flags) && flags.some((f: { type?: string }) => f?.type === "danger");
  } catch {
    return false;
  }
}

interface Row {
  name: string;
  stars: number;
  score: number;
  grade: string;
  ecosystem: number;
  flags: string | null;
  oldTotal: number;
  newTotal: number;
  oldGrade: string;
  newGrade: string;
  delta: number;
}

async function main() {
  const plugins = await prisma.plugin.findMany({
    select: { name: true, stars: true, score: true, grade: true, ecosystem: true, flags: true },
  });

  const rows: Row[] = plugins.map((p) => {
    const starsOld = starsPartOld(p.stars);
    const starsNew = starsPartNew(p.stars);
    // newEcosystem = old ecosystem - old stars contribution + new stars contribution
    const newEco = Math.min(15, Math.max(0, p.ecosystem - starsOld + starsNew));
    const danger = hasDangerFlag(p.flags);
    const newTotal = Math.min(100, Math.max(0, p.score - p.ecosystem + newEco));
    const newGrade = assignGrade(Math.round(newTotal), danger);
    return {
      name: p.name,
      stars: p.stars,
      score: p.score,
      grade: p.grade,
      ecosystem: p.ecosystem,
      flags: p.flags,
      oldTotal: p.score,
      newTotal,
      oldGrade: p.grade,
      newGrade,
      delta: newTotal - p.score,
    };
  });

  const lines: string[] = [];
  lines.push(`Total plugins in DB: ${rows.length}`);
  lines.push("");

  // Grade distribution old vs new
  const gradeCount = (g: string) => rows.filter((r) => r.newGrade === g).length;
  const oldA = rows.filter((r) => r.grade === "A").length;
  const oldB = rows.filter((r) => r.grade === "B").length;
  const oldC = rows.filter((r) => r.grade === "C").length;
  const oldD = rows.filter((r) => r.grade === "D").length;
  const newA = gradeCount("A");
  const newB = gradeCount("B");
  const newC = gradeCount("C");
  const newD = gradeCount("D");
  lines.push(`Grade dist  OLD: A${oldA} B${oldB} C${oldC} D${oldD}`);
  lines.push(`Grade dist  NEW: A${newA} B${newB} C${newC} D${newD}`);
  lines.push("");

  // Grade changes (upgrade / downgrade)
  const up = rows.filter((r) => r.newGrade < r.grade); // A < B < C < D alphabetically
  const down = rows.filter((r) => r.newGrade > r.grade);
  lines.push(`Grade UPGRADES (D/C/B -> higher): ${up.length}`);
  for (const r of up.sort((a, b) => b.delta - a.delta)) {
    lines.push(`  ${r.name.padEnd(38)} ${r.stars}*  ${r.grade}(${r.score}) -> ${r.newGrade}(${Math.round(r.newTotal)})`);
  }
  lines.push("");
  lines.push(`Grade DOWNGRADES (-> lower): ${down.length}`);
  for (const r of down.sort((a, b) => a.delta - b.delta)) {
    lines.push(`  ${r.name.padEnd(38)} ${r.stars}*  ${r.grade}(${r.score}) -> ${r.newGrade}(${Math.round(r.newTotal)})`);
  }
  lines.push("");

  // Score delta stats
  const sortedDelta = [...rows].sort((a, b) => b.delta - a.delta);
  lines.push("Biggest score INCREASES (top 10):");
  for (const r of sortedDelta.slice(0, 10)) {
    lines.push(`  +${r.delta.toFixed(1).padStart(4)}  ${r.name.padEnd(38)} ${r.stars}*  ${r.score} -> ${Math.round(r.newTotal)}`);
  }
  lines.push("");
  lines.push("Biggest score DECREASES (top 10):");
  for (const r of sortedDelta.slice(-10).reverse()) {
    lines.push(`  ${r.delta.toFixed(1).padStart(4)}  ${r.name.padEnd(38)} ${r.stars}*  ${r.score} -> ${Math.round(r.newTotal)}`);
  }
  lines.push("");

  // Top 20 old vs new (by stars spread check)
  lines.push("Top 20 OLD ranking:");
  const oldTop = [...rows].sort((a, b) => b.score - a.score).slice(0, 20);
  oldTop.forEach((r, i) => {
    lines.push(`  ${String(i + 1).padStart(2)}. ${r.name.padEnd(38)} ${String(r.stars).padStart(6)}*  ${r.score} ${r.grade}`);
  });
  lines.push("");
  lines.push("Top 20 NEW ranking:");
  const newTop = [...rows].sort((a, b) => b.newTotal - a.newTotal).slice(0, 20);
  newTop.forEach((r, i) => {
    lines.push(`  ${String(i + 1).padStart(2)}. ${r.name.padEnd(38)} ${String(r.stars).padStart(6)}*  ${Math.round(r.newTotal)} ${r.newGrade}`);
  });

  const out = lines.join("\n");
  console.log(out);
  writeFileSync("C:/worktmp/recalc-compare-result.txt", out, "utf8");
}

main()
  .catch((e) => {
    console.error("FAILED:", e);
    writeFileSync("C:/worktmp/recalc-compare-result.txt", "FAILED: " + e.message, "utf8");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
