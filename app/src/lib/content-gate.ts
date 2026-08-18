// ============================================================
// 内容付费墙 (v1.3) — SSG 摘要 + 运行时鉴权 API
// 预览策略: tier=pro 的内容, SSG 只输出标题/摘要/前 PREVIEW_RATIO 正文
// 完整正文只从 /api/v1/content/* 鉴权返回, 绝不进 SSG HTML
// ============================================================

import { prisma } from '@/lib/prisma';

// 用户指定: 免费预览前 1/4 正文
export const PREVIEW_RATIO = 1 / 4;

/**
 * 截断 markdown 到前 ratio 比例（按字符数，保留段落边界友好）
 * 用于 SSG 免费预览。返回带截断标记的字符串。
 */
export function previewContent(content: string, ratio = PREVIEW_RATIO): string {
  if (!content) return '';
  const target = Math.max(200, Math.floor(content.length * ratio));
  if (content.length <= target) return content;
  // 在 target 附近找最近的换行，避免截断在代码块/句子中间
  let cut = content.lastIndexOf('\n', target);
  if (cut < target * 0.5) cut = target;
  const preview = content.slice(0, cut);
  return `${preview.trimEnd()}\n\n> *This is a preview. Upgrade to Pro to read the full tutorial.*`;
}

/**
 * 按 tier 决定返回哪个版本的教程。
 * - tier=free 或请求者 isPro: 返回完整内容
 * - tier=pro 且请求者非 pro: 返回摘要版 (仅用于 SSR 兜底/非鉴权路径)
 * 泛型保留调用方传入的完整字段（详情页 metadata 等）。
 */
export function gateTutorial<T extends { tier?: string; contentEn: string; contentZh: string }>(
  tutorial: T,
  isPro: boolean
) {
  const locked = tutorial.tier === 'pro' && !isPro;
  return {
    ...tutorial,
    locked,
    contentEn: locked ? previewContent(tutorial.contentEn) : tutorial.contentEn,
    contentZh: locked ? previewContent(tutorial.contentZh) : tutorial.contentZh,
  };
}

/**
 * 按 tier 决定返回哪个版本的实例（三维度拆解）。
 */
export function gateExample<T extends {
  tier?: string;
  configEn: string;
  configZh: string;
  codeEn: string;
  codeZh: string;
  highlightsEn: string;
  highlightsZh: string;
}>(example: T, isPro: boolean) {
  const locked = example.tier === 'pro' && !isPro;
  return {
    ...example,
    locked,
    configEn: locked ? previewContent(example.configEn) : example.configEn,
    configZh: locked ? previewContent(example.configZh) : example.configZh,
    codeEn: locked ? previewContent(example.codeEn) : example.codeEn,
    codeZh: locked ? previewContent(example.codeZh) : example.codeZh,
    highlightsEn: locked ? previewContent(example.highlightsEn) : example.highlightsEn,
    highlightsZh: locked ? previewContent(example.highlightsZh) : example.highlightsZh,
  };
}

// 查询 + gate 一站式（SSG 页面用，isPro 默认 false 给免费预览）
export async function getTutorialBySlugGated(slug: string, isPro = false) {
  const t = await prisma.tutorial.findUnique({ where: { slug } });
  if (!t) return null;
  return gateTutorial(t, isPro);
}

export async function getExampleBySlugGated(slug: string, isPro = false) {
  const e = await prisma.example.findUnique({ where: { slug } });
  if (!e) return null;
  return gateExample(e, isPro);
}
