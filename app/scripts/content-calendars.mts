// ============================================================
// 内容日历 — 30天教程/实例/博客规划
// 教程: 3个阶段各5篇 = 15篇，每天3篇(入门+进阶+高级)
// 实例: 30篇，每天1篇
// 博客: 30篇，每天1篇双语
// ============================================================

// ---- 教程内容规划 (30天 × 3级 = 90次发布，15个唯一主题循环) ----
export const TUTORIAL_TOPIC_PLAN = {
  beginner: [
    { day: 1, slug: 'write-first-plugin', titleEn: 'Write Your First DeepSeek Harness Plugin', titleZh: '从 0 写你的第一个 DeepSeek Harness 插件' },
    { day: 6, slug: 'understand-dsh-commands', titleEn: 'How DSH Commands Work', titleZh: '理解 DSH 命令系统' },
    { day: 11, slug: 'dsh-config-basics', titleEn: 'DSH Configuration Basics', titleZh: 'DSH 配置基础' },
    { day: 16, slug: 'plugin-lifecycle', titleEn: 'Understanding the Plugin Lifecycle', titleZh: '理解插件生命周期' },
    { day: 21, slug: 'ctx-api-intro', titleEn: 'The ctx API: Your Plugin\'s First Steps', titleZh: 'ctx API 入门：插件的第一步' },
  ],
  intermediate: [
    { day: 1, slug: 'connect-mcp-tools', titleEn: 'Bridge an MCP Server or Custom Tool', titleZh: '给 dsh 接入 MCP server 或自定义 tool' },
    { day: 6, slug: 'plugin-testing-strategies', titleEn: 'Testing Strategies for DSH Plugins', titleZh: 'DSH 插件测试策略' },
    { day: 11, slug: 'plugin-bundle-patterns', titleEn: 'Bundle Patterns: Multi-File Plugins', titleZh: 'Bundle 模式：多文件插件' },
    { day: 16, slug: 'error-handling-patterns', titleEn: 'Error Handling Patterns in DSH', titleZh: 'DSH 中的错误处理模式' },
    { day: 21, slug: 'plugin-debugging-guide', titleEn: 'Debugging DSH Plugins Effectively', titleZh: '高效调试 DSH 插件' },
  ],
  advanced: [
    { day: 1, slug: 'publish-and-get-rated', titleEn: 'Publish to GitHub topic dsh-plugin & Get Rated', titleZh: '把插件发布到 GitHub topic dsh-plugin 并拿到 Hub 评测' },
    { day: 6, slug: 'security-audit-patterns', titleEn: 'Security Audit Patterns for DSH Plugins', titleZh: 'DSH 插件安全审计模式' },
    { day: 11, slug: 'performance-optimization', titleEn: 'Performance Optimization for Large-Scale Plugins', titleZh: '大规模插件的性能优化' },
    { day: 16, slug: 'multi-agent-architecture', titleEn: 'Multi-Agent Architecture in DSH Plugins', titleZh: 'DSH 插件中的多代理架构' },
    { day: 21, slug: 'plugin-ci-cd-pipeline', titleEn: 'CI/CD Pipeline for DSH Plugins', titleZh: 'DSH 插件的 CI/CD 管道' },
  ],
} as const;

// ---- 实例内容规划 (30天，每天1篇) ----
export const EXAMPLE_TOPIC_PLAN = [
  { day: 1, slug: 'dsh-web-ui', pluginName: 'zhu1090093659/dsh-web-ui', category: 'ui-enhancements' },
  { day: 2, slug: 'modlens', pluginName: 'liustack/modlens', category: 'tools-capabilities' },
  { day: 3, slug: 'dsh-memory-evolve', pluginName: 'dsh-memory/dsh-memory-evolve', category: 'memory' },
  { day: 4, slug: 'mirage', pluginName: 'strukto-ai/mirage', category: 'themes-appearance' },
  { day: 5, slug: 'dsh-better-sidebar', pluginName: 'dsh-plugins/dsh-better-sidebar', category: 'ui-enhancements' },
  { day: 6, slug: 'dsh-feishu-bot', pluginName: 'dsh-plugins/dsh-feishu-bot', category: 'notifications-integrations' },
  { day: 7, slug: 'dsh-tui', pluginName: 'dsh-plugins/dsh-tui', category: 'ui-enhancements' },
  { day: 8, slug: 'dsh-chat-import', pluginName: 'dsh-plugins/dsh-chat-import', category: 'sessions-messages' },
  { day: 9, slug: 'openviking', pluginName: 'openviking/openviking', category: 'tools-capabilities' },
  { day: 10, slug: 'dsh-agent-teams', pluginName: 'vostride/agent-teams', category: 'workflow-automation' },
  { day: 11, slug: 'dsh-vision-router', pluginName: 'dsh-plugins/dsh-vision-router', category: 'tools-capabilities' },
  { day: 12, slug: 'agent-vision-toolkit', pluginName: 'agent-vision/agent-vision-toolkit', category: 'tools-capabilities' },
  { day: 13, slug: 'dsh-hooks-claude-code', pluginName: 'dsh-plugins/dsh-hooks-claude-code', category: 'dev-runtime' },
  { day: 14, slug: 'backup-tool', pluginName: 'deepseek-harness/backup-tool', category: 'workflow-automation' },
  { day: 15, slug: 'notifier', pluginName: 'ysr666/notifier', category: 'notifications-integrations' },
  { day: 16, slug: 'swagger-helper', pluginName: 'deepseek-harness/swagger-helper', category: 'tools-capabilities' },
  { day: 17, slug: 'dsh-at-file', pluginName: 'dsh-plugins/dsh-at-file', category: 'sessions-messages' },
  { day: 18, slug: 'dsh-skill-mgr', pluginName: 'dsh-plugins/dsh-skill-mgr', category: 'skills' },
  { day: 19, slug: 'dsh-model-switch', pluginName: 'dsh-plugins/dsh-model-switch', category: 'models-accounts' },
  { day: 20, slug: 'dsh-cron-runner', pluginName: 'dsh-plugins/dsh-cron-runner', category: 'workflow-automation' },
  { day: 21, slug: 'dsh-emoji-pack', pluginName: 'dsh-plugins/dsh-emoji-pack', category: 'entertainment' },
  { day: 22, slug: 'dsh-plugin-lint', pluginName: 'dsh-plugins/dsh-plugin-lint', category: 'dev-runtime' },
  { day: 23, slug: 'dsh-ecosystem-report', pluginName: 'dsh-plugins/dsh-ecosystem-report', category: 'workflow-automation' },
  { day: 24, slug: 'dsh-voice-assistant', pluginName: 'dsh-plugins/dsh-voice-assistant', category: 'tools-capabilities' },
  { day: 25, slug: 'dsh-code-reviewer', pluginName: 'dsh-plugins/dsh-code-reviewer', category: 'tools-capabilities' },
  { day: 26, slug: 'dsh-test-runner', pluginName: 'dsh-plugins/dsh-test-runner', category: 'dev-runtime' },
  { day: 27, slug: 'dsh-doc-generator', pluginName: 'dsh-plugins/dsh-doc-generator', category: 'tools-capabilities' },
  { day: 28, slug: 'dsh-config-validator', pluginName: 'dsh-plugins/dsh-config-validator', category: 'dev-runtime' },
  { day: 29, slug: 'dsh-plugin-boilerplate', pluginName: 'dsh-plugins/dsh-plugin-boilerplate', category: 'dev-runtime' },
  { day: 30, slug: 'dsh-quality-badge', pluginName: 'dsh-plugins/dsh-quality-badge', category: 'ui-enhancements' },
] as const;

// ---- 博客内容规划 (30天，每天1篇双语) ----
export const BLOG_TOPIC_PLAN = [
  { day: 1, slug: 'dsh-plugin-security-scanner-guide', keywords: ['dsh plugin security scanner', 'dsh quality score'], longTail: ['how to check dsh plugin security before install'] },
  { day: 2, slug: 'dsh-ecosystem-growth-analysis', keywords: ['dsh ecosystem growth', 'deepseek harness plugins'], longTail: ['dsh plugin ecosystem statistics 2026'] },
  { day: 3, slug: 'understanding-dsh-plugin-grades', keywords: ['dsh plugin grades', 'plugin quality scoring'], longTail: ['what does dsh grade a mean', 'dsh quality score explained'] },
  { day: 4, slug: 'dangerous-install-script-explained', keywords: ['dangerous install script', 'dsh security'], longTail: ['dsh install script warning', 'postinstall script risk'] },
  { day: 5, slug: 'dsh-vision-plugin-comparison', keywords: ['dsh vision plugins', 'image processing'], longTail: ['best dsh vision plugin', 'dsh modlens vs agent-vision'] },
  { day: 6, slug: 'dsh-plugin-security-best-practices', keywords: ['dsh security best practices', 'plugin safety'], longTail: ['how to write secure dsh plugins', 'dsh security audit checklist'] },
  { day: 7, slug: 'deepseek-harness-memory-system', keywords: ['dsh memory', 'session memory'], longTail: ['dsh cross-session memory', 'dsh memory plugin guide'] },
  { day: 8, slug: 'dsh-mcp-server-integration', keywords: ['dsh mcp server', 'model context protocol'], longTail: ['how to add mcp server to dsh', 'dsh mcp integration guide'] },
  { day: 9, slug: 'dsh-plugin-testing-guide', keywords: ['dsh plugin testing', 'unit testing plugins'], longTail: ['how to test dsh plugins', 'dsh testing strategies'] },
  { day: 10, slug: 'dsh-quality-badge-embed', keywords: ['dsh quality badge', 'plugin badges'], longTail: ['how to embed dsh quality badge', 'dsh badge api'] },
  { day: 11, slug: 'dsh-plugin-publishing-guide', keywords: ['publish dsh plugin', 'dsh plugin marketplace'], longTail: ['how to publish dsh plugin', 'dsh plugin github topic'] },
  { day: 12, slug: 'dsh-ui-plugin-development', keywords: ['dsh ui plugins', 'webui development'], longTail: ['build dsh webui plugin', 'dsh panel injection'] },
  { day: 13, slug: 'dsh-theme-customization', keywords: ['dsh themes', 'plugin skins'], longTail: ['dsh theme plugin guide', 'dsh skin customization'] },
  { day: 14, slug: 'dsh-notification-plugins', keywords: ['dsh notifications', 'bot integrations'], longTail: ['dsh feishu bot plugin', 'dsh notification system'] },
  { day: 15, slug: 'dsh-agent-architecture', keywords: ['dsh agents', 'multi-agent systems'], longTail: ['dsh multi-agent plugin', 'dsh agent teams'] },
  { day: 16, slug: 'dsh-plugin-cicd', keywords: ['dsh ci cd', 'plugin deployment'], longTail: ['dsh plugin automation', 'dsh continuous deployment'] },
  { day: 17, slug: 'dsh-performance-tips', keywords: ['dsh performance', 'plugin optimization'], longTail: ['optimize dsh plugin speed', 'dsh performance tuning'] },
  { day: 18, slug: 'dsh-error-handling', keywords: ['dsh error handling', 'plugin debugging'], longTail: ['debug dsh plugins', 'dsh error patterns'] },
  { day: 19, slug: 'dsh-plugin-security-audit', keywords: ['dsh security audit', 'plugin safety check'], longTail: ['how to audit dsh plugins', 'dsh security scanning'] },
  { day: 20, slug: 'dsh-voice-plugins', keywords: ['dsh voice', 'speech plugins'], longTail: ['dsh voice assistant plugin', 'dsh speech integration'] },
  { day: 21, slug: 'dsh-code-review-plugins', keywords: ['dsh code review', 'review tools'], longTail: ['dsh code review plugin', 'automated code review dsh'] },
  { day: 22, slug: 'dsh-test-runner-plugins', keywords: ['dsh test runner', 'testing automation'], longTail: ['dsh testing plugin', 'dsh test automation'] },
  { day: 23, slug: 'dsh-doc-generator', keywords: ['dsh documentation', 'doc generation'], longTail: ['dsh doc generator plugin', 'automated documentation dsh'] },
  { day: 24, slug: 'dsh-config-validation', keywords: ['dsh config', 'validation tools'], longTail: ['dsh configuration validation', 'dsh config checker'] },
  { day: 25, slug: 'dsh-plugin-boilerplate', keywords: ['dsh boilerplate', 'plugin template'], longTail: ['dsh plugin starter kit', 'dsh plugin template'] },
  { day: 26, slug: 'dsh-quality-badge-api', keywords: ['dsh badge api', 'quality badges'], longTail: ['dsh quality badge embed', 'dsh badge svg'] },
  { day: 27, slug: 'dsh-ecosystem-insights', keywords: ['dsh ecosystem', 'plugin statistics'], longTail: ['dsh plugin ecosystem report', 'dsh weekly stats'] },
  { day: 28, slug: 'dsh-plugin-lint', keywords: ['dsh lint', 'code quality'], longTail: ['dsh plugin linter', 'dsh code quality tool'] },
  { day: 29, slug: 'dsh-security-watch-guide', keywords: ['dsh security watch', 'realtime alerts'], longTrail: ['dsh security advisory', 'dsh vulnerability alerts'] },
  { day: 30, slug: 'dsh-plugin-development-roadmap', keywords: ['dsh roadmap', 'plugin development'], longTail: ['dsh plugin future', 'dsh ecosystem roadmap 2026'] },
] as const;

// ---- 获取当天应发布的条目 ----
export function getDailyTutorials(day: number) {
  const dayInCycle = ((day - 1) % 5) + 1;
  return {
    beginner: TUTORIAL_TOPIC_PLAN.beginner.find(t => t.day === dayInCycle)!,
    intermediate: TUTORIAL_TOPIC_PLAN.intermediate.find(t => t.day === dayInCycle)!,
    advanced: TUTORIAL_TOPIC_PLAN.advanced.find(t => t.day === dayInCycle)!,
  };
}

export function getDailyExample(day: number) {
  const dayInCycle = ((day - 1) % 30) + 1;
  return EXAMPLE_TOPIC_PLAN.find(e => e.day === dayInCycle)!: typeof EXAMPLE_TOPIC_PLAN[0];
}

export function getDailyBlog(day: number) {
  const dayInCycle = ((day - 1) % 30) + 1;
  return BLOG_TOPIC_PLAN.find(b => b.day === dayInCycle)!: typeof BLOG_TOPIC_PLAN[0];
}
