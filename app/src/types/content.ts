// ============================================================
// 内容层类型 — Tutorial / Example 的 UI 形状
// 页面渲染直接用 Prisma 行类型(@prisma/client), 此处仅补
// 派生类型(level/category 联合)与列表项 DTO
// ============================================================

import type { ExampleCategory } from '@/lib/content-constants';

export type TutorialLevel = 'beginner' | 'intermediate' | 'advanced';

export type TutorialListItem = {
  slug: string;
  level: TutorialLevel;
  titleEn: string;
  titleZh: string;
  excerptEn: string;
  excerptZh: string;
  readingMinutes: number;
  publishedAt: string | null;
};

export type ExampleListItem = {
  slug: string;
  pluginName: string;
  category: ExampleCategory;
  titleEn: string;
  titleZh: string;
  excerptEn: string;
  excerptZh: string;
};
