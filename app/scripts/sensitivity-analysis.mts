// Sensitivity analysis: try different log-scale coefficients, show grade impact
// READ-ONLY, no DB writes
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "fs";

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

function starsPartNew(stars: number, coef: number): number {
  if (stars <= 0) return 0;
  return Math.min(7, Math.log10(stars + 1) * coef);
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

async function main() {
  const plugins = await prisma.plugin.findMany({
    select: { name: true, stars: true, score: true, grade: true, ecosystem: true, flags: true },
  });

  const lines: string[] = [];
  lines.push(`Total plugins: ${plugins.length}`);
  lines.push("");

  // Show what each coefficient gives at key star values
  lines.push("coef  100*   1000*   10000*   100000*");
  for (const coef of [1.1, 1.3, 1.5, 1.7, 1.9, 2.1]) {
    const f = (s: number) => Math.min(7, Math.log10(s + 1) * coef);
    lines.push(
      `${coef.toFixed(1)}   ${f(100).toFixed(2)}    ${f(1000).toFixed(2)}     ${f(10000).toFixed(2)}      ${f(100000).toFixed(2)}`
    );
  }
  lines.push("(old: 100->5, 1000+->7)");
  lines.push("");

  const coefs = [1.1, 1.3, 1.5, 1.7, 1.9, 2.1];
  for (const coef of coefs) {
    let up = 0;
    let down = 0;
    const gradeDist: Record<string, number> = {};
    for (const p of plugins) {
      const starsOld = starsPartOld(p.stars);
      const starsNew = starsPartNew(p.stars, coef);
      const newEco = Math.min(15, Math.max(0, p.ecosystem - starsOld + starsNew));
      const danger = hasDangerFlag(p.flags);
      const newTotal = Math.min(100, Math.max(0, p.score - p.ecosystem + newEco));
      const newGrade = assignGrade(Math.round(newTotal), danger);
      gradeDist[newGrade] = (gradeDist[newGrade] ?? 0) + 1;
      if (newGrade < p.grade) up++;
      if (newGrade > p.grade) down++;
    }
    lines.push(
      `coef=${coef.toFixed(1)}  grades A${gradeDist.A ?? 0} B${gradeDist.B ?? 0} C${gradeDist.C ?? 0} D${gradeDist.D ?? 0}  upgrades=${up} downgrades=${down}`
    );
  }

  const out = lines.join("\n");
  console.log(out);
  writeFileSync("C:/worktmp/sensitivity-result.txt", out, "utf8");
}

main()
  .catch((e) => {
    console.error("FAILED:", e);
    writeFileSync("C:/worktmp/sensitivity-result.txt", "FAILED: " + e.message, "utf8");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
