// Seed script - 100 mock plugins with realistic score distribution + security flags
// Usage: npx prisma db seed (config in package.json prisma.seed)

import { PrismaClient } from "@prisma/client";
import type { SecurityFlag } from "../src/types/api";

const prisma = new PrismaClient();

// Deterministic pseudo-random generator so seeds are stable across runs
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260817);

const OWNERS = [
  "ysr666",
  "deepseek-harness",
  "dsh-community",
  "ai-plugins",
  "coder-labs",
  "northstar",
  "plugin-forge",
  "zhang-ai",
  "kai-ventures",
  "moonbase",
];

const NAMES = [
  "vision-router",
  "code-reviewer",
  "sql-helper",
  "docker-wizard",
  "k8s-deploy",
  "api-tester",
  "prompt-optimizer",
  "git-flow",
  "auth-guard",
  "cache-layer",
  "log-analyzer",
  "test-runner",
  "db-migrator",
  "config-manager",
  "web-scraper",
  "regex-buddy",
  "env-switcher",
  "color-palette",
  "json-formatter",
  "yaml-linter",
  "security-scanner",
  "rate-limiter",
  "queue-worker",
  "event-bus",
  "scheduler",
  "notifier",
  "feature-flag",
  "a-b-tester",
  "analytics",
  "monitoring",
  "alerting",
  "backup-tool",
  "restore-tool",
  "sync-engine",
  "export-csv",
  "import-json",
  "template-gen",
  "code-gen",
  "doc-gen",
  "api-doc",
  "swagger-helper",
  "graphql-tools",
  "websocket-proxy",
  "file-watcher",
  "hot-reload",
  "dev-server",
  "mock-server",
  "proxy-server",
  "load-tester",
  "perf-profiler",
];

const DESCRIPTIONS = [
  "Plugin for DSH harness ecosystem",
  "Quality tooling for AI coding assistants",
  "Utility plugin for DeepSeek Harness",
  "Community-driven DSH plugin",
  "Developer productivity plugin for DSH",
  "Enhances the DeepSeek Harness workflow",
  "Plugin with advanced configuration options",
  "Lightweight helper for DSH developers",
  "Integrates external services with DSH",
  "Automation plugin for the DSH platform",
];

interface SeedPlugin {
  name: string;
  owner: string;
  repoName: string;
  githubUrl: string;
  description: string;
  npmName: string | null;
  score: number;
  grade: string;
  maintenance: number;
  docs: number;
  npm: number;
  ecosystem: number;
  flags: SecurityFlag[];
  stars: number;
  lastPush: Date;
  archived: boolean;
  details: Record<string, string[]>;
}

function pickGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

function buildFlags(
  archived: boolean,
  dangerChance: number,
  missingBundle: boolean
): SecurityFlag[] {
  const flags: SecurityFlag[] = [];
  const dangerRoll = rng();
  if (dangerRoll < dangerChance) {
    flags.push({
      type: "danger",
      label: "危险安装脚本",
      detail: "检测到 curl|sh 安装脚本模式，可能在安装时执行任意代码",
    });
  }
  if (missingBundle) {
    flags.push({
      type: "warning",
      label: "缺失 dsh.bundle 声明",
      detail: "仓库中未找到 dsh.bundle 声明文件，无法确认插件接口兼容性",
    });
  }
  if (archived) {
    flags.push({
      type: "info",
      label: "仓库已归档",
      detail: "该仓库已被 GitHub 归档，处于只读状态",
    });
  }
  return flags;
}

function buildSeedPlugins(): SeedPlugin[] {
  const plugins: SeedPlugin[] = [];
  let count = 0;

  for (const owner of OWNERS) {
    for (const repoName of NAMES) {
      if (count >= 100) break;
      count += 1;

      // Bias toward high scores for top-tier plugins
      const scoreBias = rng();
      let score: number;
      if (scoreBias < 0.15) {
        score = Math.round(80 + rng() * 20); // A tier ~15%
      } else if (scoreBias < 0.4) {
        score = Math.round(60 + rng() * 20); // B tier ~25%
      } else if (scoreBias < 0.7) {
        score = Math.round(40 + rng() * 20); // C tier ~30%
      } else {
        score = Math.round(rng() * 40); // D tier ~30%
      }

      const archived = rng() < 0.08;
      const missingBundle = rng() < 0.25;
      const dangerChance = score < 40 ? 0.25 : 0.04;
      const flags = buildFlags(archived, dangerChance, missingBundle);

      // Danger flags force grade to D
      const hasDanger = flags.some((f) => f.type === "danger");
      const grade = hasDanger ? "D" : pickGrade(score);

      const stars = Math.round(Math.pow(rng() * 100, 2) + rng() * 20);
      const lastPush = new Date(
        Date.now() - Math.round(rng() * 400 * 24 * 3600 * 1000)
      );

      // Derive dimension scores that sum close to total
      const maintenance = Math.min(30, Math.round(score * 0.3));
      const docs = Math.min(25, Math.round(score * 0.25));
      const npmD = Math.min(30, Math.round(score * 0.3));
      const ecosystem = Math.min(15, Math.round(score * 0.15));

      plugins.push({
        name: `${owner}/${repoName}`,
        owner,
        repoName,
        githubUrl: `https://github.com/${owner}/${repoName}`,
        description: DESCRIPTIONS[Math.floor(rng() * DESCRIPTIONS.length)],
        npmName: rng() < 0.6 ? repoName : null,
        score,
        grade,
        maintenance,
        docs,
        npm: npmD,
        ecosystem,
        flags,
        stars,
        lastPush,
        archived,
        details: {
          maintenance:
            score < 60
              ? [`Last push over 90 days ago (-${Math.round((60 - score) / 3)})`]
              : [],
          docs: score < 50 ? ["README length below 200 words (-8)"] : [],
          npm: [],
          ecosystem: [],
        },
      });
    }
  }

  return plugins;
}

async function main() {
  const plugins = buildSeedPlugins();
  console.log(`Seeding ${plugins.length} plugins...`);

  for (const p of plugins) {
    const existing = await prisma.plugin.findUnique({ where: { name: p.name } });

    const data = {
      owner: p.owner,
      repoName: p.repoName,
      githubUrl: p.githubUrl,
      npmName: p.npmName,
      description: p.description,
      score: p.score,
      grade: p.grade,
      maintenance: p.maintenance,
      docs: p.docs,
      npm: p.npm,
      ecosystem: p.ecosystem,
      flags: JSON.stringify(p.flags),
      stars: p.stars,
      lastPush: p.lastPush,
      archived: p.archived,
    };

    const plugin = await prisma.plugin.upsert({
      where: { name: p.name },
      update: data,
      create: { name: p.name, ...data },
    });

    // Seed one score log per plugin (skip if already exists for that plugin)
    const existingLog = await prisma.scoreLog.findFirst({
      where: { pluginId: plugin.id },
    });
    if (!existingLog) {
      await prisma.scoreLog.create({
        data: {
          pluginId: plugin.id,
          score: p.score,
          grade: p.grade,
          details: JSON.stringify(p.details),
        },
      });
    }
  }

  // Summary counts
  const [total, byGrade, allPlugins] = await Promise.all([
    prisma.plugin.count(),
    prisma.plugin.groupBy({ by: ["grade"], _count: { _all: true } }),
    prisma.plugin.findMany({ select: { flags: true } }),
  ]);
  const withDanger = allPlugins.filter((p) =>
    Array.isArray(p.flags) &&
    (p.flags as unknown as SecurityFlag[]).some((f) => f.type === "danger")
  ).length;

  console.log("Seeding complete.");
  console.log(`Total plugins: ${total}`);
  console.log(`By grade: ${JSON.stringify(byGrade)}`);
  console.log(`Plugins with danger flag: ${withDanger}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
