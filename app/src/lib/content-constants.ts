// ============================================================
// 内容层常量 — 单一事实来源 (Spec §4.3 / §5.3)
// slug 常量: seed 与 BuildYourOwn CTA 共用, 改名只改一处
// category 常量: 对齐 awesome-dsh-plugin 11 分类
// ============================================================

export const TUTORIAL_SLUGS = {
  writeFirstPlugin: 'write-first-plugin',
  connectMcpTools: 'connect-mcp-tools',
  publishAndGetRated: 'publish-and-get-rated',
} as const;

export type TutorialSlugKey = keyof typeof TUTORIAL_SLUGS;

export const EXAMPLE_CATEGORIES = [
  'ui-enhancements', // UI 增强
  'themes-appearance', // 主题与外观
  'sessions-messages', // 会话与消息
  'memory', // 记忆
  'tools-capabilities', // 工具与能力
  'skills', // 技能包
  'workflow-automation', // 工作流与自动化
  'notifications-integrations', // 通知与集成
  'models-accounts', // 模型与账号接入
  'dev-runtime', // 开发与运行时
  'entertainment', // 娱乐
] as const;

export type ExampleCategory = (typeof EXAMPLE_CATEGORIES)[number];

export function isExampleCategory(value: string): value is ExampleCategory {
  return (EXAMPLE_CATEGORIES as readonly string[]).includes(value);
}
