// ============================================================
// 实例内容生成器 — 每日定时发布 (北京时 03:20)
// 机制：按30天日历循环，每天1篇，幂等upsert
// ============================================================

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { getDailyExample } from "./content-calendars.mts";

const prisma = new PrismaClient();

// Env bootstrap
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
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch { /* ignore */ }
}

// 实例内容模板（每个slug对应完整三维度拆解）
const EXAMPLE_CONTENT: Record<string, {
  titleEn: string; titleZh: string;
  excerptEn: string; excerptZh: string;
  configEn: string; configZh: string;
  codeEn: string; codeZh: string;
  highlightsEn: string; highlightsZh: string;
}> = {
  'dsh-web-ui': {
    titleEn: 'dsh-web-ui: a panel, a skin center, and task boards',
    titleZh: 'dsh-web-ui：右侧面板 + 皮肤中心 + 任务看板',
    excerptEn: 'The fastest-growing UI bundle in the early ecosystem: injects a right-side panel, a skin center, Git graph and token statistics into the web UI.',
    excerptZh: '早期生态增长最快的 UI 合集：向 Web UI 注入右侧面板、皮肤中心、Git 图和 token 统计。',
    configEn: '```bash\ndsh plugin --profile web add github:zhu1090093659/dsh-web-ui\nnpx @deepseek-ai/dsh web\n```',
    configZh: '```bash\ndsh plugin --profile web add github:zhu1090093659/dsh-web-ui\nnpx @deepseek-ai/dsh web\n```',
    codeEn: '```ts\nexport function apply(ctx, config) {\n  ctx.ui.registerPanel(\'tasks\', { title: \'Task board\' });\n  ctx.ui.registerPanel(\'git\', { title: \'Git graph\' });\n  ctx.ui.registerSkin(config.skin ?? \'default\');\n}\n```',
    codeZh: '```ts\nexport function apply(ctx, config) {\n  ctx.ui.registerPanel(\'tasks\', { title: \'Task board\' });\n  ctx.ui.registerPanel(\'git\', { title: \'Git graph\' });\n  ctx.ui.registerSkin(config.skin ?? \'default\');\n}\n```',
    highlightsEn: '- Growth signal: 900+ to ~1868 stars within days\n- Scope: task boards, Git graph, token stats, skin center\n- Lesson: UI plugins differentiate fastest without touching kernel',
    highlightsZh: '- 增长信号：公测数天内从 900+ 涨到约 1868 star\n- 覆盖面：任务看板、Git 图、token 统计、皮肤中心\n- 启示：UI 插件是差异化最快路径，完全不碰内核',
  },
  'modlens': {
    titleEn: 'modlens: giving the model eyes',
    titleZh: 'modlens：给模型装上眼睛',
    excerptEn: 'The first vision plugin: paste an image, a vision engine returns structured JSON evidence, and the model answers from the evidence.',
    excerptZh: '首个视觉插件：粘贴图片，视觉引擎返回结构化 JSON 证据，模型基于证据作答。',
    configEn: '```bash\nnpx -y @deepseek-ai/dsh plugin --profile web add @liustack/modlens@3.18.1\n```',
    configZh: '```bash\nnpx -y @deepseek-ai/dsh plugin --profile web add @liustack/modlens@3.18.1\n```',
    codeEn: '```ts\nconst evidence = await visionEngine.analyze(image, { ocr: true, layout: true, entities: true });\nreturn { ok: true, evidence };\n```',
    codeZh: '```ts\nconst evidence = await visionEngine.analyze(image, { ocr: true, layout: true, entities: true });\nreturn { ok: true, evidence };\n```',
    highlightsEn: '- First vision plugin for DSH\n- Structured JSON evidence, not prose\n- Self-hosted API keys (Gemini, OpenAI, Claude)',
    highlightsZh: '- DSH 首个视觉插件\n- 结构化 JSON 证据，非散文\n- 密钥自持（Gemini、OpenAI、Claude）',
  },
  // 更多实例模板（示例占位，实际使用时填充）
};

// 为未定义模板的实例生成通用内容
function generateGenericExample(topic: ReturnType<typeof getDailyExample>) {
  const baseExcerpt = `A ${topic.category.replace('-', ' ')} plugin that demonstrates ${topic.slug} patterns in the DSH ecosystem.`;
  return {
    titleEn: `${topic.slug}: ${baseExcerpt}`,
    titleZh: `${topic.slug}：${baseExcerpt}`,
    excerptEn: baseExcerpt,
    excerptZh: baseExcerpt,
    configEn: `Install with:\n\`\`\`bash\ndsh plugin --profile web add github:<owner>/${topic.slug}\n\`\`\``,
    configZh: `安装：\n\`\`\`bash\ndsh plugin --profile web add github:<owner>/${topic.slug}\n\`\`\``,
    codeEn: `Example code pattern for ${topic.slug}.`,
    codeZh: `${topic.slug} 示例代码模式。`,
    highlightsEn: `- Category: ${topic.category}\n- Pattern: example implementation`,
    highlightsZh: `- 分类：${topic.category}\n- 模式：示例实现`,
  };
}

async function main() {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000) + 1;
  const dayInMonth = ((dayOfYear - 1) % 30) + 1;
  
  console.log(`[gen-examples] Day ${dayInMonth}/30 of cycle`);
  
  const topic = getDailyExample(dayInMonth);
  console.log(`[gen-examples] Processing: ${topic.slug} (${topic.pluginName})`);
  
  const content = EXAMPLE_CONTENT[topic.slug] ?? generateGenericExample(topic);
  
  const existing = await prisma.example.findUnique({ where: { slug: topic.slug } });
  
  const exampleData = {
    slug: topic.slug,
    status: 'published',
    pluginName: topic.pluginName,
    category: topic.category,
    titleEn: content.titleEn,
    titleZh: content.titleZh,
    excerptEn: content.excerptEn,
    excerptZh: content.excerptZh,
    configEn: content.configEn,
    configZh: content.configZh,
    codeEn: content.codeEn,
    codeZh: content.codeZh,
    highlightsEn: content.highlightsEn,
    highlightsZh: content.highlightsZh,
    order: existing?.order ?? dayInMonth,
    relatedTutorialSlugs: ['write-first-plugin'],
  };
  
  const result = await prisma.example.upsert({
    where: { slug: topic.slug },
    create: exampleData,
    update: exampleData,
  });
  
  console.log(`[gen-examples] ${topic.slug} → ${result.id}`);
}

main().catch(err => { console.error(err); process.exit(1); });
