// Monthly ecosystem report generator (P2)
// Pulls live data from Neon and renders:
//   1. Ecosystem overview (total, grade distribution, new this month, subscribers)
//   2. Top 50 ranked plugins
//   3. Rising stars (new this month, high score / high stars)
//   4. Abandonment watch (archived or stale repos)
//   5. Score churn (re-scores in the last 30 days)
//
// Usage (local):
//   node --experimental-strip-types scripts/monthly-report.mts
// Usage (CI): env DATABASE_URL + DIRECT_URL provided by workflow
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// ===== Env bootstrap (same pattern as daily-evaluate) =====
const IS_CI = !!process.env.CI;
if (!IS_CI) {
  try {
    const envContent = readFileSync(
      "C:/Users/l'x/WorkBuddy/2026-08-17-21-54-54/app/.env.local",
      "utf8"
    );
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx);
      let value = trimmed.slice(eqIdx + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    console.warn("[monthly-report] No .env.local found, relying on process env");
  }
}

const prisma = new PrismaClient();

// ===== Date helpers =====
const NOW = new Date();
const Y = NOW.getUTCFullYear();
const M = String(NOW.getUTCMonth() + 1).padStart(2, "0");
const MONTH_LABEL = `${Y}-${M}`;
const FIRST_DAY = new Date(Date.UTC(Y, NOW.getUTCMonth(), 1));
const THIRTY_DAYS_AGO = new Date(Date.UTC(Y, NOW.getUTCMonth(), NOW.getUTCDate() - 30));
const STALE_DAYS = 180; // repos without push for this long are flagged
const STALE_CUTOFF = new Date(Date.UTC(Y, NOW.getUTCMonth(), NOW.getUTCDate() - STALE_DAYS));

interface Row {
  rank: number;
  name: string;
  url: string;
  score: number;
  grade: string;
  stars: number;
  created: string;
  archived: boolean;
}

function row(p: any, rank?: number): Row {
  return {
    rank: rank ?? 0,
    name: p.name,
    url: p.githubUrl,
    score: p.score,
    grade: p.grade,
    stars: p.stars ?? 0,
    created: p.createdAt ? p.createdAt.toISOString().slice(0, 10) : "",
    archived: !!p.archived,
  };
}

async function main() {
  const [allPlugins, newThisMonth, stale, scoreLogs] = await Promise.all([
    prisma.plugin.findMany({
      orderBy: [{ score: "desc" }, { stars: "desc" }],
      select: {
        name: true, githubUrl: true, score: true, grade: true, stars: true,
        archived: true, createdAt: true, lastPush: true,
      },
    }),
    prisma.plugin.count({ where: { createdAt: { gte: FIRST_DAY } } }),
    prisma.plugin.findMany({
      where: { OR: [{ archived: true }, { lastPush: { lt: STALE_CUTOFF } }] },
      orderBy: { stars: "desc" },
      take: 12,
      select: {
        name: true, githubUrl: true, score: true, grade: true, stars: true,
        archived: true, createdAt: true, lastPush: true,
      },
    }),
    prisma.scoreLog.findMany({
      where: { createdAt: { gte: THIRTY_DAYS_AGO } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { score: true, grade: true, createdAt: true, plugin: { select: { name: true, githubUrl: true } } },
    }),
  ]);

  const subscribers = await prisma.newsletterSubscriber.count().catch(() => 0);

  // Grade distribution
  const dist = { A: 0, B: 0, C: 0, D: 0 };
  for (const p of allPlugins) {
    const g = (p.grade || "F") as keyof typeof dist;
    if (g in dist) dist[g]++;
  }

  // Top 50
  const top50 = allPlugins.slice(0, 50).map((p, i) => row(p, i + 1));

  // Rising stars: new this month sorted by score
  const rising = allPlugins
    .filter((p) => p.createdAt && p.createdAt >= FIRST_DAY)
    .slice(0, 10)
    .map((p, i) => row(p, i + 1));

  // Abandonment watch
  const abandon = stale.map((p, i) => row(p, i + 1));

  // Score churn (unique plugins re-scored in last 30d)
  const churnMap = new Map<string, { name: string; url: string; latest: number; prev: number | null; count: number }>();
  for (const s of scoreLogs) {
    const name = s.plugin?.name ?? "";
    if (!name) continue;
    const cur = churnMap.get(name);
    if (cur) {
      cur.count++;
      if (s.createdAt >= cur.latest) cur.latest = s.score;
    } else {
      churnMap.set(name, {
        name,
        url: s.plugin?.githubUrl ?? "",
        latest: s.score,
        prev: null,
        count: 1,
      });
    }
  }
  const churn = [...churnMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((c, i) => ({ rank: i + 1, ...c }));

  // ===== Render markdown =====
  const lines: string[] = [];
  lines.push(`# DSH Plugin Ecosystem Report — ${MONTH_LABEL}`);
  lines.push("");
  lines.push(`> Auto-generated by dshquality.com · ${NOW.toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push("## 1. Ecosystem Overview");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| Total plugins evaluated | **${allPlugins.length}** |`);
  lines.push(`| New this month | **${newThisMonth}** |`);
  lines.push(`| Newsletter subscribers | **${subscribers}** |`);
  lines.push(`| Grade A / B / C / D | ${dist.A} / ${dist.B} / ${dist.C} / ${dist.D} |`);
  lines.push("");
  lines.push("## 2. Top 50 Ranked Plugins");
  lines.push("");
  lines.push("| # | Plugin | Score | Grade | Stars |");
  lines.push("|---|--------|-------|-------|-------|");
  for (const r of top50) {
    lines.push(`| ${r.rank} | [${r.name}](${r.url}) | ${r.score} | ${r.grade} | ${r.stars} |`);
  }
  lines.push("");
  lines.push("## 3. Rising Stars (new this month)");
  lines.push("");
  if (rising.length === 0) {
    lines.push("_No new plugins evaluated this month yet._");
  } else {
    lines.push("| # | Plugin | Score | Grade | Stars |");
    lines.push("|---|--------|-------|-------|-------|");
    for (const r of rising) {
      lines.push(`| ${r.rank} | [${r.name}](${r.url}) | ${r.score} | ${r.grade} | ${r.stars} |`);
    }
  }
  lines.push("");
  lines.push("## 4. Abandonment Watch");
  lines.push("");
  if (abandon.length === 0) {
    lines.push("_Nothing flagged._");
  } else {
    lines.push("| # | Plugin | Score | Grade | Stars | Flag |");
    lines.push("|---|--------|-------|-------|-------|------|");
    for (const r of abandon) {
      lines.push(`| ${r.rank} | [${r.name}](${r.url}) | ${r.score} | ${r.grade} | ${r.stars} | ${r.archived ? "archived" : "no push > " + STALE_DAYS + "d"} |`);
    }
  }
  lines.push("");
  lines.push("## 5. Score Churn (re-scored, last 30 days)");
  lines.push("");
  if (churn.length === 0) {
    lines.push("_No re-scores in the window._");
  } else {
    lines.push("| # | Plugin | Evaluations | Latest score |");
    lines.push("|---|--------|-------------|--------------|");
    for (const c of churn) {
      lines.push(`| ${c.rank} | [${c.name}](${c.url}) | ${c.count} | ${c.latest} |`);
    }
  }
  lines.push("");
  lines.push("---");
  lines.push(`_Full data: https://dshquality.com · API: /api/v1/rankings_`);
  lines.push("");

  const reportMd = lines.join("\n");
  const outDir = join(process.cwd(), "docs", "reports");
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, `ecosystem-${MONTH_LABEL}.md`);
  writeFileSync(outFile, reportMd, "utf8");
  console.log(`[monthly-report] written ${outFile}`);

  // JSON summary for CI / newsletter templates
  const summary = {
    month: MONTH_LABEL,
    generatedAt: NOW.toISOString(),
    total: allPlugins.length,
    newThisMonth,
    subscribers,
    distribution: dist,
    top50: top50.slice(0, 5),
    risingCount: rising.length,
    abandonCount: abandon.length,
    churnCount: churn.length,
  };
  const jsonFile = join(outDir, `ecosystem-${MONTH_LABEL}.json`);
  writeFileSync(jsonFile, JSON.stringify(summary, null, 2), "utf8");
  console.log(`[monthly-report] summary: ${JSON.stringify(summary)}`);
  console.log("[monthly-report] DONE");
}

main()
  .catch((e) => {
    console.error("[monthly-report] ERROR:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
