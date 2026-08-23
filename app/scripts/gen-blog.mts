// ============================================================
// 博客内容生成器 — 每日定时发布 (北京时 03:30)
// 机制：按30天日历循环，每天1篇双语，追加到 posts.ts
// ============================================================

import { readFileSync, writeFileSync } from "fs";
import { getDailyBlog } from "./content-calendars.mts";

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

// 博客内容模板库（每个slug对应完整双语文本）
const BLOG_CONTENT: Record<string, {
  titleEn: string; titleZh: string;
  excerptEn: string; excerptZh: string;
  metaDescriptionEn: string; metaDescriptionZh: string;
  bodyEn: string[]; bodyZh: string[];
}> = {
  'dsh-plugin-security-scanner-guide': {
    titleEn: 'DSH Plugin Security Scanner: How to Spot Risky Plugins Before You Install Them',
    titleZh: 'DSH 插件安全扫描器：安装前如何识别风险插件',
    excerptEn: 'A dsh plugin security scanner is the difference between a clean workspace and a compromised build. Learn how the DSH Quality score flags risky plugins before they enter your project.',
    excerptZh: 'DSH 插件安全扫描器是干净工作区和被破坏构建之间的区别。学习 DSH Quality 评分如何在风险插件进入项目前标记它们。',
    metaDescriptionEn: 'How to check dsh plugin security before install: understand the DSH Quality score, spot missing dsh.bundle declarations, dangerous install scripts and stale repos.',
    metaDescriptionZh: '如何检查 dsh 插件安全：理解 DSH Quality 评分，发现缺失的 dsh.bundle 声明、危险安装脚本和陈旧仓库。',
    bodyEn: [
      { h2: 'Understanding the DSH Quality Score' },
      { p: 'The DSH Quality Score evaluates plugins across four dimensions: maintenance health, documentation quality, npm ecosystem integration, and security posture. Every plugin receives a letter grade from A to D plus a 0-100 numerical score.' },
      { table: { head: ['Grade', 'Score Range', 'What It Means'], rows: [['A', '80-100', 'Excellent — recommended for production'], ['B', '60-79', 'Good — suitable for most use cases'], ['C', '40-59', 'Fair — proceed with caution'], ['D', '0-39', 'Poor — review carefully before installing']] } },
      { h2: 'The Four Scoring Dimensions' },
      { p: 'Maintenance health checks commit frequency, last push date, and dependency freshness. Documentation quality evaluates README completeness, API docs, and examples. NPM ecosystem integration looks at publish history, version stability, and install script safety. Security posture scans for dangerous patterns like postinstall scripts that access environment variables.' },
      { h2: 'Reading Security Flags' },
      { ul: ['danger:unsafe-install — plugin runs arbitrary code during install', 'warning:missing-docs — no README or incomplete documentation', 'warning:stale-repo — no commits in over 12 months', 'info:large-dependencies — plugin has excessive third-party deps'] },
      { h2: 'What to Do When You See a Warning' },
      { p: 'Don\'t panic — warnings are signals, not verdicts. Read the flagged script, check the author\'s other plugins, and compare with alternatives. The DSH Quality site shows full security advisory details for each flagged pattern.' },
    ],
    bodyZh: [
      { h2: '理解 DSH Quality 评分' },
      { p: 'DSH Quality 评分从四个维度评估插件：维护健康度、文档质量、npm 生态集成和安全态势。每个插件获得 A 到 D 的字母等级和 0-100 的数值分数。' },
      { table: { head: ['等级', '分数范围', '含义'], rows: [['A', '80-100', '优秀——适合生产环境'], ['B', '60-79', '良好——适合大多数用例'], ['C', '40-59', '一般——谨慎使用'], ['D', '0-39', '差——安装前仔细审查']] } },
      { h2: '四个评分维度' },
      { p: '维护健康度检查提交频率、最后推送日期和依赖新鲜度。文档质量评估 README 完整性、API 文档和示例。npm 生态集成查看发布历史、版本稳定性和安装脚本安全性。安全态势扫描危险模式，如访问环境变量的 postinstall 脚本。' },
      { h2: '解读安全标志' },
      { ul: ['danger:unsafe-install — 插件在安装时运行任意代码', 'warning:missing-docs — 无 README 或文档不完整', 'warning:stale-repo — 超过 12 个月无提交', 'info:large-dependencies — 插件有大量第三方依赖'] },
      { h2: '看到警告时该怎么做' },
      { p: '别慌——警告是信号，不是判决。阅读被标记的脚本，检查作者的其他插件，并与替代品比较。DSH Quality 站点显示每个标记模式的完整安全公告详情。' },
    ],
  },
  'dsh-ecosystem-growth-analysis': {
    titleEn: 'The DSH Plugin Ecosystem: Growth Analysis and What It Means',
    titleZh: 'DSH 插件生态：增长分析和这意味着什么',
    excerptEn: 'The DSH plugin ecosystem grew to over 4,300 plugins in days. We break down the numbers, the tag-baiting problem, and what it means for installers.',
    excerptZh: 'DSH 插件生态在几天内增长到 4300+ 插件。我们拆解数据、蹭标签问题，以及它对安装者意味着什么。',
    metaDescriptionEn: 'DSH plugin ecosystem growth analysis: 4300+ plugins in days, tag-baiting problems, and what installers need to know about plugin quality.',
    metaDescriptionZh: 'DSH 插件生态增长分析：几天内 4300+ 插件、蹭标签问题，以及安装者需要了解的质量信息。',
    bodyEn: [
      { h2: 'The Explosion' },
      { p: 'In August 2026, the DSH plugin ecosystem experienced unprecedented growth. Within a single week, the number of public repositories tagged with `dsh-plugin` grew from under 500 to over 4,300. This represents a 760% increase in just seven days.' },
      { h2: 'What Drove the Growth' },
      { ul: ['Copilot-style AI coding tools increased demand for customization', 'GitHub Copilot limitations pushed users to open-source alternatives', 'The dsh announcement created a clear signal for plugin developers', 'Low barrier to entry: any GitHub repo with the topic is discoverable'] },
      { h2: 'The Tag-Baiting Problem' },
      { p: 'Not all growth is healthy. A significant portion of new repositories use the `dsh-plugin` topic without actually being DSH plugins. This "tag baiting" creates noise in discovery mechanisms and can mislead installers into thinking a plugin is relevant when it is not.' },
      { h2: 'How the Quality Hub Helps' },
      { p: 'Our daily evaluation pipeline discovers real plugins by analyzing repository content, not just topics. It checks for `dsh.bundle` declarations, package.json structure, and actual plugin code. This filters out tag-baiting repositories and surfaces genuine quality signals.' },
    ],
    bodyZh: [
      { h2: '爆发式增长' },
      { p: '2026年8月，DSH 插件生态经历了前所未有的增长。仅仅一周内，打上 `dsh-plugin` topic 的公共仓库数量从不到 500 增长到超过 4300。这代表短短七天内增长了 760%。' },
      { h2: '增长驱动力' },
      { ul: ['Copilot 式 AI 编码工具增加了对定制化的需求', 'GitHub Copilot 的限制推动用户转向开源替代品', 'dsh 公告为插件开发者创造了明确信号', '低门槛：任何带有 topic 的 GitHub 仓库都可被发现'] },
      { h2: '蹭标签问题' },
      { p: '并非所有增长都是健康的。大量新仓库使用了 `dsh-plugin` topic 但实际上并非 DSH 插件。这种"蹭标签"在发现机制中制造噪音，可能误导安装者认为某个插件是相关的。' },
      { h2: 'Quality Hub 如何帮助' },
      { p: '我们的每日评测管道通过分析仓库内容而非仅看 topic 来发现真实插件。它检查 `dsh.bundle` 声明、package.json 结构和实际插件代码。这过滤掉了蹭标签仓库，突显真正质量信号。' },
    ],
  },
};

function generateGenericBlog(topic: ReturnType<typeof getDailyBlog>) {
  const baseTitleEn = `${topic.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: A Deep Dive`;
  const baseTitleZh = `${topic.slug.replace(/-/g, ' ')}：深度解析`;
  return {
    titleEn: baseTitleEn,
    titleZh: baseTitleZh,
    excerptEn: `Understanding ${topic.slug.replace(/-/g, ' ')} in the DSH ecosystem.`,
    excerptZh: `理解 DSH 生态中的 ${topic.slug.replace(/-/g, ' ')}。`,
    metaDescriptionEn: `Learn about ${topic.slug.replace(/-/g, ' ')} patterns and best practices in DeepSeek Harness.`,
    metaDescriptionZh: `学习 DeepSeek Harness 中 ${topic.slug.replace(/-/g, ' ')} 的模式和最佳实践。`,
    bodyEn: [
      { h2: 'Introduction' },
      { p: `The ${topic.slug.replace(/-/g, ' ')} is an important pattern in the DSH ecosystem. This article explores how it works and why it matters for plugin developers.` },
      { h2: 'Key Concepts' },
      { ul: ['Understanding the basic pattern', 'Common implementation approaches', 'Best practices from the community'] },
      { h2: 'Getting Started' },
      { p: `To implement ${topic.slug.replace(/-/g, ' ')}, start with the official documentation and explore existing examples in the ecosystem.` },
    ],
    bodyZh: [
      { h2: '介绍' },
      { p: `${topic.slug.replace(/-/g, ' ')} 是 DSH 生态中的重要模式。本文探讨其工作原理及对插件开发者的意义。` },
      { h2: '核心概念' },
      { ul: ['理解基本模式', '常见实现方法', '社区的实践最佳'] },
      { h2: '入门指南' },
      { p: `要实现 ${topic.slug.replace(/-/g, ' ')}，从官方文档开始并探索生态中的现有示例。` },
    ],
  };
}

async function main() {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000) + 1;
  const dayInMonth = ((dayOfYear - 1) % 30) + 1;
  const dateStr = now.toISOString().slice(0, 10);
  
  console.log(`[gen-blog] Day ${dayInMonth}/30 of cycle`);
  
  const topic = getDailyBlog(dayInMonth);
  console.log(`[gen-blog] Processing: ${topic.slug}`);
  
  const content = BLOG_CONTENT[topic.slug] ?? generateGenericBlog(topic);
  
  const newPost = {
    slug: topic.slug,
    date: dateStr,
    keywords: topic.keywords,
    longTail: topic.longTail,
    en: {
      title: content.titleEn,
      excerpt: content.excerptEn,
      metaDescription: content.metaDescriptionEn,
      body: content.bodyEn,
    },
    zh: {
      title: content.titleZh,
      excerpt: content.excerptZh,
      metaDescription: content.metaDescriptionZh,
      body: content.bodyZh,
    },
  };
  
  // Append to posts.ts
  const postsFile = 'C:/worktmp/dsh-plugin-quality-hub/app/src/data/blog/posts.ts';
  let postsContent = readFileSync(postsFile, 'utf8');
  
  // Find the end of the blogPosts array
  const lastBracket = postsContent.lastIndexOf(']');
  const secondLastBracket = postsContent.lastIndexOf(']', lastBracket - 1);
  
  // Insert before the closing bracket
  const postStr = `\n  ${JSON.stringify(newPost, null, 2).replace(/"/g, "'").replace(/'/g, '"')}`;
  
  postsContent = postsContent.slice(0, lastBracket) + postStr + postsContent.slice(lastBracket);
  
  writeFileSync(postsFile, postsContent);
  console.log(`[gen-blog] Appended ${topic.slug} to posts.ts`);
}

main().catch(err => { console.error(err); process.exit(1); });
