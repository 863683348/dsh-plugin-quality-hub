// Full recalc of all plugins in DB with the new log-scale ecosystem scoring
// (stars: log10(stars+1) * 1.7, capped at 7) and write back to Neon.
// Writes: plugin.score / grade / ecosystem + score_log history entries.
// Usage: node node_modules/tsx/dist/cli.mjs scripts/recalc-all.mts
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
  return Math.min(7, Math.log10(stars + 1) * 1.7);
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
    select: {
      id: true,
      name: true,
      stars: true,
      score: true,
      grade: true,
      ecosystem: true,
      flags: true,
    },
  });

  const lines: string[] = [];
  lines.push(`Recalculating ${plugins.length} plugins with log-scale ecosystem...`);
  lines.push("");

  let changed = 0;
  let up = 0;
  let down = 0;
  const changes: { name: string; stars: number; old: string; nw: string; delta: number }[] = [];

  for (const p of plugins) {
    const starsOld = starsPartOld(p.stars);
    const starsNew = starsPartNew(p.stars);
    const newEco = Math.min(15, Math.max(0, p.ecosystem - starsOld + starsNew));
    const danger = hasDangerFlag(p.flags);
    const newTotal = Math.min(100, Math.max(0, p.score - p.ecosystem + newEco));
    const newGrade = assignGrade(Math.round(newTotal), danger);

    if (Math.round(newTotal) !== p.score || newGrade !== p.grade) {
      changed++;
      if (newGrade < p.grade) up++;
      if (newGrade > p.grade) down++;
      changes.push({
        name: p.name,
        stars: p.stars,
        old: `${p.grade}(${p.score})`,
        nw: `${newGrade}(${Math.round(newTotal)})`,
        delta: newTotal - p.score,
      });
    }

    await prisma.plugin.update({
      where: { id: p.id },
      data: {
        score: Math.round(newTotal),
        grade: newGrade,
        ecosystem: Math.round(newEco * 10) / 10,
      },
    });

    // Score log (history)
    await prisma.scoreLog.create({
      data: {
        pluginId: p.id,
        score: Math.round(newTotal),
        grade: newGrade,
        details: JSON.stringify({ reason: "log-scale ecosystem (coef 1.7)", stars: p.stars, eco: newEco }),
      },
    });
  }

  lines.push(`Changed: ${changed} plugins (upgrades=${up}, downgrades=${down})`);
  lines.push("");

  if (changes.length > 0) {
    lines.push("All changes:");
    const sorted = [...changes].sort((a, b) => b.delta - a.delta);
    for (const c of sorted) {
      lines.push(
        `  ${(c.delta >= 0 ? "+" : "")}${c.delta.toFixed(1).padStart(4)}  ${c.name.padEnd(38)} ${String(c.stars).padStart(6)}*  ${c.old} -> ${c.nw}`
      );
    }
    lines.push("");
  }

  // Final DB grade distribution
  const total = await prisma.plugin.count();
  const gradeDist = await prisma.plugin.groupBy({ by: ["grade"], _count: { _all: true } });
  lines.push(`Total plugins: ${total}`);
  lines.push("By grade: " + JSON.stringify(gradeDist.map((g) => ({ grade: g.grade, cnt: g._count._all }))));

  const out = lines.join("\n");
  console.log(out);
  writeFileSync("C:/worktmp/recalc-all-result.txt", out, "utf8");
}

main()
  .catch((e) => {
    console.error("FAILED:", e);
    writeFileSync("C:/worktmp/recalc-all-result.txt", "FAILED: " + e.message, "utf8");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
