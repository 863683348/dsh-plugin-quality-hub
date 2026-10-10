// src/data/blog/posts.ts — DSH Quality 双语博客数据层（列表 + 单篇路由）
// 站点15 dshquality.com · 2026-08-19 起由"纯列表卡片"升级为"列表 + /blog/{slug}/ 单篇路由"
// 约定：
//   - en 为真源；zh 必须与 en 键对齐（tsc 强约束）
//   - 每篇含 longTail 长尾词数组，正文首段自然嵌入主词与长尾词
//   - date 用 ISO（YYYY-MM-DD），展示时格式化
//   - 新文章由 0:10 自动化追加到 posts 数组末尾，日期=当天，标题不与已有/规划重复

export interface BlogBlock {
  h2?: string;
  h3?: string;
  p?: string;
  ul?: string[];
  table?: { head: string[]; rows: string[][] };
  blockquote?: string;
}

export interface BlogPost {
  slug: string;
  /** ISO 日期 YYYY-MM-DD，作为排序键与 canonical 依据 */
  date: string;
  keywords: string[];
  /** 长尾词（SEO），正文首段自然嵌入，详情页 meta keywords */
  longTail: string[];
  /** 社交媒体分享图片（1200×630，可选） */
  imageUrl?: string;
  en: {
    title: string;
    excerpt: string;
    metaDescription: string;
    body: BlogBlock[];
  };
  zh: {
    title: string;
    excerpt: string;
    metaDescription: string;
    body: BlogBlock[];
  };
}

// 详情页渲染用：扁平化提取纯文本便于 JSON-LD / description
export function postPlainText(post: BlogPost, locale: 'en' | 'zh'): string {
  const l = post[locale];
  const parts: string[] = [];
  for (const b of l.body) {
    if (b.p) parts.push(b.p);
    if (b.h2) parts.push(b.h2);
    if (b.h3) parts.push(b.h3);
    if (b.blockquote) parts.push(b.blockquote);
    if (b.ul) parts.push(...b.ul);
    if (b.table) parts.push(b.table.head.join(' '), ...b.table.rows.map((r) => r.join(' ')));
  }
  return parts.join(' ').slice(0, 500);
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'dsh-plugin-security-scanner-guide',
    date: '2026-08-18',
    keywords: ['dsh plugin security scanner', 'dsh quality score', 'plugin security audit'],
    longTail: ['how to check dsh plugin security before install', 'dsh quality score meaning', 'risky dsh plugins to avoid', 'dsh.bundle declaration missing'],
    en: {
      title: 'DSH Plugin Security Scanner: How to Spot Risky Plugins Before You Install Them',
      excerpt: 'A dsh plugin security scanner is the difference between a clean workspace and a compromised build. Learn how the DSH Quality score flags risky plugins before they enter your project.',
      metaDescription: 'How to check dsh plugin security before install: understand the DSH Quality score, spot missing dsh.bundle declarations, dangerous install scripts and stale repos before they compromise your build.',
      body: [
        { p: 'A dsh plugin security scanner isn\'t just a tool — it\'s the difference between a clean workspace and a compromised build. When you install plugins into your DeepSeek Harness environment, you\'re giving third-party code access to your system. The question isn\'t whether you should check before installing; it\'s whether you know what to look for.' },
        { h2: 'Understanding the DSH Quality Score' },
        { p: 'The DSH Quality Score evaluates plugins across four dimensions: maintenance health, documentation quality, npm ecosystem integration, and security posture. Every plugin receives a letter grade from A to D plus a 0-100 numerical score.' },
        { table: { head: ['Grade', 'Score Range', 'What It Means'], rows: [['A', '90-100', 'Excellent maintenance, clear docs, secure'], ['B', '75-89', 'Good health, minor documentation gaps'], ['C', '60-74', 'Acceptable but needs attention'], ['D', '0-59', 'High risk, avoid unless necessary']] } },
        { p: 'The current distribution shows 4 A-grade, 4 B-grade, 6 C-grade, and 7 D-grade plugins. That 35% risk rate (C+D) is exactly why a pre-install dsh plugin security audit matters.' },
        { h2: 'Three Red Flags You Cannot Ignore' },
        { h3: '1. Missing dsh.bundle declaration' },
        { p: 'This is the most common issue. Over half of the D-grade plugins lack the dsh.bundle declaration, which means the bundle structure was never properly defined or audited. Without it you have no guarantee the package is self-contained or that dependencies are scoped correctly.' },
        { h3: '2. Dangerous install scripts' },
        { p: 'Some plugins ship post-install scripts that execute arbitrary commands. This is the highest-risk warning. If a plugin flags "dangerous install script", never use it in a production environment.' },
        { h3: '3. Stale last-push dates' },
        { p: 'A plugin that has not been pushed in 30+ days may carry unpatched vulnerabilities. Security updates do not happen by themselves — they require active maintenance. Check last-push before trusting any plugin.' },
        { h2: 'How to Use the Scanner Effectively' },
        { ul: ['Check the grade before you click install — A and B passed the full audit; C needs extra scrutiny; D should be avoided unless there is no alternative.', 'Read the security warnings column — it tells you exactly what is wrong with each plugin.', 'Cross-reference with star count — a 2,000-star A-grade plugin like dsh-core is more trustworthy than a 5-star D-grade one.', 'Check maintenance frequency — recent pushes show active development; months of silence is a red flag.'] },
        { h2: 'What the Data Shows' },
        { p: 'Top performers (dsh-core, dsh-vision-router, dsh-context-bridge, dsh-memory-store) all score 84+ with recent activity. The middle tier offers solid B-grade alternatives for common needs. Problem cases (dsh-miner, dsh-telemetry, dsh-payload) all carry dangerous install script warnings.' },
        { p: 'The lesson is clear: run a dsh plugin security check before every installation. It takes seconds and could save you from a security incident.' }
      ],
    },
    zh: {
      title: 'DSH 插件安全扫描器：安装前如何识别风险插件',
      excerpt: 'dsh 插件安全扫描器是清洁工作区与被入侵构建之间的区别。了解 DSH Quality 评分如何在你安装前标记风险插件。',
      metaDescription: '安装前如何检查 dsh 插件安全：理解 DSH Quality 评分，识别缺失的 dsh.bundle 声明、危险安装脚本与过时仓库，避免构建被入侵。',
      body: [
        { p: 'dsh 插件安全扫描器不仅是一个工具——它是清洁工作区与被入侵构建之间的区别。当你为 DeepSeek Harness 环境安装插件时，你实际上是在允许第三方代码访问你的系统。问题不是你该不该检查，而是你知道该看什么。' },
        { h2: '理解 DSH Quality Score' },
        { p: 'DSH Quality Score 从四个维度评估插件：维护健康度、文档质量、npm 生态系统集成、安全态势。每个插件获得 A 到 D 的字母等级和 0-100 的数值分数。' },
        { table: { head: ['等级', '分数范围', '含义'], rows: [['A', '90-100', '维护优秀，文档清晰，安全'], ['B', '75-89', '健康状况良好，文档有小缺口'], ['C', '60-74', '可用但需要关注'], ['D', '0-59', '高风险，非必要避免使用']] } },
        { p: '当前分布显示 4 个 A 级、4 个 B 级、6 个 C 级和 7 个 D 级插件。35% 的风险率（C+D）正是安装前做 dsh 插件安全审计重要的原因。' },
        { h2: '三个不能忽视的红牌警告' },
        { h3: '1. 缺少 dsh.bundle 声明' },
        { p: '这是最常见的问题。超过一半的 D 级插件缺少 dsh.bundle 声明，意味着包结构从未被正确定义或审计。没有它，你无法保证包自包含或依赖项被正确作用域化。' },
        { h3: '2. 危险安装脚本' },
        { p: '某些插件携带执行任意命令的 post-install 脚本。这是最高风险警告。如果插件标记了"危险安装脚本"，绝不应在生产环境使用。' },
        { h3: '3. 过期的最后推送日期' },
        { p: '超过 30 天未推送的插件可能包含未修补的漏洞。安全更新不会自动发生——它们需要主动维护。信任任何插件前先检查最后推送时间。' },
        { h2: '如何有效使用扫描器' },
        { ul: ['安装前先检查等级——A/B 已通过完整审计；C 需要额外审查；D 除非没有替代否则应避免。', '阅读安全警告列——它准确告诉你每个插件的问题。', '交叉参考星数——2000 星的 A 级插件（如 dsh-core）比 5 星的 D 级插件更值得信赖。', '检查维护频率——近期推送显示活跃开发；数月沉默是红旗。'] },
        { h2: '数据说明了什么' },
        { p: '顶级表现者（dsh-core、dsh-vision-router、dsh-context-bridge、dsh-memory-store）评分均 84+ 且有近期活动。中层提供可靠的 B 级替代方案。问题案例（dsh-miner、dsh-telemetry、dsh-payload）都携带危险安装脚本警告。' },
        { p: '教训很明确：每次安装前运行 dsh 插件安全检查。只需几秒，却能避免安全事件。' }
      ],
    },
  },
  {
    slug: 'dsh-plugin-ecosystem-explosion-analysis',
    date: '2026-08-18',
    keywords: ['dsh plugin ecosystem', 'dsh plugin growth', 'tag farming'],
    longTail: ['why dsh plugin count exploded', 'dsh plugin tag baiting problem', 'how many dsh plugins exist'],
    en: {
      title: 'The DSH Plugin Explosion: 4,300 Plugins in Days, and What It Means for You',
      excerpt: 'The DeepSeek Harness ecosystem grew past 4,300 plugins within days. We break down the numbers, the tag-baiting problem, and what it means for installers.',
      metaDescription: 'Why the dsh plugin count exploded past 4,300 in days: growth math, tag farming and tag baiting in the dsh plugin ecosystem, and practical advice for installers.',
      body: [
        { p: 'If you\'ve watched the dsh plugin ecosystem over the past few weeks you already know how fast it moved. What started as a handful of curated plugins became thousands in a matter of days — and not all of that growth is healthy. Here is the breakdown of why the dsh plugin count exploded, and what it means when you search for a plugin to install.' },
        { h2: 'How 4,300 Plugins Appeared So Fast' },
        { p: 'The DeepSeek Harness runtime made "everything is a plugin" the default mental model, and the community responded. Plugin authors published tools, integrations, themes and utilities at a pace we have not seen in other ecosystems. Growth that took years elsewhere happened in days here.' },
        { ul: ['Low publishing friction: a dsh.bundle + package.json is enough to publish.', 'A viral topic on GitHub: topic:dsh-plugin became one of the fastest-growing tags.', 'AI-assisted generation: many plugins are scaffolded with the official SDK and shipped quickly.'] },
        { h2: 'The Tag-Baiting Problem' },
        { p: 'Rapid growth attracts noise. Some repositories add the dsh-plugin topic without shipping a real plugin — no dsh.bundle declaration, no runtime entry point, nothing that actually loads in the harness. That is tag farming: using a trending topic to pull in stars, watchers, and install traffic.' },
        { p: 'Our scanner treats a missing dsh.bundle declaration as a security signal, and it is the single most common flag among low-grade plugins. If you are evaluating a plugin, the topic tag alone is not a quality signal — it is closer to the opposite.' },
        { h2: 'What This Means for Installers' },
        { ul: ['Do not install by name alone: check the DSH Quality grade and the security warnings column.', 'Prefer plugins with a dsh.bundle declaration and a recent last-push date.', 'Be suspicious of overnight star counts — they often correlate with tag farming, not community vetting.'] },
        { p: 'The ecosystem is young and genuinely exciting. The same energy that produced 4,300 plugins also produced the noise — and a pre-install quality check is the cheapest way to tell them apart.' }
      ],
    },
    zh: {
      title: 'DSH 插件大爆发：数天内 4300+ 插件，对你意味着什么',
      excerpt: 'DeepSeek Harness 生态在几天内超过 4300 个插件。我们拆解数字、蹭标签问题，以及它对安装者的意义。',
      metaDescription: 'dsh 插件数量为何在数天内爆发到 4300+：增长算术、dsh 插件生态中的蹭标签问题，以及给安装者的实用建议。',
      body: [
        { p: '如果你过去几周关注过 dsh 插件生态，你已经知道它发展得多快。从少数几个精选插件开始，数天内变成了数千个——而且并非所有增长都是健康的。下面是 dsh 插件数量为何爆发，以及当你搜索要安装的插件时这意味着什么。' },
        { h2: '4300 个插件为何出现得这么快' },
        { p: 'DeepSeek Harness 运行时把"一切皆插件"变成默认心智模型，社区积极响应。插件作者以其他生态中从未见过的速度发布工具、集成、主题与工具类插件。其他地方需要数年的增长在这里数天就完成了。' },
        { ul: ['发布摩擦低：一个 dsh.bundle + package.json 就足以发布。', 'GitHub 上的热门话题：topic:dsh-plugin 成为增长最快的话题之一。', 'AI 辅助生成：许多插件用官方 SDK 快速脚手架并迅速发布。'] },
        { h2: '蹭标签问题' },
        { p: '快速增长吸引噪音。一些仓库添加 dsh-plugin 话题却没有发布真正的插件——没有 dsh.bundle 声明、没有运行时入口、没有任何能在 harness 中加载的东西。这就是蹭标签：利用热门话题获取星标、关注与安装流量。' },
        { p: '我们的扫描器把缺失 dsh.bundle 声明当作安全信号，这是低分插件中最常见的标记。如果你在评估插件，话题标签本身不是质量信号——它更接近反义。' },
        { h2: '对安装者意味着什么' },
        { ul: ['不要只看名字安装：检查 DSH Quality 等级与安全警告列。', '优先选择有 dsh.bundle 声明与近期推送日期的插件。', '警惕一夜暴涨的星数——它通常与蹭标签相关，而非社区审核。'] },
        { p: '生态年轻且真正令人兴奋。产生 4300 个插件的能量也产生了噪音——安装前的质量检查是区分它们最便宜的方式。' }
      ],
    },
  },
  {
    slug: 'how-install-script-scanning-works',
    date: '2026-08-18',
    keywords: ['install script scanning', 'dangerous install scripts', 'dsh plugin scanner'],
    longTail: ['how dsh install script scanning works', 'dangerous npm install scripts detection', 'what install script scanner checks'],
    en: {
      title: 'How Install Script Scanning Works Inside the DSH Quality Scanner',
      excerpt: 'A look inside our dangerous-pattern scanner: what it checks, what it misses, and how to read the results responsibly.',
      metaDescription: 'How dsh install script scanning works: dangerous npm install scripts detection, what the scanner checks and misses, and how to interpret security results.',
      body: [
        { p: 'Install script scanning is the part of DSH Quality people ask about most. When a plugin runs an install script it gets arbitrary code execution on your machine during npm install — which is exactly what a malicious package wants. Here is how our dsh install script scanning works under the hood.' },
        { h2: 'What the Scanner Checks' },
        { p: 'We inspect the package manifest and scripts that run during install, looking for patterns that should never appear in a well-behaved plugin:' },
        { ul: ['curl / wget piped to sh or bash — the classic remote-code-execution pattern.', 'Base64-encoded commands or obfuscated strings in postinstall.', 'Network exfiltration calls (POST to unknown endpoints, reading env files).', 'File-system sweepers that touch home directories or ssh keys.', 'Package manager reinstall loops or self-modifying scripts.'] },
        { h2: 'What It Misses' },
        { p: 'Heuristics are not a proof of safety. A determined attacker can obfuscate past string matching, fetch a payload at runtime, or hide behavior inside a dependency. That is why the scanner flags "dangerous install script" as a hard veto on the grade — but absence of a flag is not a clean bill of health.' },
        { h2: 'How to Read the Results' },
        { ul: ['Dangerous install script flag: do not install. Even for evaluation, run it in an isolated environment.', 'Missing dsh.bundle: verify the plugin loads before trusting it; it is a warning, not a guarantee of malice.', 'No flags: still review the plugin repo if you plan to run it with privileged access.'] },
        { p: 'The goal of the scanner is to make risky dsh plugins visible in seconds. Treat it as your first filter — not your last.' }
      ],
    },
    zh: {
      title: 'DSH Quality 扫描器内部的安装脚本扫描是如何工作的',
      excerpt: '走进我们的危险模式扫描器：它检查什么、会漏掉什么，以及如何负责任地解读结果。',
      metaDescription: 'dsh 安装脚本扫描如何工作：危险 npm 安装脚本检测、扫描器检查什么与漏掉什么，以及如何解读安全结果。',
      body: [
        { p: '安装脚本扫描是 DSH Quality 中被问得最多的部分。插件运行安装脚本时，它在 npm install 期间于你的机器上获得任意代码执行能力——这正是恶意包想要的。下面是我们的 dsh 安装脚本扫描在底层如何工作。' },
        { h2: '扫描器检查什么' },
        { p: '我们检查包清单与安装期间运行的脚本，寻找良善插件中绝不应出现的模式：' },
        { ul: ['curl / wget 管道到 sh 或 bash——经典的远程代码执行模式。', 'postinstall 中的 Base64 编码命令或混淆字符串。', '网络外传调用（POST 到未知端点、读取 env 文件）。', '触及主目录或 ssh 密钥的文件系统清扫器。', '包管理器重装循环或自修改脚本。'] },
        { h2: '它会漏掉什么' },
        { p: '启发式不是安全证明。坚定的攻击者可以混淆字符串匹配、在运行时获取 payload、或把行为藏在依赖中。这就是为什么扫描器把"危险安装脚本"标记为等级硬否决——但标记缺失不等于完全干净。' },
        { h2: '如何解读结果' },
        { ul: ['危险安装脚本标记：不要安装。即使评估也要在隔离环境运行。', '缺失 dsh.bundle：先验证插件能加载再信任；它是警告，不是恶意的保证。', '无标记：如果你打算以特权访问运行它，仍要审查插件仓库。'] },
        { p: '扫描器的目标是在几秒内让风险 dsh 插件可见。把它当作你的第一道过滤器——不是最后一道。' }
      ],
    },
  },
  {
    slug: 'deepseek-harness-everything-is-a-plugin',
    date: '2026-08-19',
    keywords: ['deepseek-harness', 'dsh runtime', 'Cordis core'],
    longTail: ['deepseek harness plugin architecture explained', 'dsh runtime cordis core python sdk', 'how deepseek harness plugins work'],
    en: {
      title: 'DeepSeek Harness 101: Everything Is a Plugin',
      excerpt: 'The deepseek-ai/deepseek-harness repository launched on June 10, 2026 with a bold premise: everything is a plugin. Here is how the dsh runtime, Cordis core, and the Python SDK fit together.',
      metaDescription: 'DeepSeek Harness plugin architecture explained: how the dsh runtime, Cordis core and Python SDK fit together, and what the everything-is-a-plugin premise means for developers.',
      body: [
        { p: 'The deepseek-ai/deepseek-harness repository went public on June 10, 2026 with a premise that took a while to sink in: everything is a plugin. The runtime, the CLI, the web UI, even the agent skills — all of it loads through the same plugin interface. If you have been trying to understand the deepseek harness plugin architecture, this is the mental model to start with.' },
        { h2: 'The dsh Runtime at the Center' },
        { p: 'The dsh runtime is the process that loads and executes plugins. It defines the lifecycle — discover, load, validate, run — and it is what enforces the dsh.bundle contract. Plugins declare their entry points in the bundle; the runtime resolves dependencies and sandboxes execution where the platform allows.' },
        { h2: 'Cordis Core as the Kernel' },
        { p: 'Underneath the runtime sits Cordis core, the dependency-injection kernel inherited from the Cordis framework. It wires services, manages contexts, and gives plugins a predictable environment to talk to each other. Understanding Cordis matters because plugin configuration, context isolation, and service overrides all flow through it.' },
        { h2: 'The Python SDK for Plugin Authors' },
        { p: 'Most plugins are written against the official Python SDK, which wraps the runtime contract in familiar Python: a class, a few decorators, a bundle manifest. The SDK hides most of the machinery — but knowing it is there helps when a plugin misbehaves, because the error almost always traces back to a contract violation the SDK tried to smooth over.' },
        { h2: 'Why the Architecture Matters for Installers' },
        { ul: ['Everything being a plugin means every piece of code you install gets the same runtime privileges — and the same risk profile.', 'The dsh.bundle declaration is the one contract the runtime checks; its absence is a legitimate warning.', 'Cordis-based isolation is only as strong as the sandbox beneath it (see our Landlock deep dive).'] },
        { p: 'Once you see the architecture as one plugin interface with a kernel underneath, the ecosystem stops looking chaotic. It also becomes clear why quality scoring and security scanning of individual plugins matter so much.' }
      ],
    },
    zh: {
      title: 'DeepSeek Harness 入门：一切皆插件',
      excerpt: 'deepseek-ai/deepseek-harness 仓库于 2026 年 6 月 10 日上线，带着一个大胆的前提：一切皆插件。本文拆解 dsh 运行时、Cordis 内核与 Python SDK 如何组合在一起。',
      metaDescription: 'DeepSeek Harness 插件架构详解：dsh 运行时、Cordis 内核与 Python SDK 如何组合，以及"一切皆插件"前提对开发者的意义。',
      body: [
        { p: 'deepseek-ai/deepseek-harness 仓库于 2026 年 6 月 10 日公开上线，带着一个需要时间消化的前提：一切皆插件。运行时、CLI、Web UI，甚至 agent skills——全部通过同一个插件接口加载。如果你一直在试图理解 deepseek harness 插件架构，这就是该从哪个心智模型开始。' },
        { h2: '中心的 dsh 运行时' },
        { p: 'dsh 运行时是加载并执行插件的进程。它定义生命周期——发现、加载、验证、运行——并执行 dsh.bundle 契约。插件在 bundle 中声明入口点；运行时解析依赖并在平台允许处做沙箱化执行。' },
        { h2: 'Cordis Core 作为内核' },
        { p: '运行时下面是 Cordis core，继承自 Cordis 框架的依赖注入内核。它装配服务、管理上下文，给插件一个可预测的彼此通信环境。理解 Cordis 很重要，因为插件配置、上下文隔离与服务覆写都流经它。' },
        { h2: '面向插件作者的 Python SDK' },
        { p: '大多数插件基于官方 Python SDK 编写，它把运行时契约包装成熟悉的 Python：一个类、几个装饰器、一个 bundle manifest。SDK 隐藏了大部分机制——但知道它存在有助排查，因为插件出问题时，错误几乎总能追溯到 SDK 试图平滑处理的契约违规。' },
        { h2: '架构对安装者为何重要' },
        { ul: ['一切皆插件意味着你安装的每一段代码获得相同的运行时权限——以及相同的风险画像。', 'dsh.bundle 声明是运行时检查的唯一契约；缺失是合理警告。', 'Cordis 隔离的强度只取决于底层沙箱（参见我们的 Landlock 深度解读）。'] },
        { p: '一旦把架构看作一个底层有内核的插件接口，生态就不再混乱。同时也很清楚为什么对单个插件的质量评分与安全扫描如此重要。' }
      ],
    },
  },
  {
    slug: 'dsh-cli-journey-rc7-road-to-1.0',
    date: '2026-08-20',
    keywords: ['dsh CLI', 'deepseek-harness CLI', 'v0.1.0-rc.7'],
    longTail: ['dsh cli v0.1.0-rc.7 changes', 'deepseek harness cli web ui onboarding', 'dsh cli plugin install command'],
    en: {
      title: 'The dsh CLI Journey: v0.1.0-rc.7 and the Road to 1.0',
      excerpt: 'Twelve thousand commits later, the dsh CLI sits at v0.1.0-rc.7 with the Web UI as the primary onboarding path. What early adopters should know about the plugin architecture and what changed in August.',
      metaDescription: 'dsh CLI v0.1.0-rc.7 changes and the road to 1.0: Web UI onboarding, plugin install workflow, and what early adopters should know about deepseek-harness CLI.',
      body: [
        { p: 'Twelve thousand commits later, the dsh CLI sits at v0.1.0-rc.7 — still pre-1.0, but unmistakably the backbone of the deepseek-harness experience. This post covers what changed in the dsh CLI v0.1.0-rc.7 cycle, why the Web UI became the primary onboarding path, and what early adopters should know about installing plugins from the command line.' },
        { h2: 'What v0.1.0-rc.7 Changed' },
        { ul: ['Web UI onboarding: new users now bootstrap through a browser flow instead of fighting flags on the terminal.', 'Tighter plugin install workflow: dsh plugin install validates the dsh.bundle declaration before touching the filesystem.', 'Better error surfacing: contract violations now print actionable messages instead of stack traces.'] },
        { h2: 'Why the Web UI Took Over Onboarding' },
        { p: 'A CLI with a rich plugin ecosystem has a discovery problem: you cannot browse plugins from a shell. The Web UI fixes that with a searchable catalog, one-click installs, and visible security warnings before you commit. The CLI remains for scripting and power users, but the browser is now the front door.' },
        { h2: 'Installing Plugins from the CLI' },
        { p: 'The core command is still dsh plugin install <name>, and it stays fast and scriptable. The relevant change is validation: the runtime refuses plugins without a valid dsh.bundle and warns on risky install scripts before executing them. If you automate installs, upgrade your scripts against the new exit codes — the old silent-failure path is gone.' },
        { h2: 'The Road to 1.0' },
        { p: 'The maintainers have been explicit that 1.0 will not land until the plugin contract stops churning. For plugin authors that means pinning the SDK, watching the changelog, and re-testing against each rc. For installers it means the ecosystem is still moving — check quality scores and last-push dates more often, not less.' }
      ],
    },
    zh: {
      title: 'dsh CLI 之旅：v0.1.0-rc.7 与通往 1.0 之路',
      excerpt: '一万二千次提交之后，dsh CLI 停在 v0.1.0-rc.7，Web UI 成为主要上手路径。早期采用者应该了解的插件架构要点，以及八月发生了什么变化。',
      metaDescription: 'dsh CLI v0.1.0-rc.7 变化与通往 1.0 之路：Web UI 上手、插件安装工作流，以及早期采用者应该了解的 deepseek-harness CLI 要点。',
      body: [
        { p: '一万二千次提交之后，dsh CLI 停在 v0.1.0-rc.7——仍处于 1.0 之前，但无疑是 deepseek-harness 体验的骨干。本文覆盖 dsh CLI v0.1.0-rc.7 周期内改变了什么、为什么 Web UI 成为主要上手路径，以及早期采用者在命令行安装插件时该知道什么。' },
        { h2: 'v0.1.0-rc.7 改变了什么' },
        { ul: ['Web UI 上手：新用户现在通过浏览器流程引导，而不是在终端与 flags 搏斗。', '更严格的插件安装工作流：dsh plugin install 在触碰文件系统前验证 dsh.bundle 声明。', '更好的错误呈现：契约违规现在打印可操作的提示，而非堆栈跟踪。'] },
        { h2: '为什么 Web UI 接管上手' },
        { p: '拥有丰富插件生态的 CLI 有发现难题：你无法从 shell 浏览插件。Web UI 用可搜索的目录、一键安装和提交前可见的安全警告解决了它。CLI 仍然服务于脚本与高级用户，但浏览器现在是前门。' },
        { h2: '从 CLI 安装插件' },
        { p: '核心命令仍是 dsh plugin install <name>，它保持快速与可脚本化。相关变化是验证：运行时拒绝没有有效 dsh.bundle 的插件，并在执行前警告风险安装脚本。如果你自动化安装，请针对新退出码升级脚本——旧的静默失败路径已消失。' },
        { h2: '通往 1.0 之路' },
        { p: '维护者明确表示，在插件契约停止变动之前 1.0 不会落地。对插件作者这意味着固定 SDK、关注 changelog、针对每个 rc 重测。对安装者意味着生态仍在变动——更频繁地检查质量评分与最后推送日期，而不是更少。' }
      ],
    },
  },
  {
    slug: 'landlock-sandboxing-plugin-isolation',
    date: '2026-08-21',
    keywords: ['Landlock', 'sandboxing', 'plugin isolation', 'dsh runtime'],
    longTail: ['landlock sandbox dsh plugin isolation', 'how deepseek harness sandboxes plugins', 'landlock-run native sandbox explained'],
    en: {
      title: 'Landlock Sandboxing: How deepseek-harness Isolates Plugins',
      excerpt: 'The landlock-run native sandbox brings Linux Landlock to the dsh runtime. A closer look at why plugin isolation matters and how it changes the security math for installers.',
      metaDescription: 'Landlock sandbox for dsh plugin isolation: how deepseek-harness sandboxes plugins with landlock-run, why isolation matters, and how it changes installer security.',
      body: [
        { p: 'Plugin isolation is the feature that turns a risky plugin from an incident into a non-event. deepseek-harness ships the landlock-run native sandbox, which brings Linux Landlock to the dsh runtime. This post explains how Landlock sandboxing works, what the dsh plugin isolation model actually covers, and why it changes the security math for installers.' },
        { h2: 'What Landlock Gives You' },
        { p: 'Landlock is an unprivileged Linux security module: a process can restrict its own filesystem access with fine-grained rules, no root required. landlock-run wraps the dsh runtime so every plugin runs inside a rule set defined by its bundle manifest — read-only on system paths, write access only to its own data directory, no touching of home or ssh keys.' },
        { h2: 'What the Isolation Model Covers' },
        { ul: ['Filesystem: scoped read/write, with an explicit allowlist for the plugin data dir.', 'Network: landlock-run setups can pair with network namespaces to block or allow outbound traffic.', 'Execution: child processes inherit the restricted ruleset instead of escaping it.'] },
        { h2: 'What It Does Not Cover' },
        { p: 'Landlock is filesystem-first. It does not magically contain memory-safety bugs, and it relies on the kernel version supporting the feature (Linux 5.13+). On platforms without Landlock, the runtime degrades to advisory isolation — which is exactly when you should trust the quality score and install-script scan even more.' },
        { h2: 'The New Security Math for Installers' },
        { p: 'With sandboxing, a dangerous install script becomes containable rather than catastrophic. But containment is a safety net, not a license to install anything. The recommended posture: let the scanner veto obvious risk, let Landlock contain the rest, and still review anything you plan to run with privileges. Sandboxes make mistakes survivable; they do not make them safe.' }
      ],
    },
    zh: {
      title: 'Landlock 沙箱：deepseek-harness 如何隔离插件',
      excerpt: 'landlock-run 原生沙箱把 Linux Landlock 引入 dsh 运行时。深入看插件隔离为何重要，以及它如何改变安装者的安全计算。',
      metaDescription: 'Landlock 沙箱与 dsh 插件隔离：deepseek-harness 如何用 landlock-run 沙箱化插件、隔离为何重要，以及它如何改变安装者的安全决策。',
      body: [
        { p: '插件隔离是把风险插件从"安全事故"变成"无事发生"的功能。deepseek-harness 自带 landlock-run 原生沙箱，把 Linux Landlock 引入 dsh 运行时。本文解释 Landlock 沙箱如何工作、dsh 插件隔离模型实际覆盖什么，以及它为何改变安装者的安全计算。' },
        { h2: 'Landlock 给你什么' },
        { p: 'Landlock 是一个无特权 Linux 安全模块：进程可以用细粒度规则限制自己的文件系统访问，无需 root。landlock-run 包装 dsh 运行时，让每个插件运行在其 bundle manifest 定义的规则集内——系统路径只读、只写自己的数据目录、不触碰 home 或 ssh 密钥。' },
        { h2: '隔离模型覆盖什么' },
        { ul: ['文件系统：作用域读写，插件数据目录有显式白名单。', '网络：landlock-run 设置可与网络命名空间配合，阻止或允许出站流量。', '执行：子进程继承受限规则集而非逃逸它。'] },
        { h2: '它不覆盖什么' },
        { p: 'Landlock 以文件系统为先。它不会神奇地包含内存安全 bug，且依赖支持该特性的内核版本（Linux 5.13+）。在没有 Landlock 的平台上，运行时降级为建议性隔离——此时你更应该信任质量评分与安装脚本扫描。' },
        { h2: '安装者的新安全计算' },
        { p: '有了沙箱，危险安装脚本变得可遏制而非灾难性。但遏制是安全网，不是随便安装的许可。推荐姿态：让扫描器否决明显风险，让 Landlock 遏制其余，仍要审查任何打算以特权运行的东西。沙箱让错误可承受；它不会让错误变安全。' }
      ],
    },
  },
  {
    slug: 'dangerous-install-script-explained',
    date: '2026-08-21',
    keywords: ['dangerous install script', 'dsh security', 'postinstall risk'],
    longTail: ['dsh install script warning', 'postinstall script risk', 'what is dangerous install script'],
    en: {
      title: 'What "Dangerous Install Script" Means in DSH Plugin Scanning',
      excerpt: 'When DSH scans a plugin and flags a dangerous install script, what does it mean? Here is what you need to know about postinstall risks.',
      metaDescription: 'Learn what dangerous install scripts are in DSH plugin scanning, how the scanner detects them, and what to do when you see a warning.',
      body: [
        { h2: 'What Is an Install Script?' },
        { p: 'When you install a DSH plugin, the package manager may run a script automatically before or after installation. This is called a "postinstall" or "preinstall" script. These scripts can execute arbitrary code on your system.' },
        { h2: 'Why Install Scripts Are Dangerous' },
        { p: 'A malicious install script can exfiltrate your environment variables (API keys, tokens), install additional malware, modify system files, send your code to external servers, or mine cryptocurrency using your resources.' },
        { h2: 'How DSH Quality Scanner Detects Risks' },
        { p: 'Our scanner analyzes: script content through static analysis, network requests to check for outbound connections, file modifications to detect writes to sensitive directories, and environment access to find reads of sensitive variables.' },
        { h2: 'Common Red Flags' },
        { table: { head: ['Pattern', 'Risk Level', 'Example'], rows: [['curl | bash', 'Critical', 'Downloading and executing remote code'], ['Accessing process.env', 'High', 'Reading API keys or tokens'], ['Writing to ~/.ssh/', 'Critical', 'Modifying SSH keys'], ['Base64 encoded payloads', 'High', 'Obfuscated malicious code']] } },
        { h2: 'What to Do When You See a Warning' },
        { ul: ['Do not ignore it — warnings exist for a reason', 'Read the script — check what the install script actually does', 'Research the author — is the plugin from a trusted source?', 'Consider alternatives — are there safer alternatives?'] },
        { h2: 'Best Practices' },
        { ul: ['Always review install scripts before running them', 'Use sandbox environments for untrusted plugins', 'Keep your DSH Quality scanner updated', 'Report suspicious plugins to the community'] }
      ],
    },
    zh: {
      title: 'DSH 插件扫描中的"危险安装脚本"是什么意思',
      excerpt: '当 DSH 扫描插件并标记危险安装脚本时，这意味着什么？以下是关于 postinstall 风险的详细说明。',
      metaDescription: '了解 DSH 插件扫描中的危险安装脚本，扫描仪如何检测它们，以及看到警告时该怎么做。',
      body: [
        { h2: '什么是安装脚本？' },
        { p: '安装 DSH 插件时，包管理器可能会在安装前或安装后自动运行脚本。这称为"postinstall"或"preinstall"脚本。这些脚本可以在您的系统上执行任意代码。' },
        { h2: '为什么安装脚本很危险' },
        { p: '恶意的安装脚本可以窃取您的环境变量（API 密钥、令牌），安装额外的恶意软件，修改系统文件，将您的代码发送到外部服务器，或使用您的资源进行加密货币挖矿。' },
        { h2: 'DSH Quality 扫描仪如何检测风险' },
        { p: '我们的扫描仪分析：通过静态分析脚本内容、检查出站连接的网络请求、检测写入敏感目录的文件修改，以及查找读取敏感变量的环境变量访问。' },
        { h2: '常见危险信号' },
        { table: { head: ['模式', '风险等级', '示例'], rows: [['curl | bash', '严重', '下载并执行远程代码'], ['访问 process.env', '高', '读取 API 密钥或令牌'], ['写入 ~/.ssh/', '严重', '修改 SSH 密钥'], ['Base64 编码的有效载荷', '高', '混淆的恶意代码']] } },
        { h2: '看到警告时该怎么做' },
        { ul: ['不要忽略它——警告的存在是有原因的', '阅读脚本——检查安装脚本实际做什么', '研究作者——插件是否来自可信来源？', '考虑替代方案——是否有更安全的替代方案？'] },
        { h2: '最佳实践' },
        { ul: ['运行脚本前始终审查安装脚本', '对不可信的插件使用沙箱环境', '保持 DSH Quality 扫描仪更新', '向社区报告可疑插件'] }
      ],
    },
  },
  {
    slug: 'dsh-top-10-security-scanner-deep-dive',
    date: '2026-08-21',
    keywords: ['dsh plugin security scanner', 'top dsh plugins security', 'plugin quality grade'],
    longTail: ['dsh plugin security scanner top 10 review', 'best dsh plugins security grade A', 'dsh quality score top performers', 'safe dsh plugins to install 2026'],
    imageUrl: '/images/blog/dsh-top-10-security-scanner-deep-dive.svg',
    en: {
      title: 'DSH Plugin Security Scanner: Top 10 Plugins Analyzed and Graded',
      excerpt: 'We scanned the top 10 DSH plugins by GitHub stars to find which ones pass the security audit. Results: 7 A-grade, 2 B-grade, 1 D-grade — and here is what the D-grade plugin got wrong.',
      metaDescription: 'Deep dive into DSH plugin security scanning: we analyzed the top 10 plugins by stars. 7 earned A-grade, 2 earned B-grade, and 1 failed security checks. See which plugins are safe to install.',
      body: [
        { h2: 'Why Scan the Top 10?' },
        { p: 'When a new ecosystem explodes — the dsh-plugin topic now has over 11,000 repositories — most users reach for the highest-starred plugins first. That makes security scanning the top 10 not just useful but essential. A single compromised plugin in that list could mislead thousands of installers.' },
        { h2: 'The Testing Methodology' },
        { p: 'We evaluated each plugin across four dimensions using the DSH Quality scoring framework: maintenance health (last push, commit frequency), documentation quality (README completeness, usage examples), npm ecosystem integration (dsh.bundle presence, dependency hygiene), and security posture (install script analysis, known CVEs, permission scope).' },
        { h2: 'Results: The Grade Distribution' },
        { table: { head: ['Rank', 'Plugin', 'Stars', 'Grade', 'Security Warnings'], rows: [['1', 'deepseek-harness', '179k', 'A (92)', 'None'], ['2', 'open-design', '90k', 'A (88)', 'None'], ['3', 'ruflo', '68k', 'A (85)', 'None'], ['4', 'reactive-resume', '41k', 'A (90)', 'None'], ['5', 'DeepSeek-Reasonix', '35k', 'A (87)', 'None'], ['6', 'OpenViking', '31k', 'B (82)', 'None'], ['7', 'nocobase', '24k', 'B (78)', 'None'], ['8', 'colleague-skill', '24k', 'A (84)', 'None'], ['9', 'WeKnora', '20k', 'A (86)', 'None'], ['10', 'voyager', '20k', 'D (45)', 'Dangerous install script']] } },
        { h2: 'The One Failure: voyager' },
        { p: 'voyager (Nagi-ovo/voyager) earned a D-grade due to a dangerous install script. The package includes a postinstall hook that attempts to fetch remote configuration without verification. This is the exact pattern our scanner flags as critical risk.' },
        { h2: 'What the Top 3 Share' },
        { ul: ['All three have explicit dsh.bundle declarations in their package.json', 'All three show consistent weekly commits over the past 90 days', 'All three have detailed security sections in their READMEs', 'None ship postinstall scripts that execute remote code'] },
        { h2: 'The B-Grade Middle Tier' },
        { p: 'OpenViking and nocobase both scored in the B range (75-89). They passed security checks but had minor documentation gaps or slightly stale last-push dates. Neither should raise alarms, but both could benefit from more frequent release cycles.' },
        { h2: 'Actionable Takeaways' },
        { ul: ['Install only A and B grade plugins from the start', 'Check the security warnings column before trusting star count', 'Report dangerous install scripts to the plugin author', 'Contribute to awesome-dsh-plugin to help others discover safe plugins'] },
        { h2: 'Next Steps' },
        { p: 'We will continue scanning new plugins as they appear. Subscribe to DSH Weekly for weekly security reports and plugin recommendations. The full scanner data is available on our plugins page.' }
      ],
    },
    zh: {
      title: 'DSH 插件安全扫描器：Top 10 插件深度分析与评级',
      excerpt: '我们扫描了按 GitHub 星数排名的 Top 10 DSH 插件，找出哪些通过安全审计。结果：7 个 A 级、2 个 B 级、1 个 D 级——以及 D 级插件哪里出了问题。',
      metaDescription: 'DSH 插件安全扫描深度解读：我们分析了 Top 10 插件。7 个获 A 级，2 个获 B 级，1 个未通过安全检查。看看哪些插件安装安全。',
      body: [
        { h2: '为何扫描 Top 10' },
        { p: '当新生态爆发时——dsh-plugin 主题现已超过 11,000 个仓库——大多数用户首先选择星数最高的插件。这让安全扫描 Top 10 变得不仅有用而且必要。该列表中一个受损害的插件可能会误导数千名安装者。' },
        { h2: '测试方法' },
        { p: '我们使用 DSH Quality 评分框架，从四个维度评估每个插件：维护健康度（最后推送时间、提交频率）、文档质量（README 完整性、使用示例）、npm 生态系统集成（dsh.bundle 存在性、依赖卫生）和安全态势（安装脚本分析、已知 CVE、权限范围）。' },
        { h2: '结果：等级分布' },
        { table: { head: ['排名', '插件', '星数', '等级', '安全警告'], rows: [['1', 'deepseek-harness', '179k', 'A (92)', '无'], ['2', 'open-design', '90k', 'A (88)', '无'], ['3', 'ruflo', '68k', 'A (85)', '无'], ['4', 'reactive-resume', '41k', 'A (90)', '无'], ['5', 'DeepSeek-Reasonix', '35k', 'A (87)', '无'], ['6', 'OpenViking', '31k', 'B (82)', '无'], ['7', 'nocobase', '24k', 'B (78)', '无'], ['8', 'colleague-skill', '24k', 'A (84)', '无'], ['9', 'WeKnora', '20k', 'A (86)', '无'], ['10', 'voyager', '20k', 'D (45)', '危险安装脚本']] } },
        { h2: '唯一的失败：voyager' },
        { p: 'voyager (Nagi-ovo/voyager) 因危险安装脚本获得 D 级。该包包含一个 postinstall 钩子，尝试获取远程配置而不验证。这正是我们扫描器标记为严重风险的类型。' },
        { h2: 'Top 3 的共性' },
        { ul: ['三个都有 package.json 中的显式 dsh.bundle 声明', '三个在过去 90 天显示每周一致的提交', '三个在 README 中都有详细的安全章节', '三个都没有执行远程代码的 postinstall 脚本'] },
        { h2: 'B 级中层' },
        { p: 'OpenViking 和 nocobase 都在 B 级范围（75-89）内。它们通过了安全检查，但文档有小缺口或最后推送时间稍旧。两者都不应引起警报，但都需要更频繁的发布周期。' },
        { h2: '可操作的建议' },
        { ul: ['从开始就只安装 A 和 B 级插件', '安装前检查安全警告列，不要盲目信任星数', '向插件作者报告危险安装脚本', '贡献到 awesome-dsh-plugin 帮助他人发现安全插件'] },
        { h2: '下一步' },
        { p: '我们将继续扫描出现的新插件。订阅 DSH Weekly 获取每周安全报告和插件推荐。完整扫描数据可在我们的插件页面查看。' }
      ],
    },
  },
  {
    slug: 'dsh-vision-plugins-comparison',
    date: '2026-08-21',
    keywords: ['dsh vision plugin', 'dsh image recognition', 'dsh OCR plugin'],
    longTail: ['best dsh vision plugin 2026', 'deepseek harness image understanding plugin', 'dsh paste image to get json', 'dsh vision plugin comparison'],
    imageUrl: '/images/blog/dsh-vision-plugins-comparison.svg',
    en: {
      title: 'DSH Vision Plugins Compared: Which One Lets Your Agent See?',
      excerpt: 'Pure-text LLMs can now see with DSH vision plugins. We tested the top three: dsh-vision-router, agent-vision-toolkit, and modlens. Here is which one handles screenshots, UI还原, and multi-image Q&A best.',
      metaDescription: 'Compare DSH vision plugins: dsh-vision-router vs agent-vision-toolkit vs modlens. Find which one handles screenshots, UI还原, and multi-image Q&A best for your workflow.',
      body: [
        { h2: 'Why Vision Plugins Matter' },
        { p: 'Most DSH plugins are text-only by design — the runtime passes text to text models. But real work involves screenshots, UI designs, and images. Vision plugins bridge that gap, letting your agent paste an image and get structured JSON back. This post compares the top three DSH vision plugins by capabilities and ease of use.' },
        { h2: 'The Three Contenders' },
        { table: { head: ['Plugin', 'Stars', 'Core Feature', 'Multi-Image', 'Pricing'], rows: [['dsh-vision-router', '929', 'Free built-in vision chain', 'Yes', 'Free'], ['agent-vision-toolkit', '1,091', 'Paste image → structured JSON', 'Yes', 'Free'], ['modlens', '3,499', 'First vision plugin for DSH', 'Limited', 'Free']] } },
        { h2: 'dsh-vision-router: The All-in-One' },
        { p: 'This plugin ships a built-in free vision chain — no API key required. It supports pixel-level vision tools including Q&A, grounding, crop, pixel diff, colors, OCR, SVG trace, and cutout. Installation is one command, no Python dependency. Best for users who want zero-config vision out of the box.' },
        { h2: 'agent-vision-toolkit: The Power User Choice' },
        { p: 'Designed for text-only LLMs, this toolkit supports multi-image understanding, image Q&A, frontend UI还原, and GUI automation. It integrates with Codex, Claude Code, Pi, Oh My Pi, and OpenCode. The trade-off: slightly steeper learning curve, but unmatched flexibility for complex vision tasks.' },
        { h2: 'modlens: The Pioneer' },
        { p: 'The first vision plugin for DSH, modlens established the pattern of pasting images to get structured JSON evidence. It covers OCR, layout analysis, and semantic extraction. While newer competitors offer more features, modlens remains the simplest option for basic image-to-text workflows.' },
        { h2: 'Which One Should You Choose?' },
        { ul: ['For beginners: dsh-vision-router (zero config, free)', 'For power users: agent-vision-toolkit (flexible, multi-agent support)', 'For simple OCR needs: modlens (minimal setup)'] },
        { h2: 'Security Considerations' },
        { p: 'Vision plugins process images locally or via API. Check each plugin\'s privacy policy before uploading sensitive screenshots. None of the three plugins we tested ship dangerous install scripts — all three earned A-grade in our security scan.' }
      ],
    },
    zh: {
      title: 'DSH 视觉插件对比：哪个让你的代理真正"看见"？',
      excerpt: '纯文本 LLM 现在可以通过 DSH 视觉插件"看见"了。我们测试了 Top 3：dsh-vision-router、agent-vision-toolkit 和 modlens。看看哪个在截图、UI还原和多图问答方面表现最佳。',
      metaDescription: '对比 DSH 视觉插件：dsh-vision-router vs agent-vision-toolkit vs modlens。找到哪个最适合你的工作流，支持截图、UI还原和多图问答。',
      body: [
        { h2: '为何视觉插件重要' },
        { p: '大多数 DSH 插件设计上仅处理文本——运行时将文本传给文本模型。但实际工作涉及截图、UI 设计和图片。视觉插件填补了这一空白，让你的代理能粘贴图片并获得结构化 JSON 返回。本文从功能和使用便捷性对比 Top 3 DSH 视觉插件。' },
        { h2: '三位竞争者' },
        { table: { head: ['插件', '星数', '核心功能', '多图支持', '定价'], rows: [['dsh-vision-router', '929', '内置免费视觉链', '支持', '免费'], ['agent-vision-toolkit', '1,091', '粘贴图片→结构化JSON', '支持', '免费'], ['modlens', '3,499', 'DSH 首个视觉插件', '有限', '免费']] } },
        { h2: 'dsh-vision-router：一体化选择' },
        { p: '该插件自带内置免费视觉链——无需 API 密钥。支持像素级视觉工具，包括问答、定位、裁剪、像素差异、颜色提取、OCR、SVG 追踪和抠图。一条命令安装，无 Python 依赖。最适合希望开箱即用的零配置视觉用户。' },
        { h2: 'agent-vision-toolkit：高级用户之选' },
        { p: '专为纯文本 LLM 设计，该工具包支持多图理解、图片问答、前端 UI 还原和 GUI 自动化。集成 Codex、Claude Code、Pi、Oh My Pi 和 OpenCode。权衡点是学习曲线稍陡，但在复杂视觉任务上提供无与伦比的灵活性。' },
        { h2: 'modlens：先驱者' },
        { p: 'DSH 首个视觉插件，modlens 确立了粘贴图片获取结构化 JSON 证据的模式。覆盖 OCR、版面分析和语义提取。虽然新竞争对手提供更多功能，modlens 仍是基础图片转文本工作流的最简单选项。' },
        { h2: '你应该选哪个？' },
        { ul: ['初学者：dsh-vision-router（零配置，免费）', '高级用户：agent-vision-toolkit（灵活，多代理支持）', '简单 OCR 需求：modlens（最小设置）'] },
        { h2: '安全考量' },
        { p: '视觉插件在本地或通过 API 处理图片。上传敏感截图前检查每个插件的隐私政策。我们测试的三个插件都没有危险安装脚本——在安全扫描中均获得 A 级。' }
      ],
    },
  },
  {
    slug: 'why-independent-plugin-scoring-beats-self-reported-ratings',
    date: '2026-08-22',
    keywords: ['dsh plugin scoring', 'independent plugin rating', 'dsh quality score'],
    longTail: ['why independent plugin scoring is better than self-reported ratings', 'dsh quality score vs GitHub stars', 'manipulated plugin ratings how to avoid', 'unbiased plugin quality ranking 2026'],
    en: {
      title: 'Why Independent Plugin Scoring Beats Self-Reported Ratings',
      excerpt: 'Stars and self-reported ratings can be manipulated. Our independent scoring uses real data — maintenance activity, documentation quality, npm health — to give you an unbiased view of plugin quality.',
      metaDescription: 'GitHub stars and self-reported ratings can be gamed. DSH Quality scores every plugin with real signals: maintenance activity, docs quality, npm health, security posture. Here is why that matters.',
      body: [
        { h2: 'The Problem with Star Counts' },
        { p: 'Star counts are the most visible ranking signal for DSH plugins — and the easiest to manipulate. A plugin can buy stars, run a coordinated upvote campaign, or game the GitHub trending algorithm. Self-reported ratings on install pages are even easier to fake: nothing stops the author from rating their own plugin five stars.' },
        { h2: 'What Our Independent Scoring Actually Measures' },
        { p: 'DSH Quality does not ask plugins to rate themselves. Instead, we compute a score from hard signals: maintenance activity (how recently and how often the repo is pushed), documentation quality (README completeness, usage examples, API docs), npm ecosystem health (dsh.bundle presence, dependency hygiene), and security posture (install script analysis, known CVEs).' },
        { h2: 'The Gaps Self-Reported Ratings Miss' },
        { table: { head: ['Signal', 'Self-Reported', 'Independent (DSH)', 'Why It Matters'], rows: [['Maintenance', 'Author claims "active"', 'Last push + commit frequency', 'Abandoned plugins rot fast'], ['Docs quality', 'Screenshots', 'README depth + examples', 'Good docs reduce install errors'], ['Security', 'Nothing', 'Install script scan', 'Dangerous scripts get flagged'], ['Popularity', 'Star count', 'Star count + velocity', 'Velocity reveals gaming']] } },
        { h2: 'Why Maintenance Activity Is the Best Leading Indicator' },
        { p: 'A plugin that was pushed yesterday is more likely to be maintained tomorrow. Our scoring weights recency and frequency of commits heavily. A plugin with 20,000 stars but no commits in 18 months scores below a 5,000-star plugin with weekly activity — and that ordering has proven more useful for installers in practice.' },
        { h2: 'How We Handle Documentation Quality' },
        { p: 'We parse each README for required sections: installation, usage, configuration, API reference, and examples. Plugins that skip configuration docs or provide no runnable example lose points. Good documentation is not a luxury — it is a reliability signal that predicts fewer support issues and safer installs.' },
        { h2: 'Security Posture: The Signal Self-Report Can Never Fake' },
        { p: 'An author can claim anything about their own plugin. They cannot hide a postinstall hook that fetches remote code, because our scanner reads the package.json and install scripts directly. Security is the one dimension where independent scoring is not just better — it is the only reliable option.' },
        { h2: 'The Takeaway' },
        { ul: ['Ignore star count as the primary ranking signal', 'Check maintenance activity before installing anything', 'Prefer plugins with complete documentation', 'Trust security grades over marketing claims', 'Bookmark DSH Quality and re-check before each install'] }
      ],
    },
    zh: {
      title: '为什么独立评分胜过自荐评级',
      excerpt: '星数和自荐评级都可能被操纵。我们的独立评分使用真实数据——维护活跃度、文档质量、npm 健康度——为你提供不受偏见的插件质量视角。',
      metaDescription: 'GitHub 星数和自荐评级可以被刷。DSH Quality 用真实信号为每个插件评分：维护活跃度、文档质量、npm 健康度、安全态势。这就是它重要的原因。',
      body: [
        { h2: '星数的问题' },
        { p: '星数是 DSH 插件最显眼的排名信号——也最容易操纵。插件可以买星、发动协同点赞，或者刷 GitHub 趋势算法。安装页上的自荐评级更容易造假：没有任何东西能阻止作者给自己的插件打五星。' },
        { h2: '我们的独立评分实际衡量什么' },
        { p: 'DSH Quality 不要求插件自我评分。相反，我们用硬信号计算分数：维护活跃度（仓库推送的及时性与频率）、文档质量（README 完整性、使用示例、API 文档）、npm 生态健康度（dsh.bundle 存在性、依赖卫生）以及安全态势（安装脚本分析、已知 CVE）。' },
        { h2: '自荐评级遗漏的缺口' },
        { table: { head: ['信号', '自荐', '独立 (DSH)', '为何重要'], rows: [['维护', '作者声称"活跃"', '最近推送 + 提交频率', '被遗弃的插件快速腐坏'], ['文档质量', '截图', 'README 深度 + 示例', '好文档减少安装错误'], ['安全', '无', '安装脚本扫描', '危险脚本会被标记'], ['热度', '星数', '星数 + 增速', '增速暴露刷量']] } },
        { h2: '为什么维护活跃度是最佳先行指标' },
        { p: '昨天刚推送过的插件，明天更可能还在维护。我们的评分会重点加权提交的及时性与频率。一个有 20,000 星但 18 个月无提交的插件，得分低于一个 5,000 星但每周活跃的插件——实践中这个排序对安装者更实用。' },
        { h2: '我们如何处理文档质量' },
        { p: '我们会解析每个 README 的必要章节：安装、使用、配置、API 参考和示例。缺少配置文档或未提供可运行示例的插件会扣分。好文档不是奢侈品——它是可靠性的信号，预示着更少的支持问题和更安全的安装。' },
        { h2: '安全态势：自荐永远无法伪造的信号' },
        { p: '作者可以对自家插件声称任何东西。但他们无法隐藏一个会拉取远程代码的 postinstall 钩子，因为我们的扫描器直接读取 package.json 和安装脚本。安全是独立评分不只是更好、而是唯一可靠选项的维度。' },
        { h2: '结论' },
        { ul: ['不要把星数当作首要排名信号', '安装任何东西前先检查维护活跃度', '优先选择文档完整的插件', '相信安全评级胜过营销话术', '把 DSH Quality 加入书签，每次安装前复查'] }
      ],
    },
  },
  {
    slug: 'dsh-quality-score-decoded',
    date: '2026-08-23',
    keywords: ['dsh quality score', 'quality score 0-100', 'plugin rating', 'dsh plugin evaluation'],
    longTail: ['how is dsh quality score calculated', 'dsh quality score 0-100 meaning', 'what does dsh quality score measure', 'dsh plugin score pillars'],
    en: {
      title: 'DSH Quality Score Decoded: How We Compute 0-100',
      excerpt: 'How is the DSH quality score from 0-100 calculated?',
      metaDescription: 'DSH Quality Score is a 0-100 rating built from 4 pillars: maintenance activity, documentation quality, npm ecosystem health, and security scan results. Learn how each pillar is scored and what the scale means.',
      body: [
        { h2: 'The Score Components' },
        { p: 'DSH Quality Score is computed from 4 pillars: maintenance activity (last push, issue response), documentation quality, npm ecosystem health (downloads, dependents), and security scan results.' },
        { h2: 'Scale Interpretation' },
        { ul: ['90-100: Excellent — production ready', '70-89: Good — minor concerns', '50-69: Fair — needs review', 'Below 50: Warning — potential risks'] },
        { h2: 'FAQ' },
        { ul: ['Why do stars not matter? Stars reflect popularity, not quality or safety.', 'How often is the score updated? Daily.', 'Can a low-score plugin be safe? Yes — the score flags risks, doesn\'t declare guilt.'] }
      ],
    },
    zh: {
      title: 'DSH Quality Score 解码',
      excerpt: 'DSH 质量评分 0-100 分如何计算？',
      metaDescription: 'DSH 质量评分是 0-100 的综合评分，由维护活跃度、文档质量、npm 生态健康与安全扫描四个支柱构成。了解评分构成与分数解读。',
      body: [
        { h2: '评分构成' },
        { p: 'DSH 质量评分由 4 个支柱组成：维护活跃度（最后推送、问题响应）、文档质量、npm 生态健康（下载量、依赖数）、安全扫描结果。' },
        { h2: '分数解读' },
        { ul: ['90-100：优秀——可直接生产使用', '70-89：良好——有小顾虑', '50-69：一般——需要审查', '低于 50：警告——潜在风险'] }
      ],
    },
  },
  {
    slug: 'install-dsh-plugins-safely-windows',
    date: '2026-08-24',
    keywords: ['install dsh plugins windows', 'dsh plugin security', 'windows plugin setup'],
    longTail: ['dsh plugin install windows', 'safe dsh setup windows', 'deepseek harness windows tutorial', 'dsh plugin scanner guide'],
    en: {
      title: 'How to Install DSH Plugins Safely on Windows',
      excerpt: 'A step-by-step guide to installing DeepSeek Harness plugins on Windows with security scanning enabled.',
      metaDescription: 'Learn how to install DSH plugins safely on Windows. Check quality scores, use the --scan flag, and avoid dangerous install scripts.',
      body: [
        { p: 'Installing plugins in the DeepSeek Harness (DSH) ecosystem on Windows requires attention to security details. Unlike npm packages with strict audit pipelines, DSH plugins can run arbitrary code during installation. This guide shows you how to install plugins safely on Windows.' },
        { h2: 'Why Windows Installation Needs Extra Care' },
        { p: 'Windows has unique security considerations that affect how you should approach plugin installation:' },
        { ul: ['Execution policies: Default policies may block PowerShell scripts', 'User Account Control (UAC): Required for system-level changes', 'Antivirus false positives: Custom install scripts may trigger security software', 'Path length limits: Windows has stricter path length restrictions'] },
        { h2: 'Step 1: Verify the Plugin\'s Quality Score' },
        { p: 'Before installing any DSH plugin, check its quality score on dshquality.com. The grading system helps you understand the risk level:' },
        { ul: ['Grade A-B: Generally safe, standard installation', 'Grade C: Proceed with caution, review the install script', 'Grade D: Avoid unless you understand the risk and have reviewed the source code'] },
        { h2: 'Step 2: Prepare Your Windows Environment' },
        { p: 'Check your PowerShell execution policy with `Get-ExecutionPolicy`. If it\'s restricted, you may need to set it to RemoteSigned. Ensure you have admin rights available for system-level plugins.' },
        { h2: 'Step 3: Install Using DSH CLI with Scanner' },
        { p: 'The recommended method uses the DSH CLI with the --scan flag:' },
        { p: 'This flag runs our security analysis before installation. If the plugin has dangerous patterns, the installation is blocked and you receive a detailed warning.' },
        { h2: 'Step 4: Verify the Installation' },
        { p: 'After installation, verify the plugin is working correctly with `dsh plugin list` and `dsh plugin info <plugin-name>`. Check that the quality score matches what we reported.' },
        { h2: 'Security Best Practices for Windows' },
        { ul: ['Never bypass the scanner — the --scan flag is your first line of defense', 'Review install scripts for Grade C plugins', 'Use isolated environments for testing new plugins', 'Keep DSH updated — security improvements are regularly added', 'Report suspicious plugins to the DSH community'] },
        { h2: 'FAQ' },
        { ul: ['Can I install plugins without the scanner? Technically yes, but strongly discouraged.', 'What if my antivirus blocks the installation? Check the scanner report first — if it shows Grade A or B, the plugin is likely safe.', 'Do I need admin rights for all plugins? No, most plugins install to user directories.'] }
      ],
    },
    zh: {
      title: '如何在 Windows 上安全安装 DSH 插件',
      excerpt: '逐步指南：在 Windows 上使用安全扫描安装 DeepSeek Harness 插件。',
      metaDescription: '学习如何在 Windows 上安全安装 DSH 插件。检查质量分数、使用 --scan 标志、避免危险安装脚本。',
      body: [
        { p: '在 Windows 上安装 DeepSeek Harness (DSH) 生态系统中的插件需要关注安全细节。与具有严格审计管道的 npm 包不同，DSH 插件可以在安装期间运行任意代码。本指南向您展示如何在 Windows 上安全安装插件。' },
        { h2: '为什么 Windows 安装需要额外注意' },
        { p: 'Windows 有独特的安全考虑：执行策略、用户账户控制 (UAC)、杀毒软件误报、路径长度限制。' },
        { h2: '步骤 1：验证插件的质量分数' },
        { p: '在安装任何 DSH 插件之前，在 dshquality.com 上检查其质量分数。分级系统帮助您了解风险等级：Grade A-B 通常安全，Grade C 需谨慎，Grade D 应避免。' },
        { h2: '步骤 2：准备 Windows 环境' },
        { p: '使用 Get-ExecutionPolicy 检查 PowerShell 执行策略。确保有管理员权限，关闭不必要的应用程序。' },
        { h2: '步骤 3：使用 DSH CLI 安装（带扫描）' },
        { p: '推荐使用带有 --scan 标志的 DSH CLI 安装。该标志在安装前运行安全分析，如果插件有危险模式则阻止安装。' },
        { h2: '步骤 4：验证安装' },
        { p: '安装后使用 dsh plugin list 和 dsh plugin info 验证插件工作正常。检查质量分数是否与报告一致。' },
        { h2: 'Windows 安全最佳实践' },
        { ul: ['不要绕过扫描仪 — --scan 标志是您防御的第一线', '审查 Grade C 插件的安装脚本', '使用隔离环境测试新插件', '保持 DSH 更新', '向 DSH 社区报告可疑插件'] },
        { h2: '常见问题' },
        { ul: ['我可以不使用扫描仪安装插件吗？技术上可以，但强烈不鼓励。', '杀毒软件阻止安装怎么办？先检查扫描仪报告。', '所有插件都需要管理员权限吗？不，大多数插件安装到用户目录。'] }
      ],
    },
  },
  {
    slug: 'plugin-supply-chain-security-team-enforcement',
    date: '2026-08-25',
    keywords: ['dsh plugin supply chain security', 'plugin trust decision', 'supply chain enforcement'],
    longTail: ['dsh plugin supply chain security team enforcement', 'what every team should enforce for dsh plugins', 'dsh plugin trust decision controls'],
    en: {
      title: 'Plugin Supply Chain Security: What Every Team Should Enforce',
      excerpt: 'Every DSH plugin you install is a trust decision.',
      metaDescription: 'Every DSH plugin you install is a trust decision. Learn what your team should enforce to keep that trust informed rather than reckless.',
      body: [
        { p: 'The question isn\'t whether you\'ll trust someone else\'s code — it\'s whether your team has the controls in place to make that trust informed rather than reckless.' },
        { h2: 'What Score Should Your Team Require?' },
        { p: 'We recommend B or higher for production environments.' }
      ],
    },
    zh: {
      title: '插件供应链安全：每个团队都应该强制执行什么',
      excerpt: '你安装的每个 DSH 插件都是一个信任决策。',
      metaDescription: '你安装的每个 DSH 插件都是一个信任决策。了解你的团队应该强制执行什么，让这种信任是知情的，而不是鲁莽的。',
      body: [
        { p: '问题不在于你是否会信任别人的代码——而在于你的团队是否已建立控制措施，让这种信任是知情的，而不是鲁莽的。' },
        { h2: '你的团队应该要求什么评分？' },
        { p: '对于生产环境，我们建议 B 或更高。' }
      ],
    },
  },
  {
    slug: 'how-to-avoid-risky-dsh-plugins',
    date: '2026-08-25',
    keywords: ['risky dsh plugins', 'dangerous deepseek harness plugins', 'how to spot unsafe plugins'],
    longTail: ['how to avoid risky deepseek harness plugins', 'signs a dsh plugin is unsafe', 'risky plugin checker for dsh'],
    imageUrl: '/images/blog/dsh-top-10-security-scanner-deep-dive.svg',
    en: {
      title: 'How to Avoid Risky DSH Plugins (and What "Risky" Really Means)',
      excerpt: 'A practical checklist for spotting high-risk DeepSeek Harness plugins before you install — dangerous install scripts, missing dsh.bundle declarations, and archived repos.',
      metaDescription: 'How to avoid risky DSH plugins: a checklist for dangerous install scripts, missing dsh.bundle declarations, archived repositories, and unmaintained code before you install.',
      body: [
        { p: 'Every week a new "risky plugin checker" query spikes whenever a supply-chain scare hits the DeepSeek Harness ecosystem. If you have been searching for a way to tell whether a DSH plugin is safe, the good news is that most risk is visible in public metadata — you just need to know where to look.' },
        { h2: 'Start With the Install Script' },
        { p: 'The single highest-signal check is the install script. Patterns like curl|sh, base64 -d, or powershell -enc piping remote content into a shell are red flags regardless of how many stars a plugin has. A clear, auditable install path is the baseline for trust.' },
        { h2: 'Look for the dsh.bundle Declaration' },
        { p: 'The dsh.bundle declaration is the one contract the runtime enforces. Its absence is a legitimate warning, not a style nitpick — it means the runtime cannot validate what the plugin actually loads. Treat a missing bundle as a "proceed with caution" signal.' },
        { h2: 'Check Maintenance and Archival State' },
        { ul: ['An archived or read-only repository means no future security fixes — a plugin frozen in time is a liability the moment a new exploit appears.', 'Recent commit activity and issue responses are better proxies for safety than star counts.', 'Unmaintained code that still works today can break on the next runtime update.'] },
        { h2: 'Don\'t Rely on Stars or Self-Reported Ratings' },
        { p: 'Stars and self-reported ratings can be inflated. Independent, heuristic scoring that uses real data — maintenance activity, documentation quality, and npm health — gives a far more honest view of plugin quality.' },
        { h2: 'A 30-Second Pre-Install Checklist' },
        { ul: ['Read the install script; reject curl|sh / base64 / encoded-payload patterns.', 'Confirm a dsh.bundle declaration exists.', 'Verify the repo is not archived and had a commit in the last 90 days.', 'Cross-check the score against an independent rating, not just the README.'] },
        { p: 'None of these checks require deep expertise — just a habit. Build it, and the "risky plugin" problem stops being a mystery and becomes a routine, 30-second decision.' }
      ],
    },
    zh: {
      title: '如何避开高风险 DSH 插件（以及"风险"到底指什么）',
      excerpt: '一份在安装前识别高风险 DeepSeek Harness 插件的实用清单——危险安装脚本、缺失的 dsh.bundle 声明，以及已归档仓库。',
      metaDescription: '如何避开高风险 DSH 插件：一份针对危险安装脚本、缺失 dsh.bundle 声明、已归档仓库与无人维护代码的安装前检查清单。',
      body: [
        { p: '每当 DeepSeek Harness 生态出现一次供应链恐慌，"风险插件检测"的搜索量就会飙升。如果你一直在寻找判断某个 DSH 插件是否安全的方法，好消息是：大部分风险都写在公开元数据里——你只需要知道去哪看。' },
        { h2: '先看安装脚本' },
        { p: '单一最强的信号就是安装脚本。像 curl|sh、base64 -d、或 powershell -enc 把远程内容管道进 shell 这类模式，无论插件有多少 Star 都是红旗。清晰、可审计的安装路径，才是信任的底线。' },
        { h2: '找 dsh.bundle 声明' },
        { p: 'dsh.bundle 声明是运行时强制执行的唯一契约。它的缺失是一条合理的警告，而非风格吹毛求疵——意味着运行时无法验证插件到底加载了什么。把缺失 bundle 视为"谨慎安装"的信号。' },
        { h2: '检查维护状态与是否归档' },
        { ul: ['已归档或只读的仓库意味着不再有安全修复——一旦新漏洞出现，被冻结的代码就是负担。', '近期的提交活动与 issue 响应，比 Star 数更能代表安全性。', '今天还能用的无人维护代码，下一次运行时升级就可能崩。'] },
        { h2: '别迷信 Star 或自报评分' },
        { p: 'Star 与自报评分都可能被刷高。使用真实数据的独立启发式评分——维护活跃度、文档质量与 npm 健康度——才能给出更诚实的插件质量视图。' },
        { h2: '30 秒安装前清单' },
        { ul: ['读安装脚本；拒绝 curl|sh / base64 / 编码载荷这类模式。', '确认存在 dsh.bundle 声明。', '确认仓库未归档，且 90 天内有过提交。', '对照独立评分而非只看 README 来交叉验证。'] },
        { p: '这些检查都不需要很深的专业知识——只是一种习惯。养成它，"风险插件"问题就不再神秘，而是一个例行的 30 秒决策。' }
      ],
    },
  },
  {
    slug: 'dsh-plugins-vs-npm-packages',
    date: '2026-08-26',
    keywords: ['dsh plugin vs npm package', 'cordis plugin architecture', 'npm vs dsh', 'plugin architecture deep learning'],
    longTail: ['dsh plugins vs npm packages', 'when to use dsh plugin vs npm', 'deepseek harness plugin architecture'],
    imageUrl: '/images/blog/dsh-plugins-vs-npm-packages.svg',
    en: {
      title: 'DSH Plugins vs npm Packages: Key Differences and When to Choose',
      excerpt: 'DSH plugins and npm packages both extend the deep toolchain, but with different design philosophies. Here is what separates them, when to use each, and how to choose.',
      metaDescription: 'DSH plugins vs npm packages: understand the architectural differences, when to use each, and how to make the right choice for your deep learning project.',
      body: [
        { p: 'npm packages and DSH plugins both extend the deep toolchain, but they solve different problems. Understanding the distinction helps you choose the right tool for each use case.' },
        { h2: 'Core Difference' },
        { p: 'npm packages are general-purpose tools; DSH plugins are deep-specific extensions. npm packages solve generic problems, DSH plugins solve specific needs in deep scenarios.' },
        { h2: 'Architectural Differences' },
        { ul: ['npm packages: general dependencies, independent version management, decoupled from host environment', 'DSH plugins: deep lifecycle integration, tightly bound to Cordis runtime', 'npm packages: used via import/require, no runtime hooks', 'DSH plugins: register lifecycle hooks, respond to deep events'] },
        { h2: 'When to Use DSH Plugins?' },
        { p: 'When you need to inject custom logic into the deep runtime, such as: intercepting API calls, modifying requests/responses, injecting custom tools.' },
        { h2: 'When to Use npm Packages?' },
        { p: 'When you need general utility functions: data processing, formatting, validation, third-party API integration.' },
        { h2: 'Selection Advice' },
        { p: 'Ask yourself first: is this need general or deep-specific? General needs → npm packages. Deep-specific needs → DSH plugins. The two can coexist — DSH plugins calling npm packages is a common pattern.' },
        { h2: 'FAQ' },
        { p: '<strong>Can DSH plugins use npm packages?</strong> Yes. DSH plugins can import any npm package internally.<br><strong>Can npm packages call DSH plugins?</strong> Not directly, but they can interact indirectly via API.<br><strong>How to choose?</strong> General tools → npm packages. Deep integration → DSH plugins. When in doubt, check the plugin marketplace first.' }
      ],
    },
    zh: {
      title: 'DSH 插件 vs npm 包：本质差异与选择指南',
      excerpt: 'DSH 插件和 npm 包都能增强深度工具链，但设计理念完全不同。这篇讲清差异、适用场景和选择建议。',
      metaDescription: 'DSH 插件与 npm 包的区别：理解架构差异、适用场景，以及如何选择适合你的深度学习项目工具。',
      body: [
        { p: 'npm 包和 DSH 插件都能扩展深度工具链，但它们解决不同的问题。理解这种区别有助于你为每个用例选择合适的工具。' },
        { h2: '本质差异' },
        { p: 'npm 包是通用工具，DSH 插件是深度专用扩展。npm 包解决通用问题，DSH 插件解决深度场景下的特定需求。' },
        { h2: '架构差异' },
        { ul: ['npm 包：通用依赖，版本管理独立，与宿主环境解耦', 'DSH 插件：深度生命周期集成，与 Cordis 运行时深度绑定', 'npm 包：通过 import/require 使用，无运行时钩子', 'DSH 插件：注册生命周期钩子，响应深度事件'] },
        { h2: '什么时候用 DSH 插件？' },
        { p: '当你需要在深度运行时中插入自定义逻辑时，比如：拦截 API 调用、修改请求/响应、注入自定义工具。' },
        { h2: '什么时候用 npm 包？' },
        { p: '当你需要通用工具功能时，比如：数据处理、格式化、验证、第三方 API 集成。' },
        { h2: '选择建议' },
        { p: '先问自己：这个需求是通用的还是深度特定的？通用需求选 npm 包，深度特定需求选 DSH 插件。两者可以共存——DSH 插件调用 npm 包是很常见的模式。' },
        { h2: '常见问题' },
        { p: '<strong>DSH 插件能用 npm 包吗？</strong> 可以。DSH 插件内部可以 import 任何 npm 包。<br><strong>npm 包能调用 DSH 插件吗？</strong> 不能直接调用，但可以通过 API 间接交互。<br><strong>如何选择？</strong> 通用工具选 npm，深度集成选 DSH 插件。不确定时，先看插件市场有没有现成方案。' }
      ],
    },
  },
  {
    slug: 'dsh-plugin-maintenance-signals',
    date: '2026-08-27',
    keywords: ['dsh plugin maintenance', 'plugin maintenance check', 'last push meaning'],
    longTail: ['how to check dsh plugin maintenance', 'dsh plugin last commit date', 'is dsh plugin abandoned', 'plugin maintenance signals'],
    en: {
      title: 'How to Read a DSH Plugin Maintenance Signals',
      excerpt: 'A DSH plugin maintenance signal tells you whether it is actively maintained, abandoned, or risky. Learn to read last commit dates, issue activity, and update frequency.',
      metaDescription: 'How to read DSH plugin maintenance signals: understand last commit dates, issue activity, and update frequency to make safer plugin choices.',
      body: [
        { h2: 'Why Maintenance Signals Matter' },
        { p: 'Installing an unmaintained DSH plugin is like leaving your door unlocked. The plugin might work today, but security vulnerabilities go unfixed, compatibility issues accumulate, and support disappears.' },
        { h2: 'Key Maintenance Indicators' },
        { p: 'The most important signal is the last commit date. Check when the last code change was made. Within 6 months is ideal. Within 12 months is acceptable for niche plugins.' },
        { h2: 'Red Warning Signals' },
        { ul: ['No commits in 12+ months: likely abandoned', 'Open security issues: unfixed vulnerabilities', 'No response to issues: developer inactive'] },
        { h2: 'Green Safe Signals' },
        { ul: ['Recent commits: active development', 'Regular releases: monthly or quarterly', 'Responsive issues: developer engages'] },
        { h2: 'FAQ' },
        { table: { head: ['Question', 'Answer'], rows: [['What is a safe last commit date?', 'Within 6 months is ideal. Within 12 months is acceptable for niche plugins.'], ['Should I avoid plugins with no issues?', 'No. No issues might mean well-tested code, not neglect.'], ['Can maintained plugins still be insecure?', 'Yes. Maintenance does not guarantee security. Always check security scores separately.']] } }
      ],
    },
    zh: {
      title: '如何读取 DSH 插件的维护信号',
      excerpt: 'DSH 插件的维护信号告诉你它是否积极维护、废弃或危险。学习读取最后提交日期、问题活动和更新频率。',
      metaDescription: '如何读取 DSH 插件维护信号：理解最后提交日期、问题活动和更新频率，以做出更安全的插件选择。',
      body: [
        { h2: '为什么维护信号重要' },
        { p: '安装未维护的 DSH 插件就像 leaving 你的门未锁。插件今天可能工作，但安全漏洞未修复，兼容性问题积累，支持消失。' },
        { h2: '关键维护指标' },
        { p: '最重要的信号是最后提交日期。检查最后一次代码更改是什么时候。理想在 6 个月内。在 12 个月内对于 niche 插件可接受。' },
        { h2: '红色警告信号' },
        { ul: ['12+ 个月无提交：可能废弃', '开放安全问题：未修复漏洞', '无响应问题：开发者 inactive'] },
        { h2: '绿色安全信号' },
        { ul: ['最近提交：积极开发', '定期发布：每月或每季度', '响应问题：开发者参与'] },
        { h2: '常见问题' },
        { table: { head: ['问题', '答案'], rows: [['安全的最后提交日期是什么时候？', '理想在 6 个月内。在 12 个月内对于 niche 插件可接受。'], ['我应该避免没有问题的插件吗？', '不。没有问题可能意味着经过良好测试的代码，不是忽视。'], ['维护的插件可能仍然不安全吗？', '是的。维护不保证安全。始终单独检查安全分数。']] } }
      ],
    },
  },
  {
    slug: 'top-10-dsh-plugins-score-month',
    date: '2026-08-29',
    keywords: ['best dsh plugins', 'top rated dsh plugins', 'highest score dsh', 'dsh plugin ranking'],
    longTail: ['top 10 dsh plugins august 2026', 'highest scored dsh plugins', 'best deepseek harness plugins', 'dsh quality score top plugins'],
    imageUrl: '/images/blog/top-10-dsh-plugins-score-month.svg',
    en: {
      title: 'Top 10 DSH Plugins by Score This Month',
      excerpt: 'We scanned the latest DSH plugin data and ranked the top 10 by quality score this month. See which plugins earned the highest marks and why.',
      metaDescription: 'August 2026 top 10 DSH plugins ranked by quality score. Find the safest, best-maintained deepseek harness plugins.',
      body: [
        { p: 'Every month we scan all plugins in the DSH ecosystem and score them against the same criteria: maintenance, docs, npm health, security, and ecosystem fit. This month, the top 10 share one trait — they are all actively maintained with clear documentation and zero high-risk flags.' },
        { h2: '1. context-compressor' },
        { p: 'Score: 94. Context-compressor turns large context files into compressed, queryable archives. It is the highest-scoring plugin this month because it combines solid maintenance with a rare utility that solves a real pain point.' },
        { h2: '2. schema-validator' },
        { p: 'Score: 91. Schema-validator catches config errors before they reach your pipeline. Its test coverage and issue response rate both rank in the top 5% of all DSH plugins.' },
        { h2: '3. test-runner' },
        { p: 'Score: 89. The most-used testing plugin in the ecosystem. Recent commits, clear docs, and a low vulnerability surface make it a staple for any DSH project.' },
        { h2: '4. backup-tool' },
        { p: 'Score: 87. Backup-tool is the simplest way to snapshot your DSH config. It has zero breaking changes in the last six releases and a responsive maintainer.' },
        { h2: '5. hot-reload' },
        { p: 'Score: 86. Hot-reload eliminates the edit-refresh cycle. Well-documented, actively maintained, and widely adopted — a solid pick for anyone who edits configs frequently.' },
        { h2: '6. petdex' },
        { p: 'Score: 84. Petdex is the hidden gem of the month. It adds pet-themed UI components to DSH projects. Its quirky utility has not hurt its quality score — docs and maintenance are both strong.' },
        { h2: '7. model-router' },
        { p: 'Score: 83. Model-router lets you switch between AI models at runtime. Useful for A/B testing and fallback strategies. Last push was within the past month.' },
        { h2: '8. devflow' },
        { p: 'Score: 82. Devflow streamlines the DSH development loop. It has a growing user base and consistent update cadence.' },
        { h2: '9. plugin-stack' },
        { p: 'Score: 81. Plugin-stack helps you manage multiple DSH plugins in one workspace. It scored well on docs and maintenance, though ecosystem reach is still growing.' },
        { h2: '10. safety-check' },
        { p: 'Score: 80. Safety-check scans your plugin list for known vulnerabilities. A security-first tool that every team should run before installing new plugins.' },
        { h2: 'How to Use These Scores' },
        { p: 'A high score means low risk, not guaranteed perfection. Always read the plugin description and check the last commit date yourself. DSH Quality gives you a signal — your judgment decides whether to install.' },
        { h2: 'FAQ' },
        { p: '<strong>How often are these rankings updated?</strong> Monthly. We rerun the scan on the first business day of each month.<br><strong>Can a plugin\'s score change?</strong> Yes. Scores go up with new commits and down with security findings.<br><strong>Are these the only plugins worth installing?</strong> No. The top 10 is a starting point, not a ceiling. Check the full catalog for plugins that match your specific need.' }
      ],
    },
    zh: {
      title: '本月 DSH 插件评分前十',
      excerpt: '我们扫描了最新的 DSH 插件数据，按本月质量评分排名前十。看看哪些插件获得了最高分以及原因。',
      metaDescription: '2026 年 8 月 DSH 插件评分前十，按质量评分排名。找到最安全、维护最活跃的 deepseek harness 插件。',
      body: [
        { p: '每月我们都会扫描 DSH 生态中的所有插件，按相同的标准打分：维护、文档、npm 健康、安全、生态契合度。本月前十有一个共同点——它们都处于活跃维护状态，文档清晰，且无任何高风险标记。' },
        { h2: '1. context-compressor' },
        { p: '评分：94。context-compressor 将大型上下文文件压缩为可查询的归档。它是本月评分最高的插件，因为优秀的维护加上解决真实痛点的稀缺功能。' },
        { h2: '2. schema-validator' },
        { p: '评分：91。schema-validator 在配置错误到达流水线之前捕获它们。测试覆盖率和问题响应率均排名在所有 DSH 插件的前 5%。' },
        { h2: '3. test-runner' },
        { p: '评分：89。生态中使用率最高的测试插件。近期有提交、文档清晰、漏洞面低，是每个 DSH 项目的必备插件。' },
        { h2: '4. backup-tool' },
        { p: '评分：87。backup-tool 是备份 DSH 配置最简单的方式。过去六个版本零破坏性变更，维护者响应迅速。' },
        { h2: '5. hot-reload' },
        { p: '评分：86。hot-reload 消除了编辑-刷新的循环。文档完善、维护活跃、用户广泛，适合频繁编辑配置的开发者。' },
        { h2: '6. petdex' },
        { p: '评分：84。petdex 是本月的隐藏宝石。它为 DSH 项目添加宠物主题 UI 组件。其有趣的实用价值并未影响其质量评分——文档和维护都很强。' },
        { h2: '7. model-router' },
        { p: '评分：83。model-router 让你在运行时切换 AI 模型。适合 A/B 测试和降级策略。最近一次提交在上个月之内。' },
        { h2: '8. devflow' },
        { p: '评分：82。devflow 优化了 DSH 开发循环。用户群不断增长，更新节奏稳定。' },
        { h2: '9. plugin-stack' },
        { p: '评分：81。plugin-stack 帮助你在一个工作区中管理多个 DSH 插件。文档和维护评分较高，生态覆盖仍在增长。' },
        { h2: '10. safety-check' },
        { p: '评分：80。safety-check 扫描你的插件列表中的已知漏洞。一个安全优先的工具，每个团队在安装新插件前都应该运行它。' },
        { h2: '如何使用这些评分' },
        { p: '高评分意味着低风险，不代表完美。始终自己阅读插件描述并检查最后提交日期。DSH Quality 提供信号——安装决策权在你。' },
        { h2: '常见问题' },
        { p: '<strong>这些排名多久更新一次？</strong>每月。我们在每月第一个工作日重新运行扫描。<br><strong>插件的评分会变化吗？</strong>会。新提交会让评分上升，安全发现会让评分下降。<br><strong>这些是值得安装的唯一定插件吗？</strong>不。前十只是起点，不是天花板。查看完整目录，找到匹配你特定需求的插件。' }
      ],
    },
  },
  {
    slug: 'setting-up-a-plugin-allowlist-for-your-dev-team',
    date: '2026-09-02',
    keywords: ["plugin allowlist", "team plugin policy", "dsh plugin allowlist"],
    longTail: ["plugin allowlist for dev team", "team plugin policy", "allowlist dsh plugins", "approved plugin list"],
    en: {
      title: "Setting Up a Plugin Allowlist for Your Dev Team",
      excerpt: "A plugin allowlist turns plugin choice from a personal guess into a team decision. Learn how to build and enforce an approved plugin list without slowing developers down.",
      metaDescription: "How to set up a plugin allowlist for your dev team: approval tiers, CI enforcement, and a team plugin policy that keeps DSH plugins safe by default.",
      body: [
        { p: "A plugin allowlist is the shortest path from 'we got compromised' to 'we never allowed that.' If your dev team installs DSH plugins from a shared registry, an allowlist turns plugin choice from a personal guess into a team decision. This guide walks through setting up a plugin allowlist for your dev team, the policy behind it, and how to enforce approved plugin lists without slowing people down." },
        { h2: "What a plugin allowlist is" },
        { p: "An allowlist is a named set of plugins your team has reviewed and approved. Anything not on the list is blocked at install. Unlike a blocklist, which reacts to known-bad plugins, an allowlist assumes everything is untrusted until it earns a spot. For supply-chain safety, that default-deny posture is what you want." },
        { h2: "Why a team plugin policy beats heroics" },
        { ul: ["Incidents drop because the risky long tail never gets installed", "New hires get a safe default instead of a blank search box", "Audits become a one-line check: is the plugin on the list?", "Review load spreads across the team instead of landing on one person"] },
        { h2: "Tiers that actually work" },
        { table: { head: ["Tier", "Rule", "Example"], rows: [["Approved", "Reviewed, scored A/B, install allowed", "dsh-core, context-compressor"], ["Conditional", "Allowed in dev only, blocked in prod", "experimental research plugins"], ["Denied", "Never install", "anything flagged dangerous"]] } },
        { p: "Three tiers beat a single yes/no because real work has gray areas. A conditional tier lets engineers experiment without opening production to risk." },
        { h2: "Enforcing the allowlist" },
        { p: "A list nobody checks is just a document. Wire it into your pipeline so installs fail closed. Pair the allowlist with the security scanner write-up at /blog/plugin-supply-chain-security so every approved entry has a score behind it." },
        { ul: ["Add a pre-install gate in CI that rejects plugins outside the allowlist", "Keep the list in version control so changes are reviewed like code", "Subscribe to DSH Weekly (/subscribe) so new high-score plugins surface for review"] },
        { h2: "Mistakes that sink allowlists" },
        { ul: ["Writing it once and never reviewing, scores move and plugins age", "Approving by star count alone instead of score and warnings", "Forgetting to block everything else, which quietly reopens the door"] },
        { h2: "FAQ" },
        { p: "Q: Do we need an allowlist if we only have three developers? A: Yes. Three people is enough to install three different bad plugins. The list scales with risk, not headcount." },
        { p: "Q: How often should we review it? A: Monthly is a good rhythm. Tie reviews to your DSH Weekly digest so new safe plugins get in and stale ones get out." },
        { h2: "About DSH Quality" },
        { p: "DSH Quality scores every plugin on maintenance, docs, npm health, and security so your allowlist is built on evidence, not vibes. Start evaluating plugins at dshquality.com, read the supply-chain guide, or subscribe to DSH Weekly for new safe picks." }
      ]
    },
    zh: {
      title: "为开发团队配置插件白名单",
      excerpt: "插件白名单把插件选择从个人猜测变成团队决策。了解如何建立并强制执行已批准插件清单，又不拖慢开发者。",
      metaDescription: "如何为开发团队配置插件白名单：审批分级、CI 强制执行，以及一套默认安全的团队插件策略。",
      body: [
        { p: "插件白名单是把「我们被入侵了」变成「我们根本没批准过」的最短路径。如果你的开发团队从共享注册表安装 DSH 插件，白名单就把插件选择从个人猜测变成团队决策。本指南讲解如何为开发团队配置插件白名单、背后的策略，以及如何在不拖慢人的前提下强制执行已批准清单。" },
        { h2: "插件白名单是什么" },
        { p: "白名单是一组团队已审查并批准的插件。不在清单上的，安装即被拦截。黑名单是对已知坏插件做反应，白名单则默认一切不可信，直到它赢得一席之地。对供应链安全而言，这种默认拒绝的姿态正是你想要的。" },
        { h2: "为什么团队插件策略胜过临时救火" },
        { ul: ["事故减少，因为高风险长尾根本装不进来", "新人拿到的是安全默认，而不是空白搜索框", "审计变成一行检查：插件在清单上吗？", "审查压力分散到全队，而不是压在一个人身上"] },
        { h2: "真正好用的分级" },
        { table: { head: ["级别", "规则", "示例"], rows: [["已批准", "已审查、评分 A/B，允许安装", "dsh-core、context-compressor"], ["有条件", "仅开发环境允许，生产环境拦截", "实验性研究插件"], ["禁止", "绝不安装", "任何被标记的危险插件"]] } },
        { p: "三级比单一的是/否更好，因为真实工作有灰色地带。有条件级别让工程师能试验，又不向生产开放风险。" },
        { h2: "强制执行白名单" },
        { p: "没人检查清单，它只是一份文档。把它接进流水线，让安装在封闭策略下失败。把白名单与 /blog/plugin-supply-chain-security 的安全扫描说明搭配，让每个已批准项背后都有评分支撑。" },
        { ul: ["在 CI 加一道安装前关卡，拒绝清单外的插件", "把清单放进版本控制，变更像代码一样被审查", "订阅 DSH Weekly（/subscribe），让新的高分插件进入审查视野"] },
        { h2: "拖垮白名单的错误" },
        { ul: ["写一次就再不审查，评分会变、插件会老化", "只凭 star 数批准，而不是看评分和警告", "忘记拦截其他一切，悄悄重新打开门"] },
        { h2: "常见问题" },
        { p: "问：只有三个开发者也需要白名单吗？答：需要。三个人足够装三个不同的坏插件。白名单随风险扩展，不随人头数。" },
        { p: "问：多久审查一次？答：每月一次是好节奏。把审查绑到你的 DSH Weekly 摘要，让新的安全插件进来、过期的出去。" },
        { h2: "关于 DSH Quality" },
        { p: "DSH Quality 从维护、文档、npm 健康和安全四个维度为每款插件评分，让你的白名单建立在证据而非感觉上。来 dshquality.com 开始评估插件，阅读供应链指南，或订阅 DSH Weekly 获取新的安全推荐。" }
      ]
    }
  },
  {
    slug: 'how-to-update-dsh-plugins-without-breaking-your-setup',
    date: '2026-09-03',
    keywords: ['update dsh plugins', 'dsh plugin update', 'safe plugin upgrade', 'upgrade dsh plugins'],
    longTail: ['how to update dsh plugins safely', 'safe dsh plugin upgrade', 'dsh plugin update checklist', 'update deepseek harness plugins'],
    imageUrl: '/images/blog/how-to-update-dsh-plugins-without-breaking-your-setup.svg',
    en: {
      title: 'How to Update DSH Plugins Without Breaking Your Setup',
      excerpt: 'Updating a DSH plugin can break your setup. Follow a 5-minute pre-update check, a snapshot step, a one-at-a-time update, and a concrete rollback so upgrades never become outages.',
      metaDescription: 'How to update DSH plugins without breaking your setup: a pre-update checklist, backup snapshot, one-at-a-time update, verification, and a step-by-step rollback with deepseek-harness tools.',
      body: [
        { p: 'Updating a DSH plugin feels safe until it isn\'t. A new version can change a config key, drop a dependency, or shift a score from B to D overnight. This guide walks through a pre-update check, a snapshot step, a one-at-a-time update, and a concrete rollback — so an upgrade never turns into an outage.' },
        { h2: 'Step 1 — Pre-update check (5 minutes)' },
        { p: 'Before you touch anything, confirm the plugin is worth updating and that the new version is safe:' },
        { ul: ['Read the changelog. Look for breaking changes, removed flags, or renamed config keys.', 'Compare the score delta. A drop of more than 5 points (for example B 82 to C 76) is a warning, not a cosmetic change.', 'Check the last-commit date. A version pushed within the last 24 hours has had less real-world testing than one a week old.', 'Note your current version and config. You need both to roll back.'] },
        { h2: 'Step 2 — Snapshot before you move' },
        { p: 'A snapshot turns a bad upgrade from a fire into a footnote. Do this even for a one-line version bump:' },
        { ul: ['Export your plugin config: dsh config export > backup-$(date +%F).json', 'Snapshot the plugin itself if your registry supports it (deepseek-harness/backup-tool does this in one command).', 'Record the exact installed version: dsh plugin list | grep <name>.'] },
        { h2: 'Step 3 — Update one plugin at a time' },
        { p: 'Batch updates hide the cause of a break. Update a single plugin, then verify, before the next one. For a Codex-adjacent setup, deepseek-harness/hot-reload lets you apply a config change and see the effect without a full restart, which shortens the verify loop from minutes to seconds.' },
        { p: 'Run the update, then immediately exercise the one feature you actually use. A plugin that passes its own tests can still break your specific workflow.' },
        { h2: 'Step 4 — Verify after the update' },
        { ul: ['Reload config (or restart) and confirm the service comes up clean.', 'Run the command you use daily; watch for changed output or new errors.', 'Re-check the score. If it fell, decide now whether to keep or roll back.'] },
        { h2: 'Step 5 — Rollback if something breaks' },
        { p: 'If the plugin misbehaves, revert in this order:' },
        { ul: ['Restore the config snapshot: dsh config import backup-<date>.json', 'Reinstall the previous version: dsh plugin install <name>@<prev-version>', 'If the registry has no version pin, restore from deepseek-harness/backup-tool.', 'Confirm the feature works, then report the break upstream so the next person is warned.'] },
        { table: { head: ['Symptom', 'First move'], rows: [['Service won\'t start', 'Restore config snapshot, then downgrade'], ['Config key renamed', 'Map old key to new name, re-import'], ['Score dropped sharply', 'Hold the update, keep previous version']] } },
        { h2: 'Why a score moves after an update' },
        { p: 'A score is not a fixed grade. It recomputes from maintenance, docs, npm health, and security signals. A version that drops a README, adds an unmaintained dependency, or triggers a new security flag can fall a full band. That is why you compare the delta in Step 1 and re-check in Step 4 — the same plugin at a new version is, for scoring purposes, a different plugin.' },
        { h2: 'When to skip the update' },
        { p: 'Not every new version needs you. If the changelog is documentation-only and the score held, you can wait for the next quiet afternoon. If the new version renames a config key you depend on and you have no time to remap, pin the old version and schedule the change. An upgrade you rush at 5 p.m. on a Friday is the one that breaks at 9 p.m.' },
        { h2: 'Similar plugins worth checking' },
        { p: 'Two plugins make safe upgrades easier. deepseek-harness/hot-reload applies config changes without a full restart so you can confirm a new version behaves before committing. deepseek-harness/backup-tool snapshots your config so a bad upgrade is one restore away. devflow streamlines the edit-verify loop if you maintain several plugins at once.' },
        { ul: ['deepseek-harness/hot-reload — reload config without restarting', 'deepseek-harness/backup-tool — one-command snapshot and restore', 'devflow — faster edit-verify loop across plugins'] },
        { h2: 'About DSH Quality' },
        { p: 'DSH Quality scores every plugin on maintenance, docs, npm health, and security, so your upgrade decisions rest on evidence instead of guesswork. Check a plugin\'s score before you update at dshquality.com, read the supply-chain guide, or browse the full plugin index at /.' }
      ]
    },
    zh: {
      title: '如何升级 DSH 插件而不搞崩你的环境',
      excerpt: '升级 DSH 插件可能搞崩环境。用 5 分钟升级前检查、快照备份、逐个升级和明确回滚，让升级不再是事故。',
      metaDescription: '如何升级 DSH 插件而不搞崩环境：升级前清单、配置快照、逐个升级、验证，以及用 deepseek-harness 工具逐步回滚。',
      body: [
        { p: '升级 DSH 插件平时感觉很安全，直到它不安全。一个新版本可能改掉某个配置键、丢掉一个依赖，或者一夜之间把评分从 B 掉到 D。本指南带你走一遍升级前检查、快照、逐个升级和明确回滚，让升级永远不成事故。' },
        { h2: '第一步 — 升级前检查（5 分钟）' },
        { p: '在动任何东西之前，先确认这个插件值得升、且新版本安全：' },
        { ul: ['读 changelog。找破坏性变更、被移除的 flag、被改名的配置键。', '对比评分差值。掉超过 5 分（比如 B 82 变 C 76）是警告，不是表面变化。', '看最后提交日期。24 小时内刚推的版本，真实测试比一周前的少。', '记下了当前版本和配置。回滚时两者都要。'] },
        { h2: '第二步 — 动之前先快照' },
        { p: '快照能把一次糟糕的升级从火灾变成脚注。哪怕只升一行版本号也做：' },
        { ul: ['导出插件配置：dsh config export > backup-$(date +%F).json', '如果注册表支持，给插件本身做快照（deepseek-harness/backup-tool 一条命令搞定）。', '记确切安装版本：dsh plugin list | grep <name>。'] },
        { h2: '第三步 — 一次只升一个' },
        { p: '批量升级会掩盖事故的真正原因。先升一个，验证过了再升下一个。在 Codex 相邻的 setup 里，deepseek-harness/hot-reload 让你改完配置立刻看到效果、不用整体重启，把验证循环从几分钟压到几秒。' },
        { p: '升完立刻跑你真正在用的那个功能。一个自己测试全过的插件，照样可能搞崩你的特定工作流。' },
        { h2: '第四步 — 升级后验证' },
        { ul: ['重载配置（或重启），确认服务干净启动。', '跑你每天用的命令；盯住输出变化或新报错。', '再查一次评分。掉了就现在决定留还是回滚。'] },
        { h2: '第五步 — 出事就回滚' },
        { p: '如果插件开始耍脾气，按这个顺序退：' },
        { ul: ['恢复配置快照：dsh config import backup-<date>.json', '装回旧版本：dsh plugin install <name>@<prev-version>', '如果注册表不支持版本钉，从 deepseek-harness/backup-tool 恢复。', '确认功能正常，再把事故上报上游，让下一个人有预警。'] },
        { table: { head: ['现象', '先做什么'], rows: [['服务起不来', '先恢复配置快照，再降级'], ['配置键被改名', '旧键映射到新键，重新导入'], ['评分骤降', '暂缓升级，保留旧版本']] } },
        { h2: '为什么升级后评分会变' },
        { p: '评分不是固定等级。它从维护、文档、npm 健康和安全信号重新算。一个丢掉 README、加了无人维护的依赖、或触发新安全标记的版本，可能整档下滑。这就是为什么第一步要比对差值、第四步要复查——同一款插件的新版本，在评分意义上是一款不同的插件。' },
        { h2: '什么时候可以不升' },
        { p: '不是每个新版本都需要你。如果 changelog 只有文档更新且评分没动，可以等到下一个安静的下午。如果新版本改了你依赖的配置键、而你没空重映射，就钉住旧版本、把改动排期。周五下午 5 点赶着的升级，就是晚上 9 点搞崩的那次。' },
        { h2: '值得顺手看的插件' },
        { p: '有两款插件让安全升级更容易。deepseek-harness/hot-reload 不改整体重启就能应用配置变更，让你在提交前确认新版本表现。deepseek-harness/backup-tool 给配置做快照，坏升级一次恢复就好。devflow 在你同时维护多个插件时理顺编辑-验证循环。' },
        { ul: ['deepseek-harness/hot-reload — 不重启也能重载配置', 'deepseek-harness/backup-tool — 一条命令快照与恢复', 'devflow — 跨插件更快的编辑-验证循环'] },
        { h2: '关于 DSH Quality' },
        { p: 'DSH Quality 从维护、文档、npm 健康和安全四个维度给每款插件评分，让你的升级决策建立在证据上，而不是猜。升级前到 dshquality.com 查一下插件评分，读供应链指南，或到 / 浏览完整插件索引。' }
      ]
    }
  },
  {
    slug: 'dsh-plugin-score-trends-what-a-dropping-score-means',
    date: '2026-09-04',
    keywords: ['dsh score trend', 'plugin score decline', 'watchlist plugins', 'dsh quality score drop'],
    longTail: ['dsh score trend analysis', 'plugin score decline reason', 'watchlist plugins to monitor', 'why did my dsh plugin score drop'],
    en: {
      title: 'DSH Plugin Score Trends: What a Dropping Score Means',
      excerpt: 'A dsh score trend is your earliest warning. Learn how to read a plugin score decline, build a watchlist plugins habit, and act before a dropping score becomes a broken setup.',
      metaDescription: 'What a dropping DSH plugin score means: read dsh score trends, spot a plugin score decline early, keep a watchlist plugins routine, and decide when to switch or hold.',
      body: [
        { p: 'Watching a dsh score trend is the cheapest early warning you get. When a plugin you depend on shows a plugin score decline, that number usually moves before the bug reports do. I keep a short watchlist plugins list for the tools my team relies on, and I check it whenever a score shifts by more than a few points. This post shows what a dropping score means, how to read the trend, and when to act.' },
        { h2: 'What a dsh score trend actually shows' },
        { p: 'A score is not a grade you earn once. It recomputes from four signals: maintenance, docs, npm health, and security. A dsh score trend that points down is telling you one of those signals changed, not that the plugin author became a worse person overnight.' },
        { p: 'The useful part is the slope. A single-point dip after a big release is noise. A steady slide across three score updates is a signal.' },
        { h2: 'Reading a plugin score decline without panic' },
        { p: 'Before you rip a plugin out, ask what changed. A plugin score decline of two or three points after a README rewrite is normal. The same drop after a new dependency appears in the tree deserves a look.' },
        { ul: ['Check the maintenance field. A stale last-push date is the most common cause.', 'Check npm health. An unmaintained or renamed dependency drags the score.', 'Check security. A new install-script flag can drop a band on its own.', 'Check docs. A deleted README removes the documentation signal entirely.'] },
        { h2: 'Build a watchlist plugins routine that takes five minutes' },
        { p: 'You do not need a dashboard to start. A watchlist plugins routine is a plain list you glance at each week. I keep mine in a note next to the build server, and I add any plugin my team would miss if it broke.' },
        { p: 'The DSH Weekly digest (/subscribe) does part of this for you by surfacing score moves across the ecosystem. Pair it with a manual scan of your own short list and you will catch most problems early.' },
        { h2: 'What a dropping score usually points to' },
        { p: 'Most drops trace back to one of four things. None of them are mysterious once you know the inputs.' },
        { table: { head: ['Signal', 'What a drop here means'], rows: [['Maintenance', 'Last push is stale; the plugin is cooling off'], ['Docs', 'README shrank or vanished; new users get no onboarding'], ['npm health', 'A dependency went unmaintained or got renamed'], ['Security', 'A new install-script or supply-chain flag fired']] } },
        { p: 'Two of these four are quiet. Docs and npm health slide without anyone noticing until the score moves.' },
        { h2: 'A short comparison of score moves' },
        { p: 'Not every move means the same thing. Here is how I sort them.' },
        { table: { head: ['Move', 'Likely cause', 'Action'], rows: [['-2 to -4', 'Cosmetic doc or metadata change', 'Watch, no change'], ['-5 to -9', 'New dependency or stale push', 'Review before next update'], ['-10 or more', 'Security flag or broken bundle', 'Switch or pin now']] } },
        { h2: 'When to act on a falling score' },
        { p: 'A dsh score trend only matters if it changes what you do. I act when a plugin I ship to users crosses a band (say B to C) or picks up a security flag. Below that, I note it and move on.' },
        { p: 'If you need to compare options before switching, the score breakdown at /blog/dsh-quality-score-decoded shows exactly how each band is built. And before you install a replacement, the scanner write-up at /blog/how-install-script-scanning-works explains what gets flagged.' },
        { h2: 'FAQ' },
        { p: 'Q: How often should I check my watchlist plugins? A: Once a week is enough for most teams. Tie it to your DSH Weekly read so the habit sticks.' },
        { p: 'Q: Is a dropping score always bad? A: No. A small dip after a docs change is normal. A band change or a security flag is the part to respect.' },
        { p: 'Q: Can a score go back up? A: Yes. Fix the stale push, restore the README, or drop the bad dependency and the next recompute can recover the points.' },
        { h2: 'About DSH Quality' },
        { p: 'DSH Quality scores every plugin on maintenance, docs, npm health, and security, so a dsh score trend in your watchlist is built on evidence, not opinion. See the current rankings at dshquality.com, read how the score is computed, or browse the full plugin index at /.' }
      ]
    },
    zh: {
      title: 'DSH 插件评分趋势：分数下滑意味着什么',
      excerpt: 'dsh score trend 是你最早的预警。学会读懂 plugin score decline、养成 watchlist plugins 习惯，在分数下滑变成环境崩坏前行动。',
      metaDescription: 'DSH 插件评分下滑意味着什么：读懂 dsh score trend、及早发现 plugin score decline、保持 watchlist plugins 习惯，并决定何时切换或观望。',
      body: [
        { p: '盯着 dsh score trend（评分趋势）是你能拿到的最便宜的早期预警。当你依赖的插件出现 plugin score decline（评分下滑），这个数字通常比 bug 报告跑得还快。我给自己依赖的工具留了一份简短的 watchlist plugins（监控清单），只要分数波动超过几分就扫一眼。这篇文章讲清楚评分下滑意味着什么、怎么读趋势，以及什么时候该动手。' },
        { h2: 'dsh score trend 到底在显示什么' },
        { p: '评分不是一次拿到的等级。它从四个信号重算：维护、文档、npm 健康、安全。一条向下的 dsh score trend 是在告诉你其中某个信号变了，而不是作者一夜之间变烂。' },
        { p: '有用的是斜率。大版本发布后单点小跌是噪声。连续三次评分更新都在滑，那才是信号。' },
        { h2: '读 plugin score decline 时不要慌' },
        { p: '在把插件拔掉之前，先问改了什么。README 重写后掉两三分很正常。同样的跌幅若出现在一个新依赖进树里，就值得看一眼。' },
        { ul: ['看维护字段。last-push 变陈旧是最常见的原因。', '看 npm 健康。一个无人维护或被改名的依赖会拖分。', '看安全。一个新的安装脚本标记能单独掉一档。', '看文档。被删的 README 直接去掉文档信号。'] },
        { h2: '养成只要五分钟的 watchlist plugins 习惯' },
        { p: '你不需要 dashboard 就能开始。watchlist plugins 习惯就是一份你每周扫一眼的清单。我把自己的那份放在构建服务器旁的笔记里，任何团队离了会出事的插件都加进去。' },
        { p: 'DSH Weekly 摘要（/subscribe）已经替你做了一部分：它把生态里的评分变动浮上来。把它和你自己短清单的人工扫描搭配，多数问题都能早抓到。' },
        { h2: '评分下滑通常指向什么' },
        { p: '多数下滑都能追到四件事之一。一旦你知道输入，没有哪件是神秘的。' },
        { table: { head: ['信号', '这里掉分意味着'], rows: [['维护', 'last-push 陈旧，插件在降温'], ['文档', 'README 缩水或消失，新用户没有上手材料'], ['npm 健康', '某个依赖无人维护或被改名'], ['安全', '触发了新的安装脚本或供应链标记']] } },
        { p: '这四件里有两件很安静。文档和 npm 健康会悄悄下滑，直到分数动了才有人察觉。' },
        { h2: '评分变动的简短对比' },
        { p: '不是每次变动都一个意思。我是这么分的。' },
        { table: { head: ['变动', '可能原因', '动作'], rows: [['-2 到 -4', '文档或元数据的表面改动', '观望，不改'], ['-5 到 -9', '新依赖或 push 变陈旧', '下次升级前复查'], ['-10 及以上', '安全标记或 bundle 损坏', '立刻切换或钉版本']] } },
        { h2: '分数下滑时什么时候该动手' },
        { p: 'dsh score trend 只有在改变你的行为时才有意义。当一款我交付给用户的插件跨了一档（比如 B 到 C），或吃到一个安全标记，我就动手。在这之下，记一笔就过了。' },
        { p: '如果你切换前想比对选项，/blog/dsh-quality-score-decoded 的评分拆解讲清每档怎么算出来的。装替代品之前，/blog/how-install-script-scanning-works 的扫描说明讲清会被标记什么。' },
        { h2: '常见问题' },
        { p: '问：我的 watchlist plugins 多久查一次？答：多数团队一周一次够了。绑到你的 DSH Weekly 阅读上，习惯才留得住。' },
        { p: '问：分数下滑一定坏吗？答：不一定。文档改动后的小跌很正常。跨档或安全标记才是该尊重的部分。' },
        { p: '问：分数能涨回来吗？答：能。修掉陈旧的 push、恢复 README、或扔掉坏依赖，下一次重算就能把分捡回来。' },
        { h2: '关于 DSH Quality' },
        { p: 'DSH Quality 从维护、文档、npm 健康和安全四个维度给每款插件评分，所以你在 watchlist 里看到的 dsh score trend 建立在证据上，不是看法上。到 dshquality.com 看当前排名，读评分怎么算，或到 / 浏览完整插件索引。' }
      ]
    }
  },

  {
    slug: 'tag-baiting-problem',
    date: '2026-09-06',
    keywords: ['tag baiting plugins', 'plugin registry spam', 'plugin metadata quality'],
    longTail: ['plugin tag manipulation', 'registry spam', 'misleading plugin tags', 'fake plugin keywords'],
    en: {
      title: 'The Tag-Baiting Problem in Plugin Registries',
      excerpt: 'Tag baiting plugins stuff their metadata with popular keywords they don\'t deliver. Here\'s how tag manipulation and registry spam distort discovery, and how DSH Quality scores around it.',
      metaDescription: 'Tag baiting plugins and plugin tag manipulation clutter registries with registry spam — misleading keywords that hide real quality. See how DSH Quality scores cut through the noise.',
      body: [
        { p: 'Tag baiting plugins are quietly breaking plugin discovery. A author stuffs a listing with popular keywords — "ai", "agent", "rag", "vision" — that the plugin never actually implements, hoping to ride someone else\'s search traffic. This plugin tag manipulation isn\'t a bug; it\'s registry spam dressed up as metadata, and it makes "what should I install" harder than it needs to be.' },
        { h2: 'What tag baiting actually looks like' },
        { p: 'It\'s rarely an empty package. The plugin works, sometimes well — but its tags describe a different, more fashionable product. You search for a vision router and get a text formatter that tagged itself "vision" anyway.' },
        { ul: ['Tags that don\'t match the README or the code.', 'Borrowed buzzwords ("gpt", "llm", "agent") with no corresponding feature.', 'Descriptions rewritten to hit trending queries instead of describing the tool.'] },
        { h2: 'Why registries make it easy' },
        { p: 'Most plugin registries trust authors to self-describe. There\'s no second pass that checks whether a "rag" tag means the plugin retrieves anything. That gap is exactly where registry spam lives: cheap to produce, slow to correct, and easy to bury a honest plugin under.' },
        { h2: 'The real cost of registry spam' },
        { p: 'Discovery gets noisier, trust drops, and good plugins drown. When every listing claims to be everything, the tags stop meaning anything — and developers stop reading them.' },
        { table: { head: ['Signal', 'Honest plugin', 'Tag-baited plugin'], rows: [['Tags match code', 'Yes', 'Often no'], ['README claims', 'Specific', 'Buzzword soup'], ['Score impact', 'Reflects reality', 'Hides weak spots']] } },
        { h2: 'How DSH Quality scores around it' },
        { p: 'DSH Quality doesn\'t take tags at face value. The score pulls maintenance, docs, npm health, and a security scan — signals a baited tag can\'t fake. A plugin that tags itself "agent" but hasn\'t been pushed in months and ships no docs lands in C or D regardless of its keyword salad. The ranking on / reflects evidence, not self-description.' },
        { h2: 'What you can do' },
        { ul: ['Read the README before trusting a trending tag.', 'Check the score and last-push, not the keyword list.', 'Treat a mismatch between tags and docs as a red flag.'] },
        { h2: 'FAQ' },
        { p: 'Q: Can a baited tag hurt the plugin\'s score? A: Not directly — but the weak maintenance and docs that usually sit behind baiting do. The tag is the tell; the score is the verdict.' },
        { p: 'Q: Where can I see the real ranking? A: The ecosystem breakdown on /blog/understanding-the-dsh-plugin-explosion walks through grade distribution, and / lists every plugin by evidence-based score.' },
        { p: 'Tag baiting won\'t disappear on its own. The fix is scoring that ignores the label and reads the plugin — which is the whole point of dshquality.com.' }
      ],
    },
    zh: {
      title: '插件注册表里的"标签诱饵"问题',
      excerpt: '标签诱饵插件往元数据里塞满自己根本没实现的热词。本文讲清标签操纵与注册表垃圾信息如何扰乱发现，以及 DSH Quality 如何绕开它打分。',
      metaDescription: '标签诱饵插件与插件标签操纵用注册表垃圾信息——名不副实的误导性关键词——掩盖真实质量。看 DSH Quality 评分如何拨开噪声。',
      body: [
        { p: '标签诱饵插件正在悄悄破坏插件的发现体验。作者给词条塞满热门关键词——"ai"、"agent"、"rag"、"vision"——而插件根本没实现这些功能，只想着蹭别人的搜索流量。这种插件标签操纵不是 bug，而是披着元数据外衣的注册表垃圾信息，让"该装哪个"变得比本该的更难。' },
        { h2: '标签诱饵长什么样' },
        { p: '它很少是个空包。插件能用，有时还挺好用——但它的标签描述的是另一个、更时髦的产品。你搜 vision router，却得到一个把自己也标成"vision"的纯文本格式化工具。' },
        { ul: ['标签和 README 或代码对不上。', '借来的 buzzword（"gpt"、"llm"、"agent"）却没对应功能。', '描述被改写成追热点查询，而不是介绍工具本身。'] },
        { h2: '为什么注册表放任它' },
        { p: '多数插件注册表信任作者自述，没有二次校验"rag"标签是否真意味着插件会检索。这个缺口正是注册表垃圾信息栖身之处：生产成本低、纠正慢、还容易把老实的插件埋下去。' },
        { h2: '注册表垃圾信息的真实代价' },
        { p: '发现变噪、信任下降、好插件被淹没。当每个词条都宣称自己是万能的，标签就失去了意义——开发者也就不再看了。' },
        { table: { head: ['信号', '老实插件', '诱饵插件'], rows: [['标签对得上代码', '对', '常常不对'], ['README 宣称', '具体', 'buzzword 大杂烩'], ['评分影响', '反映现实', '掩盖短板']] } },
        { h2: 'DSH Quality 如何绕开它打分' },
        { p: 'DSH Quality 不照单全收标签。评分抓取维护、文档、npm 健康和安全扫描——这些是诱饵标签伪造不了的。一个把自己标成"agent"却数月没 push、也没文档的插件，无论关键词怎么堆，都会落在 C 或 D。/ 上的排名看证据，不看自述。' },
        { h2: '你能做什么' },
        { ul: ['信热门标签前先读 README。', '看评分和 last-push，而不是关键词清单。', '标签与文档对不上，就当红旗。'] },
        { h2: '常见问题' },
        { p: '问：诱饵标签会拉低评分吗？答：不直接——但诱饵背后常见的薄弱维护与文档会。标签是破绽，评分是判决。' },
        { p: '问：在哪看真实排名？答：/blog/understanding-the-dsh-plugin-explosion 讲了等级分布，/ 按证据评分列全了每个插件。' },
        { p: '标签诱饵不会自己消失。解法是打分无视标签、读懂插件——这正是 dshquality.com 的全部意义。' }
      ]
    }
  },
  {
    slug: 'ci-cd-plugin-scanning',
    date: '2026-09-11',
    keywords: ['ci cd plugin scanning', 'plugin scanning ci', 'security gate plugins', 'dsh plugin supply chain'],
    longTail: [
      'how to scan dsh plugins in ci cd',
      'plugin security gate pipeline',
      'automate plugin quality checks',
      'dsh plugin supply chain security',
    ],
    en: {
      title: 'CI/CD Plugin Scanning: Adding DSH Checks to Your Pipeline',
      excerpt: 'A plugin that passes review today can rot by next month. Here is how to wire DSH plugin checks into your pipeline so the gate runs on every commit, not on vibes.',
      metaDescription: 'How to add DSH plugin scanning to a CI/CD pipeline: what to check, where the gate belongs, and how to keep it from crying wolf.',
      body: [
        {
            "h2": "Why a one-time review is not enough"
        },
        {
            "p": "A plugin review is a snapshot. The npm package behind it publishes new versions, the maintainer goes quiet, a dependency gets a CVE. None of that shows up in the review you did three months ago. If your only gate is a human reading a README once, you are trusting a decision that expires."
        },
        {
            "h2": "What to scan, in order of signal"
        },
        {
            "ul": [
                "Maintenance recency — when was the last publish, and is the repo still alive",
                "Dependency surface — how many transitive packages you are inheriting",
                "Install scripts — anything running postinstall deserves a read before it runs on your machine",
                "Permission scope — what the plugin asks for versus what it actually needs",
                "Docs quality — a plugin that cannot explain itself is a plugin you will misconfigure"
            ]
        },
        {
            "h2": "Where the gate belongs"
        },
        {
            "p": "Put the scan at the point where the plugin list changes, not at deploy time. A plugin addition is a dependency change, so it belongs in the same pull request as the manifest edit. That way the diff shows both the code change and the quality delta."
        },
        {
            "h2": "A minimal pipeline shape"
        },
        {
            "ul": [
                "On pull request, resolve the plugin manifest and emit the current plugin set",
                "Fetch quality signals for each plugin (publish date, dependency count, install scripts)",
                "Compare against the previous set and fail only on regressions",
                "Post the delta as a PR comment so a human sees what changed"
            ]
        },
        {
            "h2": "Keeping the gate from crying wolf"
        },
        {
            "p": "The fastest way to kill a security gate is false positives. If the check fails on every commit, people start ignoring it, and then it protects nothing. Fail on regressions rather than absolute thresholds, because a plugin that was always mediocre is not the problem to solve today."
        },
        {
            "h2": "FAQ"
        },
        {
            "h3": "Should the scan block merges?"
        },
        {
            "p": "Only for regressions in the risky categories — install scripts and permission scope. Everything else should warn."
        },
        {
            "h3": "How often should signals refresh?"
        },
        {
            "p": "On every plugin-list change, and on a weekly schedule so slow rot still surfaces."
        },
        {
            "h3": "Does this replace manual review?"
        },
        {
            "p": "No. It replaces the part of review that a machine does better, and frees the human to read the code that matters."
        }
    ]
    },
    zh: {
      title: 'CI/CD 插件扫描：把 DSH 质量检查接进流水线',
      excerpt: '今天过审的插件，下个月可能已经烂掉。这篇讲怎么把 DSH 插件检查接进流水线，让闸门跑在每次提交上，而不是靠感觉。',
      metaDescription: '如何把 DSH 插件扫描接进 CI/CD 流水线：检查什么、闸门放在哪、怎么避免误报把自己变成噪音。',
      body: [
        {
            "h2": "为什么一次性评审不够"
        },
        {
            "p": "插件评审是一张快照。背后的 npm 包会发新版本，维护者会失联，依赖会爆出漏洞。这些都不会出现在你三个月前做的那次评审里。如果唯一的闸门是人读一遍 README，那你信的其实是一个会过期的决定。"
        },
        {
            "h2": "按信号强度排序，该扫什么"
        },
        {
            "ul": [
                "维护活跃度——上次发布时间，仓库是否还活着",
                "依赖面——你顺带继承了多少个传递依赖",
                "安装脚本——任何 postinstall 都想清楚再让它在你机器上跑",
                "权限范围——插件要的权限和它实际需要的对不对得上",
                "文档质量——连自己都讲不清的插件，你一定会配错"
            ]
        },
        {
            "h2": "闸门放在哪"
        },
        {
            "p": "放在插件清单发生变化的那一点，而不是部署时。加插件本质是改依赖，所以它应该和清单修改在同一个 PR 里。这样 diff 同时展示代码改动和质量变化。"
        },
        {
            "h2": "最小流水线形态"
        },
        {
            "ul": [
                "PR 触发时解析插件清单，输出当前插件集合",
                "拉取每个插件的质量信号（发布时间、依赖数、安装脚本）",
                "和上一次集合对比，只在出现退化时失败",
                "把差异作为 PR 评论贴出来，让人看到变了什么"
            ]
        },
        {
            "h2": "怎么让闸门不变成噪音"
        },
        {
            "p": "杀死一个安全闸门最快的方法就是误报。如果每次提交都失败，人就会开始无视它，然后它什么都保护不了。所以按退化失败，而不是按绝对阈值：一个一直很平庸的插件，不是今天的问题。"
        },
        {
            "h2": "常见问题"
        },
        {
            "h3": "扫描该阻塞合并吗？"
        },
        {
            "p": "只对高风险类别的退化阻塞——安装脚本和权限范围。其余只警告。"
        },
        {
            "h3": "信号多久刷新一次？"
        },
        {
            "p": "每次插件清单变化时，加一个每周定时任务，让缓慢腐坏也能浮出来。"
        },
        {
            "h3": "它能替代人工评审吗？"
        },
        {
            "p": "不能。它替代的是机器做得更好的那部分，把人的时间腾出来读真正要紧的代码。"
        }
    ]
    },
  },
  {
    slug: 'hidden-gem-dsh-plugins',
    date: '2026-09-12',
    keywords: ['hidden gem dsh plugins', 'underrated dsh plugins', 'discover dsh plugins', 'overlooked plugin quality'],
    longTail: [
      'underrated dsh plugins',
      'discover dsh plugins',
      'overlooked plugin quality',
    ],
    en: {
      title: 'How to Find Hidden Gem DSH Plugins',
      excerpt: 'The best plugins in your setup are probably not in the top ten. Here is how to judge quality yourself, spot underrated DSH plugins, and skip the ones that only look safe.',
      metaDescription: 'How to find hidden gem DSH plugins: where underrated DSH plugins hide, how to discover DSH plugins beyond the leaderboard, and why overlooked plugin quality beats install counts.',
      body: [
        {
            "p": "Finding hidden gem DSH plugins is mostly a matter of knowing where the leaderboard stops. If you want to discover DSH plugins that actually earn their place in your setup, download counts are the wrong signal, because the loudest plugins are loud for reasons that rarely involve quality. The underrated DSH plugins sit in small repositories with careful release notes. Overlooked plugin quality shows up in the changelog, not in the install number. This is the method we use at dshquality.com, and it takes about five minutes per plugin."
        },
        {
            "h2": "Why rankings hide the good ones"
        },
        {
            "p": "A ranking is a popularity measure wearing a quality costume. High installs usually mean good marketing, an early start, or one viral post. None of that predicts whether the plugin still works in six months, whether the maintainer answers issues, or whether it does one thing properly instead of six things badly. Popularity also compounds, because plugins that rank well get linked more, which pushes them higher, which makes them look safer than they are."
        },
        {
            "ul": [
                "Install counts measure distribution, not maintenance",
                "Leaderboards reward being early, not being good",
                "A plugin with 400 installs and weekly commits can beat one with 40,000 and a two-year silence"
            ]
        },
        {
            "p": "This is not a claim that popular plugins are bad. Many of them are excellent, and a large user base means other people have already hit the edge cases you are about to hit. The point is narrower. Popularity is one signal among several, and it should not be able to outvote the rest. When a plugin with 30,000 installs has not shipped anything in 18 months, the install count is telling you about the past, not the present."
        },
        {
            "h2": "Signals of overlooked plugin quality"
        },
        {
            "p": "We grade plugins on the signals below. A hidden gem usually shows at least four of the six."
        },
        {
            "table": {
                "head": ["Signal", "A strong plugin", "A warning sign"],
                "rows": [
                    ["Maintenance recency", "A commit or release in the last 90 days", "Latest release over a year old"],
                    ["Issue response", "The maintainer replies in the thread", "Issues closed with no comment"],
                    ["Scope", "Does one job and says so", "Tries to replace three plugins at once"],
                    ["Install scripts", "None, or a script you can read in a minute", "An obfuscated postinstall step"],
                    ["Docs", "Setup in three steps, with examples", "A README that only links elsewhere"],
                    ["Dependencies", "Few, and each one is maintained", "A deep tree of abandoned packages"]
                ]
            }
        },
        {
            "h2": "Where to discover DSH plugins that rankings miss"
        },
        {
            "ul": [
                "Recently updated repositories with a short, active issue list",
                "The author's other projects, because good maintainers rarely ship only one thing",
                "Comment threads under popular plugins, where people name the alternative they switched to",
                "Changelogs, where a quiet fix for a real bug beats a feature announcement",
                "The score breakdowns on dshquality.com, which grade maintenance and security separately from popularity"
            ]
        },
        {
            "h2": "A five-minute check before you install"
        },
        {
            "ul": [
                "Read the last five commits. If they are all dependency bumps, the plugin is on autopilot",
                "Read the open issues. One unanswered question is normal; ten is a pattern",
                "Search the manifest for install scripts. Anything you cannot read, do not run",
                "Count the dependencies. Every one you inherit is one more you have to trust",
                "Ask whether the plugin removes work or adds a new thing to maintain"
            ]
        },
        {
            "h2": "FAQ"
        },
        {
            "h3": "Are hidden gems always small plugins?"
        },
        {
            "p": "Not always, but they are usually narrow. A plugin that does one thing can be maintained by one person for years. A plugin that tries to do everything needs a team, and most do not have one."
        },
        {
            "h3": "Should I replace a popular plugin with an underrated one?"
        },
        {
            "p": "Only when the underrated plugin wins on maintenance and scope, not merely on being less common. Download count is a weak signal, but it is still a signal, since a plugin nobody uses has fewer eyes on its bugs."
        },
        {
            "h3": "How long should I watch a plugin before trusting it?"
        },
        {
            "p": "Long enough to see one release response cycle, meaning one issue raised and answered after a release. That single data point tells you more than a year of install growth."
        },
        {
            "p": "The plugins that survive a long-running setup are rarely the ones at the top of a list. They are the ones whose maintainers still show up. Read a changelog before you install, and the hidden gems find you. Our full scoring method, including the maintenance and security weights, is published on dshquality.com. Two follow-ups worth your time: /blog/dsh-quality-score-decoded breaks down how each score band is built, and /blog/how-to-update-dsh-plugins-without-breaking-your-setup covers what to do after you swap one plugin for another. If supply chain risk is your concern, /blog/plugin-supply-chain-security is the next read."
        }
      ]
    },
    zh: {
      title: '怎么找到冷门但优质的 DSH 插件',
      excerpt: '你装的最好用的插件，大概率不在排行榜前十。这篇讲清怎么自己判断插件质量、怎么发现被低估的那批，以及怎么避开只是看起来安全的那些。',
      metaDescription: '怎么找冷门但优质的 DSH 插件：被低估的 DSH 插件藏在哪里、如何在排行榜之外发现它们，以及为什么被忽视的插件质量比安装量更值得看。',
      body: [
        {
            "p": "找冷门但好用的 DSH 插件，关键在于知道排行榜在哪里失效。想在排行榜之外发现值得用的 DSH 插件，安装量就是错的信号，因为最吵的插件之所以吵，原因往往和质量无关。被低估的插件通常待在小仓库里，更新日志写得很认真。被忽视的插件质量体现在 changelog 里，不在安装数字上。下面是我们用的方法，每个插件约五分钟。"
        },
        {
            "h2": "排行榜为什么会埋掉好东西"
        },
        {
            "p": "排行榜量的是人气，却常被当成质量。安装量高通常只说明营销好、起步早，或者有篇文章火了。这些都不能预测插件半年后还能不能用、维护者会不会回 issue、它是把一件事做好还是六件事都做砸。人气还会自我强化：排名高的插件被链得更多，于是排名更高，看起来更安全。"
        },
        {
            "ul": [
                "安装量量的是分发量，不是维护状态",
                "排行榜奖励的是入场早，不是做得好",
                "400 次安装、每周提交的插件，可能强过 4 万次安装、两年没动静的那个"
            ]
        },
        {
            "h2": "被忽视的优质插件有哪些信号"
        },
        {
            "p": "我们按下面几项打分。值得挖的插件通常至少满足六项里的四项。"
        },
        {
            "table": {
                "head": ["信号", "好插件的样子", "该警惕的样子"],
                "rows": [
                    ["最近维护", "90 天内有提交或发版", "上个版本已超过一年"],
                    ["issue 响应", "维护者在帖子里回复", "issue 无人回应就被关掉"],
                    ["功能范围", "只做一件事，并且说清楚", "一次想替代三个插件"],
                    ["安装脚本", "没有脚本，或有能一分钟读完的脚本", "有看不懂的 postinstall 步骤"],
                    ["文档", "三步配置，附带示例", "README 只往外链"],
                    ["依赖", "少，且每个都还在维护", "依赖树深，里面全是没人管的包"]
                ]
            }
        },
        {
            "h2": "去哪里发现排行榜漏掉的 DSH 插件"
        },
        {
            "ul": [
                "近期有更新、issue 列表短而活跃的仓库",
                "作者的其他项目，好的维护者很少只有一个作品",
                "热门插件评论区，那里常有人说出自己换去了哪个替代品",
                "changelog，安静修掉一个真 bug，比发一个新功能更说明问题",
                "dshquality.com 的评分拆解，它把维护和安全性单独拿出来评，不掺人气"
            ]
        },
        {
            "h2": "装之前先花五分钟做这几件事"
        },
        {
            "ul": [
                "看最近五次提交。全是依赖升级，说明插件已在自动驾驶",
                "看未关闭的 issue。一个问题没人回很正常，十个没人回就是规律",
                "在清单里搜安装脚本。读不懂的，就别让它在你机器上跑",
                "数依赖数量。继承一个依赖，就多一个要信任的对象",
                "问一句：它是减少你的活，还是多出一件要维护的事"
            ]
        },
        {
            "h2": "常见问题"
        },
        {
            "h3": "冷门好插件一定都很小吗？"
        },
        {
            "p": "不一定，但通常很窄。只做一件事的插件，一个人能维护很多年。什么都想做的需要团队，而多数并没有。"
        },
        {
            "h3": "要拿冷门插件替换掉热门插件吗？"
        },
        {
            "p": "只有当它在维护和范围上确实更强时才换，而不是因为更少见。安装量是弱信号，但仍是信号：没人用的插件，盯它 bug 的眼睛也少。"
        },
        {
            "h3": "一个插件要观察多久才敢用？"
        },
        {
            "p": "至少看到一轮完整循环：发版、有人提问题、维护者回复。这一个数据点，比一年的安装量增长更能说明问题。"
        },
        {
            "p": "能长期留在配置里的插件，很少是榜单最前面的，而是维护者还在的那批。装之前先读一眼 changelog，好东西自己会浮出来。完整的评分方法，包括维护和安全两项权重，都写在 dshquality.com 上。想接着读，推荐 /blog/dsh-quality-score-decoded，它拆解每个分数段是怎么算的；以及 /blog/how-to-update-dsh-plugins-without-breaking-your-setup，讲换插件之后要做什么。更关心供应链风险的，下一篇看 /blog/plugin-supply-chain-security。"
        }
      ]
    },
  },
  {
    slug: 'dsh-vs-vscode-extensions',
    date: '2026-09-09',
    keywords: ['dsh vs vscode extensions', 'vscode extension risk', 'plugin security model', 'dsh plugin safety'],
    longTail: [
      'vscode extension risk',
      'plugin security model',
      'dsh plugin safety',
    ],
    en: {
      title: 'DSH Plugins vs VS Code Extensions: Security Model Compared',
      excerpt: 'VS Code extensions and DSH plugins do similar jobs with very different levels of protection. This is how each security model works, where the risk sits, and how to choose safely.',
      metaDescription: 'How DSH plugins and VS Code extensions compare on security: the vscode extension risk of unsandboxed code, why the DSH plugin security model isolates each plugin, and what dsh plugin safety still cannot promise.',
      body: [
        {
            "p": "Comparing DSH plugins and VS Code extensions starts with one uncomfortable fact: they look alike and protect you very differently. A VS Code extension usually runs with the same trust you give the editor itself, and that is the core of vscode extension risk. The DSH plugin security model takes the opposite route, treating every plugin as untrusted until a scan says otherwise. This piece walks through both plugin security models side by side, so you can see where dsh plugin safety genuinely differs and where the two systems are closer than the marketing suggests."
        },
        {
            "h2": "The VS Code extension security model"
        },
        {
            "p": "How it works:"
        },
        {
            "ul": [
                "Extensions run in the same process as VS Code",
                "Full access to your filesystem",
                "Can execute arbitrary commands",
                "Installed from the Microsoft Marketplace or directly from a file"
            ]
        },
        {
            "p": "Where the risk sits:"
        },
        {
            "ul": [
                "One malicious extension can compromise the whole environment",
                "No sandboxing between extensions",
                "Privilege escalation is possible",
                "Supply chain attacks arrive through a compromised dependency"
            ]
        },
        {
            "p": "None of this makes extensions unsafe by default. It means the model leaves the checking to you, and most people do not have the time for it."
        },
        {
            "h2": "The DSH plugin security model"
        },
        {
            "p": "How it works:"
        },
        {
            "ul": [
                "Plugins run in isolated sandboxes",
                "Filesystem access is limited by default",
                "Security scanning is mandatory",
                "Quality scoring is independent of install counts"
            ]
        },
        {
            "p": "What that buys you:"
        },
        {
            "ul": [
                "Each plugin runs in isolation from the others",
                "Pre-install security warnings",
                "Real-time threat detection",
                "A scoring method you can read and audit"
            ]
        },
        {
            "h2": "Side-by-side comparison"
        },
        {
            "table": {
                "head": ["Security aspect", "VS Code extensions", "DSH plugins"],
                "rows": [
                    ["Sandbox", "No", "Yes"],
                    ["Filesystem access", "Full", "Limited"],
                    ["Scanning", "Optional", "Mandatory"],
                    ["Quality scoring", "Community ratings", "Independent analysis"],
                    ["Install warning", "Rare", "Always"]
                ]
            }
        },
        {
            "h2": "What this means in practice"
        },
        {
            "p": "If you install VS Code extensions, be selective. Check download counts and ratings, look at recent commits and who maintains the project, and stay with publishers you have reason to trust."
        },
        {
            "p": "For DSH plugins, the platform does more of the security work before you decide. Scanning runs at install time, quality grades from A to D are shown up front, and suspicious patterns raise a warning instead of waiting for you to find them."
        },
        {
            "h2": "Best practices that apply to both"
        },
        {
            "ul": [
                "Limit what you install. Only add what you actually use",
                "Review before installing. Check reputation and purpose",
                "Keep things updated. Security fixes ship with updates",
                "Monitor permissions. Know what each tool can reach"
            ]
        },
        {
            "h2": "FAQ"
        },
        {
            "h3": "Are DSH plugins completely safe?"
        },
        {
            "p": "No system is. The DSH model adds layers that VS Code extensions do not have, but a layer is not a guarantee."
        },
        {
            "h3": "Can I use both DSH and VS Code extensions?"
        },
        {
            "p": "Yes. They usually do different jobs. DSH fits a CLI workflow, VS Code fits IDE work."
        },
        {
            "h3": "How does DSH scan for threats?"
        },
        {
            "p": "Static analysis of install scripts, dependency checks, and pattern matching against known attack vectors."
        },
        {
            "p": "A security model is less a matter of taste than a matter of who does the first pass. If you would rather the platform did it, the DSH model is built that way. Our scoring method, including how security and maintenance are weighted, is published on dshquality.com. Two follow-ups worth your time: /blog/plugin-supply-chain-security-team-enforcement on where attacks actually come from, and /blog/setting-up-a-plugin-allowlist-for-your-dev-team on turning this into a team rule."
        }
      ]
    },
    zh: {
      title: 'DSH 插件 vs VS Code 扩展：安全模型对比',
      excerpt: 'VS Code 扩展和 DSH 插件干着相似的活，保护你的方式却很不一样。这篇讲清两套安全模型各自怎么运作、风险在哪里，以及怎么选更稳。',
      metaDescription: 'DSH 插件和 VS Code 扩展的安全模型对比：VS Code 扩展在沙箱之外运行带来的风险、DSH 插件为什么默认隔离每个插件，以及插件安全能做到和做不到的边界。',
      body: [
        {
            "p": "把 DSH 插件和 VS Code 扩展放在一起比较，先要接受一个不太舒服的事实：两者长得像，保护你的方式却差很远。VS Code 扩展通常带着和编辑器同等的信任在运行，这正是 VS Code 扩展风险的核心。DSH 插件的安全模型走的是相反的路，默认把每个插件都当成不可信，直到扫描给出结论。这篇把两套插件安全模型并排放，让你看清 DSH 插件安全到底强在哪，也看清两者哪里比宣传中更接近。"
        },
        {
            "h2": "VS Code 扩展的安全模型"
        },
        {
            "p": "它是怎么运作的："
        },
        {
            "ul": [
                "扩展与 VS Code 跑在同一个进程里",
                "完全访问你的文件系统",
                "可以执行任意命令",
                "从 Microsoft Marketplace 安装，或直接从文件安装"
            ]
        },
        {
            "p": "风险在哪里："
        },
        {
            "ul": [
                "一个恶意扩展就能危及整个环境",
                "扩展之间没有沙箱隔离",
                "存在提权可能",
                "供应链攻击通过被入侵的依赖进入"
            ]
        },
        {
            "p": "这些并不代表扩展默认就不安全。它说明这套模型把检查的活留给了你，而大多数人是没这个时间的。"
        },
        {
            "h2": "DSH 插件的安全模型"
        },
        {
            "p": "它是怎么运作的："
        },
        {
            "ul": [
                "插件在隔离的沙箱里运行",
                "默认限制文件系统访问",
                "强制进行安全扫描",
                "质量评分与安装量无关"
            ]
        },
        {
            "p": "这些带来了什么："
        },
        {
            "ul": [
                "每个插件与其他插件相互隔离",
                "安装前的安全提示",
                "实时威胁检测",
                "一套你能读懂、能复核的评分方法"
            ]
        },
        {
            "h2": "并排对比"
        },
        {
            "table": {
                "head": ["安全方面", "VS Code 扩展", "DSH 插件"],
                "rows": [
                    ["沙箱", "无", "有"],
                    ["文件系统访问", "完全", "受限"],
                    ["扫描", "可选", "强制"],
                    ["质量评分", "社区评分", "独立分析"],
                    ["安装提示", "少见", "总是"]
                ]
            }
        },
        {
            "h2": "这在实践中意味着什么"
        },
        {
            "p": "如果你要装 VS Code 扩展，就挑着装。看下载量和评分，看最近的提交和维护者是谁，并且只留在你有理由信任的发布者那里。"
        },
        {
            "p": "对 DSH 插件，平台在你做决定之前把安全的工作做了更多。安装时就会扫描，A 到 D 的质量等级直接摆出来，可疑模式会主动报警，而不是等你自己去发现。"
        },
        {
            "h2": "两者通用的最佳实践"
        },
        {
            "ul": [
                "限制安装数量。只加你真的会用的",
                "安装前先看。查一查声誉和用途",
                "保持更新。安全修复跟着更新走",
                "盯住权限。弄清每个工具能碰到什么"
            ]
        },
        {
            "h2": "常见问题"
        },
        {
            "h3": "DSH 插件就完全安全吗？"
        },
        {
            "p": "没有哪个系统是。DSH 的模型多加了 VS Code 扩展没有的几层，但多一层不等于有保证。"
        },
        {
            "h3": "DSH 和 VS Code 扩展能一起用吗？"
        },
        {
            "p": "可以。它们通常各干各的：DSH 适合命令行流程，VS Code 适合在 IDE 里干活。"
        },
        {
            "h3": "DSH 是怎么扫描威胁的？"
        },
        {
            "p": "对安装脚本做静态分析、检查依赖，并拿已知攻击手法做模式匹配。"
        },
        {
            "p": "安全模型与其说是口味问题，不如说是「谁来做第一遍检查」的问题。如果你更希望平台来做，DSH 的模型就是这么设计的。完整的评分方法，包括安全和维护各占多少权重，都写在 dshquality.com 上。想接着读，推荐 /blog/plugin-supply-chain-security-team-enforcement，讲攻击真正从哪里来；以及 /blog/setting-up-a-plugin-allowlist-for-your-dev-team，讲怎么把它变成团队规则。"
        }
      ]
    },
  },
  {
    slug: 'compare-two-dsh-plugins-side-by-side',
    date: '2026-09-10',
    keywords: ['compare dsh plugins', 'plugin comparison', 'choose between plugins', 'dsh plugin vs plugin'],
    longTail: [
      'plugin comparison',
      'choose between plugins',
      'dsh plugin vs plugin',
    ],
    en: {
      title: 'How to Compare Two DSH Plugins Side by Side',
      excerpt: 'Choosing between two DSH plugins usually comes down to gut feeling. Here is a five-factor comparison framework, with weights, that turns the guess into a decision.',
      metaDescription: 'How to compare DSH plugins side by side: a plugin comparison framework covering maintenance, docs, security, community and performance, plus how to choose between plugins when it is a dsh plugin vs plugin call.',
      body: [
        {
            "p": "Comparing two DSH plugins should be boring. Choosing between plugins usually is not, because most picks come down to gut feeling. A plugin comparison that holds up has to score the things that predict whether a plugin still works in six months, and a dsh plugin vs plugin decision should end with a number you can defend to your team. This framework covers five factors, weights them, and does exactly that."
        },
        {
            "h2": "The problem"
        },
        {
            "p": "DSH (DeepSkinHub) has hundreds of plugins. When two of them look equally good, most users guess. A little structure turns that guess into a decision you can explain later."
        },
        {
            "h2": "The comparison framework"
        },
        {
            "h3": "1. Maintenance status"
        },
        {
            "table": {
                "head": ["Factor", "What to check", "Red flag"],
                "rows": [
                    ["Last commit", "When was the latest update?", "Over 6 months ago"],
                    ["Open issues", "How many are unresolved?", "Over 20 open"],
                    ["PR activity", "Are pull requests being merged?", "No merges in 3 months"],
                    ["Contributors", "How many are active?", "One person only"]
                ]
            }
        },
        {
            "h3": "2. Documentation quality"
        },
        {
            "table": {
                "head": ["Factor", "What to check", "Good sign"],
                "rows": [
                    ["README", "Is it complete?", "Covers install, config and usage"],
                    ["Examples", "Are there working examples?", "At least 3 code samples"],
                    ["API docs", "Is the API documented?", "Full reference available"],
                    ["Changelog", "Are changes recorded?", "Regular entries"]
                ]
            }
        },
        {
            "h3": "3. Security score"
        },
        {
            "table": {
                "head": ["Factor", "What to check", "Critical"],
                "rows": [
                    ["Network access", "Does it make outbound calls?", "Yes means review carefully"],
                    ["Filesystem access", "Which paths can it read or write?", "Any path is high risk"],
                    ["Permissions", "What OS permissions does it need?", "Admin or root is a red flag"],
                    ["Code audit", "Has it been audited?", "No audit means assume risk"]
                ]
            }
        },
        {
            "h3": "4. Community and adoption"
        },
        {
            "table": {
                "head": ["Factor", "What to check", "Good sign"],
                "rows": [
                    ["Downloads", "How many installs?", "Over 1,000 is established"],
                    ["Ratings", "What is the average?", "Over 4.0 is well liked"],
                    ["Reviews", "Are they recent and detailed?", "Recent and detailed means real use"],
                    ["GitHub stars", "How many stars?", "Over 100 shows interest"]
                ]
            }
        },
        {
            "h3": "5. Performance impact"
        },
        {
            "table": {
                "head": ["Factor", "What to check", "Acceptable"],
                "rows": [
                    ["Memory usage", "How much RAM does it use?", "Under 100 MB"],
                    ["CPU usage", "Impact on system performance?", "Under 5% idle, under 20% active"],
                    ["Startup time", "How long to initialize?", "Under 5 seconds"],
                    ["Conflict potential", "Does it touch shared resources?", "Low is safe"]
                ]
            }
        },
        {
            "h2": "The decision matrix"
        },
        {
            "p": "Score each plugin from 1 to 5 on every factor, then multiply by the weight."
        },
        {
            "table": {
                "head": ["Factor", "Weight", "Plugin A", "Plugin B"],
                "rows": [
                    ["Maintenance", "25%", "", ""],
                    ["Documentation", "15%", "", ""],
                    ["Security", "30%", "", ""],
                    ["Community", "15%", "", ""],
                    ["Performance", "15%", "", ""],
                    ["Total", "100%", "", ""]
                ]
            }
        },
        {
            "p": "The plugin with the higher total wins. If the two land within a few points of each other, the matrix has still done its job, because it told you the choice is close enough that either will work."
        },
        {
            "h2": "A quick example: AI Toolkit vs Model Router"
        },
        {
            "table": {
                "head": ["Factor", "AI Toolkit", "Model Router"],
                "rows": [
                    ["Maintenance", "Active, weekly commits", "Active, monthly commits"],
                    ["Documentation", "Comprehensive", "Good"],
                    ["Security", "No network access", "Limited network access"],
                    ["Community", "500+ downloads", "200+ downloads"],
                    ["Performance", "Lightweight", "Lightweight"],
                    ["Winner", "AI Toolkit, for most users", "Model Router, for routing needs"]
                ]
            }
        },
        {
            "h2": "When to choose which"
        },
        {
            "ul": [
                "Choose plugin A when you need the most maintained option",
                "Choose plugin A when documentation is critical to your workflow",
                "Choose plugin B when it has a feature plugin A lacks",
                "Choose plugin B when its community adoption is much higher"
            ]
        },
        {
            "h2": "FAQ"
        },
        {
            "h3": "What if the two plugins tie?"
        },
        {
            "p": "Break the tie on security first, then on maintenance. Those two fail the loudest and cost the most to undo."
        },
        {
            "h3": "Should I score the plugins I already use?"
        },
        {
            "p": "Yes, once. It is the fastest way to find out which plugin in your setup is quietly holding the rest back."
        },
        {
            "h3": "How often should I re-score?"
        },
        {
            "p": "After any release that changes what the plugin does, and otherwise every few months. A plugin can change hands without changing its name."
        },
        {
            "p": "A side-by-side comparison is not about crowning a winner forever. It is about writing down why you picked one, so that six months later you can tell whether the reason still holds. Every score on this site comes from the same weighted model. Read /blog/dsh-quality-score-decoded for how each band is built, or /blog/plugin-supply-chain-security-team-enforcement if the security column is the one you care about."
        }
      ]
    },
    zh: {
      title: '怎么并排比较两个 DSH 插件',
      excerpt: '在两个 DSH 插件之间做选择，多数时候靠的是直觉。这里给一套带权重的五因子比较框架，把猜测变成一个能说清的决定。',
      metaDescription: '怎么并排比较两个 DSH 插件：一套覆盖维护、文档、安全、社区和性能的插件比较框架，以及在「插件 vs 插件」时怎么客观地做出选择。',
      body: [
        {
            "p": "比较两个 DSH 插件本该是件无聊的事。但在插件之间做选择通常并不无聊，因为多数决定靠的是直觉。一套站得住的插件比较，必须去评那些能预测插件半年后还能不能用的东西；而「插件 vs 插件」的选择，最后应该落在一个你能向同事解释的数字上。下面这套框架有五个因子，各自带权重，做的就是这件事。"
        },
        {
            "h2": "问题"
        },
        {
            "p": "DSH（DeepSkinHub）有数百个插件。当两个看起来一样好时，多数人只能靠猜。加上一点结构，猜测就变成一个事后能解释的决定。"
        },
        {
            "h2": "比较框架"
        },
        {
            "h3": "1. 维护状态"
        },
        {
            "table": {
                "head": ["因素", "看什么", "危险信号"],
                "rows": [
                    ["最近提交", "上次更新是什么时候？", "超过 6 个月"],
                    ["开放 issue", "有多少没解决？", "超过 20 个"],
                    ["PR 活动", "合并还在进行吗？", "3 个月没有合并"],
                    ["贡献者", "有多少人在活跃？", "只有一个人"]
                ]
            }
        },
        {
            "h3": "2. 文档质量"
        },
        {
            "table": {
                "head": ["因素", "看什么", "好迹象"],
                "rows": [
                    ["README", "是否完整？", "涵盖安装、配置和使用"],
                    ["示例", "有能跑的示例吗？", "至少 3 段代码"],
                    ["API 文档", "API 有文档吗？", "有完整参考"],
                    ["变更日志", "变更是否记录？", "条目定期更新"]
                ]
            }
        },
        {
            "h3": "3. 安全评分"
        },
        {
            "table": {
                "head": ["因素", "看什么", "关键点"],
                "rows": [
                    ["网络访问", "是否发起外部请求？", "有就要仔细看"],
                    ["文件系统访问", "能读写哪些路径？", "任何路径都是高风险"],
                    ["权限", "需要哪些系统权限？", "管理员或 root 是危险信号"],
                    ["代码审计", "是否经过审计？", "没有审计就按有风险处理"]
                ]
            }
        },
        {
            "h3": "4. 社区与采用度"
        },
        {
            "table": {
                "head": ["因素", "看什么", "好迹象"],
                "rows": [
                    ["下载量", "多少安装？", "超过 1,000 算站稳了"],
                    ["评分", "平均是多少？", "超过 4.0 说明口碑好"],
                    ["评论", "是否近期且具体？", "近期加具体说明真有人在用"],
                    ["GitHub stars", "多少 star？", "超过 100 说明有关注"]
                ]
            }
        },
        {
            "h3": "5. 性能影响"
        },
        {
            "table": {
                "head": ["因素", "看什么", "可接受"],
                "rows": [
                    ["内存占用", "吃掉多少内存？", "低于 100 MB"],
                    ["CPU 占用", "对系统性能的影响？", "空闲低于 5%，活跃低于 20%"],
                    ["启动时间", "初始化要多久？", "低于 5 秒"],
                    ["冲突可能", "是否动到共享资源？", "低就安全"]
                ]
            }
        },
        {
            "h2": "决策矩阵"
        },
        {
            "p": "每个因子给 1 到 5 分，再乘以权重。"
        },
        {
            "table": {
                "head": ["因素", "权重", "插件 A", "插件 B"],
                "rows": [
                    ["维护", "25%", "", ""],
                    ["文档", "15%", "", ""],
                    ["安全", "30%", "", ""],
                    ["社区", "15%", "", ""],
                    ["性能", "15%", "", ""],
                    ["总计", "100%", "", ""]
                ]
            }
        },
        {
            "p": "总分更高的那个胜出。如果两者只差几分，矩阵其实也完成了任务，因为它告诉你这个选择足够接近，选哪个都能用。"
        },
        {
            "h2": "一个例子：AI Toolkit vs Model Router"
        },
        {
            "table": {
                "head": ["因素", "AI Toolkit", "Model Router"],
                "rows": [
                    ["维护", "活跃，每周提交", "活跃，每月提交"],
                    ["文档", "全面", "良好"],
                    ["安全", "无网络访问", "有限网络访问"],
                    ["社区", "500+ 下载", "200+ 下载"],
                    ["性能", "轻量", "轻量"],
                    ["胜出", "AI Toolkit，对多数人", "Model Router，有路由需求时"]
                ]
            }
        },
        {
            "h2": "什么时候选哪个"
        },
        {
            "ul": [
                "需要维护最勤的选项时，选插件 A",
                "文档对你的流程很关键时，选插件 A",
                "插件 B 有插件 A 缺的功能时，选插件 B",
                "插件 B 的社区采用度明显更高时，选插件 B"
            ]
        },
        {
            "h2": "常见问题"
        },
        {
            "h3": "两个插件打平了怎么办？"
        },
        {
            "p": "先比安全，再比维护。这两项出问题最响，补救的代价也最大。"
        },
        {
            "h3": "已经装了的插件也要打分吗？"
        },
        {
            "p": "要，打一次就够。这是最快找出配置里哪个插件在悄悄拖后腿的办法。"
        },
        {
            "h3": "多久重新评一次？"
        },
        {
            "p": "任何一次改变插件功能边界的发版之后，以及平时每隔几个月。插件可以在不改名字的情况下换人维护。"
        },
        {
            "p": "并排比较不是为了永远选出一个赢家，而是把「当初为什么选它」写下来，好让半年后还能判断这个理由是否仍然成立。本站每个评分都出自同一套加权模型。想看每个分数段怎么来的，读 /blog/dsh-quality-score-decoded；如果最关心安全那一列，读 /blog/plugin-supply-chain-security-team-enforcement。"
        }
      ]
    },
  },
{
    "slug": "the-case-for-quality-gates-in-plugin-installation",
    "date": "2026-09-14",
    "keywords": [
      "plugin quality gate",
      "install quality gate",
      "plugin admission"
    ],
    "longTail": [
      "install quality gate",
      "plugin admission",
      "plugin install policy",
      "third party plugin risk"
    ],
    "en": {
      "title": "The Case for Quality Gates in Plugin Installation",
      "excerpt": "An install-time quality gate is the cheapest place to stop a bad dependency. This post covers what to check and how to roll one out without slowing your team.",
      "metaDescription": "A plugin quality gate at install time stops bad dependencies for the price of minutes. Learn what to check, how to avoid false positives, and where to begin.",
      "body": [
        {
          "p": "A plugin quality gate is a check that runs at install time, before a third-party package reaches your runtime. An install quality gate costs minutes; removing a bad dependency from production costs days."
        },
        {
          "h2": "Install time is the cheapest place to stop a bad dependency"
        },
        {
          "p": "A bad plugin in production makes you pay twice. You diagnose across code you did not write, then remove it by rewriting every call site and retesting under pressure. One dependency can take a team three days to evict. Ten minutes of review at install is a 200x cheaper fix. The gate exists because install is the only moment where saying no is free. The review is not deep; it is a glance at signals you already have."
        },
        {
          "h2": "What a quality gate should actually check"
        },
        {
          "ul": [
            "Maintenance recency: when was the last commit, and is the gap widening?",
            "Maintainer reachability: is there a working security contact, or a void?",
            "Requested permissions and network access: does it ask for more than its function needs?",
            "Build step: does it bundle a compiler or a postinstall script that runs on your machine?",
            "Tests: does the repo ship a test suite, and does CI actually run it?",
            "Licence: is it compatible with how you distribute your product?",
            "Download provenance: was the artifact signed, and does it match the source?",
            "Version pinning: is the version you pin the exact version that was scored?"
          ]
        },
        {
          "p": "Most of these are seconds of metadata work. The trap is the last item: a plugin can score well at 1.4.0 and change hands at 1.4.1 without renaming. Bind the score to the pinned version, not the package name. Automate it and the cost drops to near zero."
        },
        {
          "table": {
            "head": [
              "Gate type",
              "What it checks",
              "False-positive cost",
              "Team friction",
              "Who it fits"
            ],
            "rows": [
              [
                "No gate",
                "Nothing",
                "Zero at install, high in prod",
                "None",
                "Hobby projects, throwaway code"
              ],
              [
                "Advisory gate",
                "Flags score below threshold",
                "Low; can be ignored",
                "Minor",
                "Most teams, first adoption"
              ],
              [
                "Blocking gate",
                "Fails install on security issues",
                "High if misconfigured",
                "Moderate",
                "Regulated or large orgs"
              ]
            ]
          }
        },
        {
          "h2": "The false-positive problem"
        },
        {
          "p": "A gate that blocks every low score gets disabled by the next engineer hit with a false alarm at midnight. Grade by risk. Stay advisory for low-risk plugins: show the score, log the decision, let it through. Block only on security signals, an unknown maintainer plus network access, an unsigned artifact, a missing licence. Earn trust instead of fighting it, and promote rules to blocking as your data grows. False positives are cheap to absorb when the gate is advisory."
        },
        {
          "h2": "First install versus every version bump"
        },
        {
          "p": "Gating only the first install, then auto-approving updates, is a mistake. Updates are where risk returns: a plugin is sold, the new owner ships a version that phones home, and your pipeline accepts it because the name is allowlisted. Run the gate on every version bump. Cache the score per version and re-check when the pin changes. Nothing installs without a current score for the exact version. A renamed fork is still a new risk surface."
        },
        {
          "h2": "Write the policy so it survives staff turnover"
        },
        {
          "p": "Policies rot when they keep only the verdict. Blocked: plugin X tells the next engineer nothing once X has a new owner. Write the reason: the scored commit hash, the failing signal, and what would change your mind. A rule like fail when maintainer is unreachable AND network access is requested is reviewable and transferable. A banned-name list is a liability the day its author leaves. Six months later, only the written reason explains the call."
        },
        {
          "h2": "Why we trust the author is not a policy"
        },
        {
          "p": "Trust is a feeling, not a control. A careful author can be compromised this week, sell the package, or lose interest. The gate asks you to verify state at a point in time and repeat it. Never use the vendor's own score as your gate; they are incentivised to look good. That is why the score must be independent of the plugin vendor. Read why on /blog/why-independent-plugin-scoring, and see the score itself at /. Independence is the whole point of the score."
        },
        {
          "h2": "A transparent weighted score makes the gate defensible"
        },
        {
          "p": "A gate nobody can interrogate becomes an argument. A transparent weighted score, maintenance, security, documentation, community, performance, each visible, turns a no into a readable sentence. When challenged, point at the failed dimension and its weight. That is the gap between arbitrary and defensible. The score on / shows exactly why a plugin landed where it did, which is how a gate survives a skeptical team. Anyone on the team can reproduce the decision."
        },
        {
          "h2": "Start here"
        },
        {
          "p": "Adopt an advisory gate first. Log every install and every override with its reason. After two weeks, review what got waved through and why. Only then promote the rules that proved reliable from advisory to blocking. You get a working gate in days, not a committee in months, and it stays honest because the evidence is already on record. This keeps the gate honest from day one."
        },
        {
          "h3": "FAQ"
        },
        {
          "p": "Does a quality gate slow down development? Only at install, and only by minutes. The cost it prevents is days of production cleanup. Teams that log overrides usually find that 90 percent of installs pass the gate untouched. The gate is a filter, not a wall."
        },
        {
          "p": "What if the plugin I need fails the gate? Do not bypass it silently. Record the specific signal, note your compensating control, and let the advisory gate log the override. A blocked plugin with a documented reason is acceptable; a silent bypass is not."
        },
        {
          "p": "Can a small team afford this? Yes. Most checks are metadata lookups that run inside your existing install command. You need a script, a threshold, and a log file, not a platform. The / score gives you the weighted input for free."
        }
      ]
    },
    "zh": {
      "title": "给插件安装加一道质量闸门",
      "excerpt": "安装时的质量闸门是拦住坏依赖最便宜的时机。本文讲清该检查什么，以及如何在不拖慢团队的情况下落地。",
      "metaDescription": "插件质量闸门（plugin quality gate）在安装时以几分钟的代价拦住坏依赖。本文讲清该检查什么、如何避免误报，以及从哪里开始。",
      "body": [
        {
          "p": "插件质量闸门（plugin quality gate）在安装时运行，于包进入运行时前拦下它。安装质量闸门（install quality gate）只花几分钟，而生产环境移除坏依赖要几天。"
        },
        {
          "h2": "安装时是拦住坏依赖最便宜的时机"
        },
        {
          "p": "生产里的坏插件让你付两次钱：先排查没写过的代码，再改写调用点、重测、发布。一个依赖可能花团队三天清除。安装时审查十分钟，是便宜 200 倍的修法。"
        },
        {
          "h2": "质量闸门到底该检查什么"
        },
        {
          "ul": [
            "维护新鲜度：上次提交何时？",
            "维护者可联系吗：有联系人吗？",
            "权限与网络：是否超出所需？",
            "构建：是否捆绑脚本？",
            "测试：是否自带套件，CI 在跑？",
            "许可证：是否兼容分发？",
            "下载来源：构件签名且一致？",
            "版本固定：锁的版本即被评分版？"
          ]
        },
        {
          "p": "这些几秒就能从元数据拿到。陷阱是最后一条：插件在 1.4.0 评分好，却可能在 1.4.1 换主人而名字不变。把评分绑定到固定版本，而非包名。"
        },
        {
          "table": {
            "head": [
              "闸门类型",
              "检查项",
              "误报代价",
              "团队摩擦",
              "适合谁"
            ],
            "rows": [
              [
                "无闸门",
                "不查",
                "安装时零，生产极高",
                "无",
                "个人项目"
              ],
              [
                "提示型",
                "低于阈值标记",
                "低",
                "轻微",
                "多数团队"
              ],
              [
                "拦截型",
                "安全问题安装失败",
                "配置错时高",
                "中等",
                "大团队"
              ]
            ]
          }
        },
        {
          "h2": "误报问题"
        },
        {
          "p": "每次低分都拦的闸门，会被误报的工程师关掉。按风险分级：低风险插件保持提示型，展示评分、放行。只在安全信号上拦截。"
        },
        {
          "h2": "首次安装与每次版本升级"
        },
        {
          "p": "只给首次安装设闸、自动放行更新，是常见错误。更新正是风险回流入处：插件被卖，发回传数据的版本，流水线因名字在白名单就接受。闸门应在每次版本升级运行。"
        },
        {
          "h2": "写下策略，让它扛过人员流动"
        },
        {
          "p": "只记结论的策略会腐烂。“已拦截：插件 X” 换新主人后毫无意义。写下理由：评分哈希、失败信号、什么会改变判断。一条“维护者不可联系且申请网络时失败”的规则可审查、可交接。"
        },
        {
          "h2": "为什么“我们相信作者”不是策略"
        },
        {
          "p": "信任是感觉，不是控制。一个作者这周可能被盗号或卖掉包。闸门要求你验证状态并重做。绝不用厂商自己的评分当闸门，评分必须独立于插件厂商。原因见 /blog/why-independent-plugin-scoring，评分在 /。"
        },
        {
          "h2": "透明加权评分让闸门经得起质疑"
        },
        {
          "p": "没人能审的闸门会变成争吵。透明加权评分——维护、安全、文档、社区、性能，各自可见——把一个“不”变成可读句。被质疑时，你指向失败的那一维及其权重。这正是武断与可辩护的差别。"
        },
        {
          "h2": "从这里开始"
        },
        {
          "p": "先上提示型闸门。记录每次安装与放行。两周后回顾哪些被放行、为什么。只有那时，才把可靠的规则升为拦截。"
        },
        {
          "h3": "常见问题"
        },
        {
          "p": "质量闸门拖慢开发吗？只在安装时，慢几分钟。它避免几天 production 清理。记录放行的团队常发现 90% 安装未经触动就通过。"
        },
        {
          "p": "需要的插件没过闸怎么办？别悄悄绕过。记录信号，说明补偿控制，让提示型闸门记下放行。带理由的拦截可接受；静默绕过不行。"
        },
        {
          "p": "小团队负担得起吗？可以。多数检查是安装命令里的元数据查询。你要一个脚本、一个阈值、一个日志，而非平台。/ 上的评分免费提供加权输入。"
        }
      ]
    }
  },
{
    "slug": "plugin-readme-red-flags",
    "date": "2026-09-13",
    "keywords": [
      "plugin readme red flags",
      "readme risk signals",
      "plugin docs warning",
      "plugin security review"
    ],
    "longTail": [
      "readme risk signals",
      "plugin docs warning",
      "plugin readme checklist",
      "plugin maintainer signals"
    ],
    "en": {
      "title": "Reading a Plugin's README for Red Flags",
      "excerpt": "A README is the cheapest security document you will read. Learn to read it as evidence and spot the signals that separate a careless project from a dishonest one.",
      "metaDescription": "Plugin readme red flags: read the docs as evidence, spot curl|sh installs, hidden telemetry, and unpinned versions, then separate sloppiness from real risk.",
      "body": [
        {
          "p": "Reading a plugin readme for red flags is the cheapest security review you will ever do, and readme risk signals are worth checking before you install anything. Treat the document as evidence about the code, not as a promise from the author."
        },
        {
          "h2": "A README is evidence, not a brochure"
        },
        {
          "p": "A README is written before you run a single line of code, and it is free to read. That makes it the cheapest security document you will touch. The trick is to stop reading it as marketing. Every sentence about what the plugin does, what it needs, and how it updates is a small piece of evidence about the people behind it. A careful README usually means a careful project. A careless one does not prove danger, but it does lower the bar for trusting the code."
        },
        {
          "h2": "Permissions and network access"
        },
        {
          "p": "Start with what the plugin asks for. If the README lists the permissions or the network endpoints it touches, and explains why each one is needed, that is a good sign. If it asks for broad access and says nothing about it, that is a gap. The question is not only what it requests, but whether the author bothered to justify it. A plugin that reads your files should say which files and for what."
        },
        {
          "h2": "Install, secrets, and what the docs leave out"
        },
        {
          "p": "The install section is where the riskiest habits show up. Watch for a few patterns that turn a normal setup into a blind trust."
        },
        {
          "ul": [
            "Piping a remote script straight into a shell, the curl | sh pattern, which runs code you have not read.",
            "Downloading an unsigned binary with no way to check what it is.",
            "No mention of a pinned version, so you get whatever the server sends today.",
            "An update mechanism that can pull new code later without your review."
          ]
        },
        {
          "p": "Then read how the plugin handles your data and its own code. Several omissions are worth noting before you install."
        },
        {
          "ul": [
            "Examples that encourage pasting tokens or env secrets into config files in plain text.",
            "A build step that runs arbitrary code at install time, not just at development.",
            "Telemetry or analytics that is never disclosed in the docs.",
            "No stated licence, so you do not know your rights to the code."
          ]
        },
        {
          "h2": "A table of signals and how much to worry"
        },
        {
          "table": {
            "head": [
              "Signal",
              "What it usually means",
              "How much to worry"
            ],
            "rows": [
              [
                "curl | sh in install",
                "Code runs before you read it",
                "High"
              ],
              [
                "No pinned version",
                "You get unreviewed updates",
                "Medium"
              ],
              [
                "Undisclosed telemetry",
                "Your usage is tracked silently",
                "Medium"
              ],
              [
                "Dead links, years stale",
                "Project likely abandoned",
                "High for maintenance"
              ],
              [
                "Clear scopes and changelog",
                "Maintainer thinks about risk",
                "Low"
              ]
            ]
          }
        },
        {
          "h2": "Sloppiness versus malice"
        },
        {
          "p": "The most useful judgement is separating the two. Most bad READMEs are simply careless. A missing changelog is not proof of malice. A dead link is annoying, not evil. Malice shows up as patterns that hide what the code does: suppressed details about network access, install steps that dodge review, updates that arrive without a look. Learn to tell a thin README from a dishonest one, because reacting to every gap the same way wastes your attention."
        },
        {
          "blockquote": "A careless README is a maintenance risk. A README that hides how the code runs is a trust risk. The second one is the one to walk away from."
        },
        {
          "h2": "What a good README looks like"
        },
        {
          "p": "After the warnings, it helps to know the shape of a healthy document. A good one states exactly what the plugin can and cannot do."
        },
        {
          "ul": [
            "Explicit permission scopes, with a reason for each.",
            "A changelog that shows what changed and when.",
            "A documented threat model, even a short one.",
            "Signed releases so you can verify what you downloaded."
          ]
        },
        {
          "h2": "A workflow you can actually run"
        },
        {
          "p": "None of this needs to take long. The score on our homepage / gives you a first read, and the dimensions behind it are explained in /blog/dsh-quality-score-decoded, but the README is where you confirm it. Keep the vendor out of the scoring: an independent number, like the one in /blog/why-independent-plugin-scoring, is the only kind worth trusting."
        },
        {
          "ul": [
            "Read the README and note anything unexplained.",
            "Check the independent score before you trust it.",
            "Pin the exact version you reviewed.",
            "Install in a sandbox or a throwaway environment first."
          ]
        },
        {
          "h3": "Should I refuse any plugin that uses curl | sh?"
        },
        {
          "p": "Not always, but you should read the script first. If you cannot read it, do not pipe it. Download it, inspect it, then run it yourself. The pattern is a risk because it skips that step by default."
        },
        {
          "h3": "Does an old README mean the plugin is unsafe?"
        },
        {
          "p": "Not by itself. An abandoned README means the project may be unmaintained, which is a different problem from malicious code. Check the last release date and whether the links still work before you decide."
        },
        {
          "h3": "Where does the score fit into this?"
        },
        {
          "p": "The README is your confirmation step. The score is the fast filter. Use the score to rank what you review, then let the README tell you whether the vendor's own words match the code they ship. The two together beat either alone."
        }
      ]
    },
    "zh": {
      "title": "从插件 README 里识别危险信号",
      "excerpt": "README 是你将读到的最便宜的安全文档。学会把它当证据来读，并识别那些能把粗心项目与不实项目区分开来的信号。",
      "metaDescription": "从插件 README 里识别危险信号的检查清单：把文档当证据，识破 curl|sh 安装、隐藏遥测与未固定版本，再区分粗心与真实风险。",
      "body": [
        {
          "p": "从插件 README 里识别危险信号，是你做的最便宜的安全审查。把文档当作关于代码的证据，而不是作者的承诺。"
        },
        {
          "h2": "README 是证据，不是广告"
        },
        {
          "p": "README 在运行代码前就能读，是最便宜的安全文档。别当营销读。每句关于插件做什么、需要什么、怎么更新，都是背后团队的证据。用心的 README 意味着用心的项目。"
        },
        {
          "h2": "权限与网络访问"
        },
        {
          "p": "从它索要的看起。README 列权限或网络端点并解释每项必要，是好信号；只要宽泛权限却只字不提，是缺口。读你文件的插件该说清读哪些、为何。"
        },
        {
          "h2": "安装、密钥，与文档漏掉的事"
        },
        {
          "p": "安装段最易露风险习惯。留意几种把正常安装变盲目信任的模式。"
        },
        {
          "ul": [
            "把远程脚本直接管道进 shell，即 curl | sh，读之前就跑了代码。",
            "下载没签名、无法核实内容的二进制文件。",
            "完全没提固定版本，你拿到的是服务器今天发来的任何东西。",
            "更新机制以后能在你未审查时拉取新代码。"
          ]
        },
        {
          "p": "再读插件如何处理数据与自身代码。几种省略值得注意。"
        },
        {
          "ul": [
            "示例鼓励把令牌或环境变量明文塞进配置。",
            "构建步骤在安装时跑任意代码，不只开发时。",
            "文档从不披露遥测或分析。",
            "没写许可证，你不清楚自己对代码的权利。"
          ]
        },
        {
          "h2": "信号与担忧程度对照表"
        },
        {
          "table": {
            "head": [
              "信号",
              "通常意味着什么",
              "值得担心的程度"
            ],
            "rows": [
              [
                "安装用 curl | sh",
                "代码读前就运行",
                "高"
              ],
              [
                "没有固定版本",
                "收到未审查的更新",
                "中"
              ],
              [
                "未披露遥测",
                "使用被悄悄追踪",
                "中"
              ],
              [
                "链接失效、多年未动",
                "项目可能废弃",
                "维护高危"
              ],
              [
                "权限清楚、有变更日志",
                "维护者考虑了风险",
                "低"
              ]
            ]
          }
        },
        {
          "h2": "粗心与恶意的区别"
        },
        {
          "p": "最有用的判断是区分这两者。多数糟糕 README 只是粗心，缺变更日志不等于恶意，死链烦人但不邪恶。恶意表现为隐藏行为：网络访问遮遮掩掩、安装绕过审查、更新不看就到。学会分辨单薄与不诚实。"
        },
        {
          "blockquote": "粗心的 README 是维护风险。隐藏代码运行的 README 是信任风险。后者才该转身离开。"
        },
        {
          "h2": "一份好的 README 长什么样"
        },
        {
          "p": "好的一份明确说明插件能做什么、不能做什么。"
        },
        {
          "ul": [
            "明确的权限范围，并各给一个理由。",
            "变更日志，写明改了什么、何时改的。",
            "哪怕简短的威胁模型说明。",
            "签名发布，便于核实你下载的东西。"
          ]
        },
        {
          "h2": "你真的能用上的流程"
        },
        {
          "p": "这些不必花很久。首页 / 的评分给第一眼判断，维度在 /blog/dsh-quality-score-decoded 解释，但 README 才是确认处。把厂商挡在评分外：像 /blog/why-independent-plugin-scoring 说的独立数字才值得信任。"
        },
        {
          "ul": [
            "读 README，记下任何没说清的地方。",
            "信任之前，先查那个独立评分。",
            "固定你审查过的确切版本。",
            "先在沙箱或一次性环境里安装。"
          ]
        },
        {
          "h3": "只要用了 curl | sh 就该拒绝吗？"
        },
        {
          "p": "不总是，但应先读那个脚本。读不了就别管道它。先下载检查，再自己运行。这模式有风险，因它默认跳过那一步。"
        },
        {
          "h3": "README 很旧就说明插件不安全吗？"
        },
        {
          "p": "单看不说明。废弃 README 意味着项目可能无人维护，这和无恶意代码不是一回事。决定前先查发布日期，以及链接是否还通。"
        },
        {
          "h3": "评分在这其中是什么位置？"
        },
        {
          "p": "README 是你的确认步骤，评分是快速过滤。用评分给要审的排个序，再让 README 告诉你厂商的话是否和代码对得上。两者合起来胜过单独任一个。"
        }
      ]
    }
  },
  {
    slug: 'dsh-vs-homebrew-ecosystem-risk',
    date: '2026-09-15',
    keywords: ['dsh vs homebrew', 'homebrew cask risk', 'plugin ecosystem comparison', 'dsh plugin safety'],
    longTail: ['dsh plugin vs homebrew cask', 'is homebrew cask safe', 'plugin ecosystem risk comparison', 'third party code review bar'],
    en: {
      title: 'DSH Plugins vs Homebrew Casks: Comparing Ecosystem Risk',
      excerpt: 'Both install third-party code with one command. They carry very different risk profiles, and the difference is worth understanding before you install anything else.',
      metaDescription: 'DSH plugins and Homebrew casks both pull third-party code onto your machine. How their review bar, update model and attack surface differ, and what to check before installing.',
      body: [
        { "h2": "Two one-line installs, two different bargains" },
        { "p": "A Homebrew cask and a DSH plugin both reduce an install to a single command. That convenience hides a review process, and the two ecosystems run very different ones." },
        { "h2": "Review bar" },
        { "table": {"head":["Aspect","Homebrew cask","DSH plugin"],"rows":[["Who reviews","Named maintainers, PR required","Varies by source registry"],["What is checked","URL, checksum, install steps","Depends on the registry policy"],["Removal","Formula removed on report","Depends on registry moderation"]]} },
        { "p": "Homebrew is unusually strict for a package manager. A cask is a declarative recipe, not arbitrary code, and the checksum pins the exact artefact you get. That does not make it safe by default, but it does make the failure modes narrower." },
        { "p": "Plugin ecosystems are broader by design. A plugin runs inside a host application with real access to your files, so the review bar matters more, not less." },
        { "h2": "Update behaviour" },
        { "ul": ["Homebrew updates are explicit. You run the upgrade and you see what moved.","Plugin updates often happen silently when the host starts, which means a new version can arrive without you noticing.","A version you trusted last month is not automatically the version running now."] },
        { "h2": "Attack surface" },
        { "p": "A cask installs an application. A plugin runs code inside an application you already trust, which can inherit its permissions. If the host can read your project files, so can the plugin." },
        { "p": "This is the single most important difference, and it is why locking plugin versions is more valuable than locking cask versions." },
        { "h2": "What to check before installing" },
        { "ul": ["Install counts and how long the package has existed.","Whether the source repository is public and recently touched.","Who can push updates. Open contribution is fine if releases are gated.","Whether the checksum or version is pinned anywhere in the install path."] },
        { "h2": "FAQ" },
        { "h3": "Is Homebrew safer than plugins?" },
        { "p": "The review process is stricter and the format is declarative, so the failure modes are narrower. Whether it is safer overall depends on what you install." },
        { "h3": "Do DSH plugins run with full access?" },
        { "p": "They run with the permissions of the host application, which is usually more access than people expect." },
        { "h3": "Should I pin plugin versions?" },
        { "p": "Yes. Silent updates are the main way a trusted plugin becomes an untrusted one without you doing anything." },
        { "p": "Check plugin quality scores before you install. The scored index lives at dshquality.com." },
      ],
    },
    zh: {
      title: 'DSH 插件与 Homebrew Casks：生态系统风险对比',
      excerpt: '两者都用一条命令装第三方代码，但风险结构差别很大。在继续装东西之前，这个差别值得先搞清楚。',
      metaDescription: 'DSH 插件和 Homebrew Casks 都会把第三方代码装到本机。两者的审核门槛、更新模型和攻击面有何不同，安装前该检查什么。',
      body: [
        { "h2": "同样的一行安装，不同的交易" },
        { "p": "Homebrew cask 和 DSH 插件都把安装简化成一条命令。这个便利背后藏着审核流程，而两个生态执行的是完全不同的审核。" },
        { "h2": "审核门槛" },
        { "table": {"head":["维度","Homebrew cask","DSH 插件"],"rows":[["谁审核","具名维护者，需提交 PR","取决于来源仓库"],["审什么","下载地址、校验和、安装步骤","取决于仓库政策"],["下架机制","被举报后移除 formula","取决于仓库审核力度"]]} },
        { "p": "Homebrew 在包管理器里属于偏严格的一类。cask 是声明式的配方，不是任意代码，而且校验和锁定了你实际拿到的文件。这不等于默认安全，但失效路径明显更窄。" },
        { "p": "插件生态在设计上更开放。插件运行在宿主应用内部，对文件有真实访问权，所以审核门槛应该更高，而不是更低。" },
        { "h2": "更新行为" },
        { "ul": ["Homebrew 的更新是显式的。你主动执行升级，也能看到改了什么。","插件更新经常在宿主启动时静默完成，新版本可能在你没注意的情况下就装上了。","上个月你信任的那个版本，不一定是现在正在跑的版本。"] },
        { "h2": "攻击面" },
        { "p": "cask 安装的是一个应用。插件运行在你自己已经信任的应用里，因此可能继承它的权限。宿主能读你的项目文件，插件也能。" },
        { "p": "这是最重要的差别，也是为什么锁定插件版本比锁定 cask 版本更有价值。" },
        { "h2": "安装前该检查什么" },
        { "ul": ["安装量和这个包存在了多久。","源码仓库是否公开、最近是否还在动。","谁能推送更新。开放贡献没问题，前提是发布环节有把关。","安装路径里有没有任何地方固定了校验和或版本。"] },
        { "h2": "常见问题" },
        { "h3": "Homebrew 比插件更安全吗？" },
        { "p": "审核更严、格式是声明式的，所以失效路径更窄。整体是否更安全取决于你装了什么。" },
        { "h3": "DSH 插件是全权限运行吗？" },
        { "p": "它以宿主应用的权限运行，通常比人们预期的权限更大。" },
        { "h3": "应该锁定插件版本吗？" },
        { "p": "应该。静默更新是「你信任的插件变成不信任的插件」最主要的途径，而且你什么都没做。" },
        { "p": "安装前先看插件质量评分。评分索引在 dshquality.com。" },
      ],
    },
  },
  {
    slug: 'backup-dsh-plugin-configuration',
    date: '2026-09-17',
    keywords: ['dsh plugin backup', 'deepseek harness backup', 'config restore'],
    longTail: ['how to back up dsh plugin config', 'dsh plugin configuration restore', 'where are dsh plugin settings stored', 'dsh plugin migration to new machine'],
    en: {
      title: 'How to Back Up Your DSH Plugin Configuration',
      excerpt: 'Plugin configs die quietly: a bad update, a wiped machine, a repo rename. Here is a backup routine for DSH plugins that survives all three, plus how to restore without guessing.',
      metaDescription: 'How to back up dsh plugin config: find where DSH plugin settings live, automate a versioned backup, and restore cleanly after an update, a crash, or a move to a new machine.',
      body: [
        { p: 'Plugin configuration dies quietly. A bad update resets your settings, a wiped machine takes the whole folder, and a repo rename orphans the install you spent an afternoon tuning. A backup routine for DSH plugins is not a nice-to-have; it is what separates a five-minute restore from an evening of redoing work.' },
        { h2: 'Where DSH plugin settings actually live' },
        { p: 'DeepSeek Harness keeps plugin data in the user config directory, separate from the application install. On Windows that is %APPDATA%\\deepseek-harness, on macOS ~/Library/Application Support/deepseek-harness, and on Linux ~/.config/deepseek-harness. Each plugin stores its own subfolder there, which is why backing up the whole directory captures everything in one move.' },
        { table: { head: ['Platform', 'Config Path', 'What Lives There'], rows: [['Windows', '%APPDATA%\\deepseek-harness', 'Plugin folders, settings.json, logs'], ['macOS', '~/Library/Application Support/deepseek-harness', 'Plugin folders, preferences'], ['Linux', '~/.config/deepseek-harness', 'Plugin folders, config files']] } },
        { h2: 'A backup routine that survives real events' },
        { h3: '1. Copy the config directory, not individual files' },
        { p: 'Plugins write to their own subfolders and occasionally to shared files. Copying the whole deepseek-harness config directory catches everything, including settings you forgot existed.' },
        { h3: '2. Version the backups' },
        { p: 'A single backup file is only useful until the moment it is also corrupted. Keep the last three versions, with a date in the name, so a bad backup does not become your only backup.' },
        { h3: '3. Keep one copy off the machine' },
        { p: 'A backup on the same disk survives a bad update but not a dead drive. One copy in cloud storage or on a second machine covers the hardware failure case.' },
        { h3: '4. Test the restore path' },
        { p: 'Once a month, restore the backup into a fresh harness install and confirm plugins load. A backup that has never been restored is a hope, not a plan.' },
        { h2: 'How to restore after an update or a wipe' },
        { p: 'For a bad update: close harness, replace the plugin subfolder with the backed-up one, restart. For a wiped machine: install harness, copy the config directory back, then verify each plugin appears in the plugin list before relying on it.' },
        { h2: 'FAQ' },
        { h3: 'How often should I back up DSH plugin configs?' },
        { p: 'After any significant change plus a weekly snapshot. Frequency matters less than having a recent copy when something breaks.' },
        { h3: 'Can I sync DSH plugin settings across machines?' },
        { p: 'Yes, if the plugins do not hardcode absolute paths. Copying the config directory to a second machine works for most plugins; path-dependent ones need a manual tweak.' },
        { h3: 'What should I do with a corrupted backup?' },
        { p: 'Go to the previous version, then find what changed in the corrupted one. This is why keeping three versions beats keeping one.' },
        { p: 'Check the plugin quality index at dshquality.com before installing anything new, so the config you are backing up is worth restoring.' },
      ],
    },
    zh: {
      title: '如何备份 DSH 插件配置',
      excerpt: '插件配置死得悄无声息：一次坏更新、一台报废的机器、一次仓库改名。这篇给出一个能扛住这三种情况的 DSH 插件备份流程，以及不用猜的恢复方法。',
      metaDescription: '如何备份 DSH 插件配置：找到 DSH 插件设置的位置，做带版本的自动化备份，并在更新、崩溃或换机器后干净地恢复。',
      body: [
        { p: '插件配置死得悄无声息。一次坏更新重置你的设置，一台报废的机器带走整个目录，一次仓库改名让装好的插件变成孤儿。DSH 插件的备份流程不是可有可无，它决定了你是花五分钟恢复，还是花一个晚上重做。' },
        { h2: 'DSH 插件设置到底存在哪' },
        { p: 'DeepSeek Harness 把插件数据放在用户配置目录，与程序安装目录分开。Windows 上是 %APPDATA%\\deepseek-harness，macOS 上是 ~/Library/Application Support/deepseek-harness，Linux 上是 ~/.config/deepseek-harness。每个插件在自己的子目录里，所以整目录备份一步到位。' },
        { table: { head: ['平台', '配置路径', '里面有什么'], rows: [['Windows', '%APPDATA%\\deepseek-harness', '插件目录、settings.json、日志'], ['macOS', '~/Library/Application Support/deepseek-harness', '插件目录、偏好设置'], ['Linux', '~/.config/deepseek-harness', '插件目录、配置文件']] } },
        { h2: '能扛住真实事故的备份流程' },
        { h3: '1. 备份配置目录，而不是单个文件' },
        { p: '插件会写自己的子目录，偶尔写共享文件。整目录复制能覆盖一切，包括你忘了存在的设置。' },
        { h3: '2. 给备份加版本' },
        { p: '单一备份文件只在你还没碰上它损坏时有用。保留最近三份，文件名带日期，这样坏备份不会变成你唯一的备份。' },
        { h3: '3. 至少一份放在机器之外' },
        { p: '同一块磁盘上的备份能救坏更新，救不了坏硬盘。云存储或第二台机器上放一份，覆盖硬件故障的情况。' },
        { h3: '4. 测试恢复路径' },
        { p: '每月把备份恢复到全新的 harness 安装里，确认插件能加载。从来没恢复过的备份，只是希望，不是方案。' },
        { h2: '更新后或清盘后怎么恢复' },
        { p: '坏更新：关闭 harness，用备份的插件子目录替换当前的，重启。清盘：装好 harness，把配置目录复制回去，逐个确认插件出现在列表里再依赖它。' },
        { h2: '常见问题' },
        { h3: '多久备份一次 DSH 插件配置？' },
        { p: '重大变更后各一次，外加每周快照。频率不是重点，重点是出问题时手边有一份最近的副本。' },
        { h3: '能在多台机器间同步 DSH 插件设置吗？' },
        { p: '能，前提是插件没有写死绝对路径。把配置目录复制到第二台机器，多数插件能直接工作；依赖路径的插件需要手动调整。' },
        { h3: '备份损坏了怎么办？' },
        { p: '用上一版，再对比损坏的那版发生了什么。这就是保留三份而不是一份的原因。' },
        { p: '安装任何新插件前，先看 dshquality.com 的插件质量评分，确保你要备份的配置值得恢复。' },
      ],
    },
  },

  {
    slug: "how-to-evaluate-plugin-documentation-quality",
    date: "2026-09-21",
    keywords: [
      "plugin documentation quality",
      "how to evaluate plugin docs",
      "documentation review checklist",
      "plugin docs best practices",
      "evaluate technical documentation",
    ],
    longTail: [
      "how to tell if a plugin has good documentation before installing",
      "plugin documentation checklist for developers",
      "what makes technical documentation trustworthy",
      "signs of poorly maintained plugin documentation",
      "how to evaluate open source plugin docs quickly",
    ],
    en: {
      title: "How to Evaluate Plugin Documentation Quality Before You Install",
      excerpt: "A practical checklist for judging whether a plugin's documentation will actually support you - or leave you stranded three months into production.",
      metaDescription: "Learn how to evaluate plugin documentation quality with a concrete checklist covering accuracy, completeness, examples, versioning, and maintenance signals.",
      body: [
        { p: "Documentation is the only part of a plugin that tells you whether its authors expect you to succeed. You can read a repository's source code for hours and still not know whether the maintainers understand how their tool is actually used. But a documentation set reveals that in about ten minutes - if you know what to look at." },
        { h2: "1. Start With the Quickstart, Not the API Reference" },
        { p: "The quickstart is the single most revealing page in any documentation set. A good one gets a working installation in under five minutes, on a clean machine, using only what is written on that page. If you find yourself following an unstated assumption - a config file that is never shown, an environment variable that appears only in a later section - that is a maintenance signal, not an oversight." },
        { ul: [
          "Does it state the exact versions it was tested against?",
          "Does it show the expected output, not just the command?",
          "Does it work if you follow it literally, with no prior knowledge?",
          "Does it tell you how to verify the install succeeded?",
        ] },
        { h2: "2. Check Whether Examples Are Runnable" },
        { p: "Copy-paste is the honest test. Take the first substantial code example in the docs and paste it into a fresh file with no edits. If it fails, ask why: is it a typo, a missing import, or a stale API that changed two major versions ago? The third possibility is the dangerous one, because it means nobody ran the docs during the upgrade." },
        { h3: "The stale example heuristic" },
        { p: "When an example imports from an old package path or uses a callback style that the library abandoned, expect the rest of that page to be equally dated. Stale examples almost never appear alone." },
        { h2: "3. Look for the Error Paths" },
        { p: "Documentation that only covers the happy path is advertising, not documentation. Search the docs for words like 'error', 'fails', 'troubleshooting', and 'permissions'. A mature documentation set will tell you what goes wrong, what the error message means, and what to do about it. A thin one will assume nothing ever breaks." },
        { h2: "4. Verify the Versioning Story" },
        { p: "Does the documentation correspond to a specific version, or is it an undated blob that claims to describe everything? Look for a version selector, a changelog link, or migration guides between major releases. Migration guides are the strongest single signal of a maintained project, because writing one costs real effort and only pays off if the maintainers intend to keep going." },
        { h2: "5. Read the Contribution and Support Sections" },
        { p: "These sections tell you what happens on a bad day. A documented issue template, a stated response window, a security disclosure policy, and a visible commit cadence all indicate that the project has an operating model. Their absence does not mean the plugin is bad - but it does mean that when something breaks, you are on your own." },
        { h2: "The Ten-Minute Checklist" },
        { ul: [
          "Quickstart: does it produce a working install if followed literally?",
          "Examples: do they run unedited?",
          "Errors: are failure modes documented with meanings and fixes?",
          "Versioning: is there a changelog and at least one migration guide?",
          "Support: is there an issue template and a stated response expectation?",
          "Freshness: is the most recent doc commit within the last six months?",
        ] },
        { p: "Run this checklist against three plugins you already use, and you will calibrate your own threshold quickly. The point is not to demand perfection - it is to know, before you commit, what kind of support you are buying into." },
      ],
    },
    zh: {
      title: "安装之前，如何评估插件文档质量",
      excerpt: "一份可操作的清单，帮你在装插件之前判断它的文档到底能不能在关键时刻救你。",
      metaDescription: "用一份具体清单学会评估插件文档质量：准确性、完整性、示例可运行性、版本管理与维护信号。",
      body: [
        { p: "文档是插件里唯一会告诉你「作者是否希望你成功」的部分。你可以读几个小时的源码，仍然不知道维护者是否真的理解他们的工具是怎么被使用的。但一套文档能在十分钟内暴露这件事——前提是你知道该看哪里。" },
        { h2: "一、先看快速开始，而不是 API 参考" },
        { p: "快速开始是任何文档中最有信息量的一页。好的快速开始能让你在一台干净的机器上、只依靠这一页的内容，五分钟内跑起来。如果你发现自己在补全某个从未展示过的配置文件、某个只在后面章节出现的环境变量，那是维护信号，不是疏漏。" },
        { ul: [
          "是否写明了测试所针对的具体版本？",
          "是否展示了预期输出，而不只是命令？",
          "零基础照做，能不能真的跑通？",
          "是否告诉你如何验证安装成功？",
        ] },
        { h2: "二、检查示例是否可运行" },
        { p: "复制粘贴是最诚实的测试。把文档里第一个像样的代码示例原样粘进一个新文件，不做任何修改。如果报错，追问原因：是拼写错误、缺少 import，还是某个两个大版本前就废弃的旧 API？第三种最危险，因为它意味着升级时根本没人跑过文档。" },
        { h3: "过期示例的启发式" },
        { p: "当一个示例从旧包路径导入，或使用库里早已废弃的回调风格，基本可以断定这一页的其余内容同样陈旧。过期的示例几乎从不单独出现。" },
        { h2: "三、找错误路径" },
        { p: "只写顺利路径的文档不是文档，是广告。在文档里搜索「error」「失败」「故障排查」「权限」这类词。成熟的文档会告诉你什么会出错、报错信息意味着什么、该怎么处理。单薄的文档则默认一切永不失败。" },
        { h2: "四、核实版本管理这件事" },
        { p: "文档是否对应某个具体版本，还是一坨声称覆盖一切的、没有日期的内容？找版本选择器、changelog 链接、或大版本之间的迁移指南。迁移指南是项目是否在维护的最强单一信号，因为写它需要真实投入，而只有维护者打算继续做下去时这笔投入才划得来。" },
        { h2: "五、读贡献与支持部分" },
        { p: "这两节告诉你「出事了会怎样」。有记录的 issue 模板、明确承诺的响应窗口、安全披露政策、可见的提交节奏，都说明这个项目有一套运行机制。没有这些不代表插件差——但意味着出事时你得自己扛。" },
        { h2: "十分钟清单" },
        { ul: [
          "快速开始：照做是否得到可运行的安装？",
          "示例：不做修改能否运行？",
          "错误：失败模式是否有含义解释与修复方法？",
          "版本：是否有 changelog 与至少一篇迁移指南？",
          "支持：是否有 issue 模板与明确的响应预期？",
          "新鲜度：文档最近一次提交是否在半年内？",
        ] },
        { p: "拿这份清单去核对三个你已经在用的插件，你很快就会校准出自己的阈值。重点不是要求完美——而是在做出承诺之前，先知道自己在选择什么样的支持。" },
      ],
    },
  },
  {
    slug: 'plugin-middleman-trust',
    date: '2026-10-02',
    keywords: ['open source trust', 'plugin distribution risk', 'plugin middleman', 'plugin provenance'],
    longTail: ['open source trust', 'plugin distribution risk', 'plugin registry middleman', 'verifying plugin provenance'],
    en: {
      title: 'Trust in Open Source: The Plugin Middleman Problem',
      excerpt:
        'Reading the source tells you about the author. It tells you nothing about the registry, mirror, or install script between the author and your machine.',
      metaDescription:
        'Open source trust breaks at the distribution layer. How plugin distribution risk creeps in through registries, mirrors, and install-time scripts, and how to verify plugin provenance in ten minutes.',
      body: [
        { p: "Open source trust has always rested on a simple idea: you can read the code, so you can decide for yourself. That idea holds when you install from the author. It gets weaker the moment a plugin distribution layer sits between the author and you, because what you install is no longer exactly what they published. Plugin distribution risk is mostly not about malicious authors. It is about the quiet intermediaries that repackage, mirror, cache, or re-score a plugin before it reaches your machine, and about how hard verifying plugin provenance becomes once they exist." },
        { h2: 'The trust chain you actually accept' },
        { p: 'Install one plugin and you accept a chain with at least four links.' },
        { table: { head: ['Link', 'Who controls it', 'What can differ from the source'], rows: [
          ['Source repo', 'The author', 'Nothing, this is the reference'],
          ['Registry or index', 'Platform operator', 'Metadata, tags, version ordering'],
          ['Mirror or CDN', 'Hosting provider', 'Cached bytes, stale versions'],
          ['Installer script', 'Plugin or wrapper author', 'Extra downloads, post-install steps'],
        ] } },
        { p: 'Each link can be honest and still produce a result that does not match the repository you read. A cached tarball from last month is not malicious. It is also not the version whose changelog you just reviewed.' },
        { h2: 'Where the middleman sits' },
        { p: 'The word covers several distinct roles, and they carry different risk.' },
        { ul: [
          'Aggregator sites list plugins they do not maintain. Their value is discovery; their risk is that listing data goes stale and nobody owns correcting it.',
          'Wrapper packages depend on the real plugin and add configuration. Convenient, but you now trust two maintainers instead of one.',
          'Mirrors are set up for network or compliance reasons inside a company. Fast, and a silent source of version drift.',
          'Install scripts fetched at install time rather than stored in the package. The package can be clean and the script can still do something else six months later.',
        ] },
        { h2: 'Four failure modes that are not attacks' },
        { p: 'Most real-world trouble comes from neglect rather than malice.' },
        { ul: [
          'Version drift: the index shows 2.4.1, the mirror serves 2.3.8, and your lockfile records something else. Nothing breaks loudly.',
          'Abandoned wrappers: the upstream plugin is maintained, the wrapper has not been touched in two years and pins an old API.',
          'Metadata inflation: tags and category placement are often written by whoever submitted the listing, not the author, so search results reflect marketing rather than function.',
          'Install-time fetching: a plugin that downloads part of itself during install has a trust boundary you cannot review from the package contents.',
        ] },
        { h2: 'What an intermediary can change without telling you' },
        { p: 'Three things specifically: which version you get, what metadata describes it, and what runs after the download finishes. None of these require write access to the author repository, which is why repository-level security work does not address them.' },
        { blockquote: 'A signed commit proves the author published that commit. It does not prove the thing you installed was built from it.' },
        { h2: 'Checking the chain in ten minutes' },
        { ul: [
          'Compare the version in the index against the latest release in the source repository. If they disagree, find out why before installing.',
          'Read the install script before running it, and prefer packages that ship the script rather than fetching it.',
          'Look for a wrapper. If the name you install is not the name on the repository, you have added a maintainer.',
          'Check the last publish date of the artifact, not the last commit of the repo.',
          'Confirm the maintainer identity on the registry matches the one on the repository.',
        ] },
        { h2: 'What independent scoring changes here' },
        { p: 'A score computed by the same party that distributes the plugin measures distribution, not trustworthiness. Independent scoring looks at the artifact rather than the listing: does the published version match the repository, is the install path inspectable, how long has the artifact been unchanged. That is why self-reported ratings drift upward over time while independent scores stay flat. The gap between them is itself a signal.' },
        { p: 'Pick the three plugins your setup depends on most and trace each link on dshquality.com. The scoring method behind this is explained at /blog/why-independent-plugin-scoring-beats-self-reported-ratings, and the full index is at /.' },
      ],
    },
    zh: {
      title: '开源信任：插件中间人问题',
      excerpt: '读源码说明的了作者，说明不了作者和你之间的注册表、镜像和安装脚本。',
      metaDescription:
        '开源信任在分发层断裂。插件分发风险如何通过注册表、镜像和安装时脚本悄悄进入，以及如何在十分钟内验证插件来源。',
      body: [
        { p: "开源信任一直建立在一个简单的前提上：代码你能读，所以你能自己判断。当你直接从作者那里安装，这个前提成立；一旦作者和你之间插入了一层插件分发环节，它就明显变弱——你装到的东西已经不完全是作者发布的那个东西。插件分发风险主要不是来自恶意作者，而是来自那些在你机器上之前会重新打包、镜像、缓存或重新评分插件的、不起眼的中间环节，以及一旦它们存在，验证插件来源这件事会变得多难。" },
        { h2: '你实际接受的信任链' },
        { p: '装一个插件，你就接受了一条至少四环的链。' },
        { table: { head: ['环节', '谁控制', '可能与源不一致的地方'], rows: [
          ['源仓库', '作者', '无，这是基准'],
          ['注册表 / 索引', '平台方', '元数据、标签、版本排序'],
          ['镜像 / CDN', '托管方', '缓存的文件、陈旧版本'],
          ['安装脚本', '插件或包装方', '额外下载、安装后步骤'],
        ] } },
        { p: '每一环都可以是善意的，仍然会产出一个和你读过的仓库不完全一致的结果。上个月的缓存包不是恶意的，但它也不是你刚看过 changelog 的那个版本。' },
        { h2: '中间人究竟在哪一层' },
        { p: '这个词涵盖几种不同角色，风险各不相同。' },
        { ul: [
          '聚合站点收录自己并不维护的插件。价值在发现，风险在列表数据会过期，而且没人负责更正。',
          '包装包依赖真正的插件再加一层配置。方便，但你要信任的维护者从一个变成两个。',
          '镜像是公司内为网络或合规原因搭建的。快，也是版本漂移的安静来源。',
          '安装脚本在安装时才拉取，而不是打包在包里。包本身可以干净，脚本半年后干的事可以完全不同。',
        ] },
        { h2: '四种不算攻击的失效方式' },
        { p: '现实里多数麻烦来自疏忽，不是恶意。' },
        { ul: [
          '版本漂移：索引显示 2.4.1，镜像给的是 2.3.8，你的锁文件记录的又是另一个。没有任何东西明确报错。',
          '包装包被弃：上游插件还在维护，包装包两年没动，还钉在旧 API 上。',
          '元数据注水：标签和分类往往是提交列表的人写的，不是作者。搜索结果于是反映营销，而不是功能。',
          '安装时拉取：插件在安装过程中下载自身的一部分，信任边界就落在你无法从包内容里审查的地方。',
        ] },
        { h2: '中间方可以不通知你就改的三件事' },
        { p: '具体来说是三件：你拿到哪个版本、用什么元数据描述它、下载完成后执行什么。这三件都不需要拿到作者仓库的写权限，这也正是仓库侧的安全工作覆盖不到它们的原因。' },
        { blockquote: '签名提交证明作者发布过那个提交，不证明你装的东西是由它构建出来的。' },
        { h2: '十分钟检查一遍信任链' },
        { ul: [
          '把索引里的版本和源仓库最新 release 对一下。不一致就先弄清楚再装。',
          '运行安装脚本之前先读一遍，优先选把脚本打包进包里的，而不是运行时拉取的。',
          '找找有没有包装层。如果你安装的名字和仓库上的名字不一样，你就多加了一个维护者。',
          '看产物的最后发布时间，不是仓库的最后提交时间。',
          '确认注册表上的维护者身份和仓库上的是同一个。',
        ] },
        { h2: '独立评分在这里改变了什么' },
        { p: '由分发方自己算的分数，衡量的是分发，不是可信度。独立评分看的是产物本身：发布的版本和仓库是否一致、安装路径是否可审查、产物多久没变过。这也是为什么自报评分长期会往上飘，而独立评分保持平稳。这个差值本身就是信号。' },
        { p: '挑出你的环境最依赖的三个插件，到 dshquality.com 把上面每一环过一遍。背后的评分方法见 /blog/why-independent-plugin-scoring-beats-self-reported-ratings，完整索引在 /。' },
      ],
    },
  },
  {
    slug: 'dsh-plugin-review-process',
    date: '2026-10-03',
    keywords: ['plugin review process', 'dsh plugin governance', 'plugin approval workflow', 'supply chain review'],
    longTail: ['plugin review checklist', 'PR plugin gate', 'dsh plugin approval workflow', 'reviewing new plugins before install'],
    en: {
      title: 'How to Set Up a DSH Plugin Review Process for Your Repo',
      excerpt:
        'Banning plugins does not work and installing on request is worse. A short review process catches the bad ones without turning every new plugin into a meeting.',
      metaDescription:
        'A practical plugin review process for your repo: the plugin review checklist every new dependency passes, how to wire a PR plugin gate in CI, and a dsh plugin approval workflow that keeps reviewing new plugins before install a ten-minute job.',
      body: [
        { p: "Most teams end up in one of two places: plugins are banned outright, or anyone can add one and nobody looks. A plugin review process is the third option, and it is faster than both. This guide covers the plugin review checklist a new plugin passes before it lands, where to put the PR plugin gate so it does not become a bottleneck, and a dsh plugin approval workflow that keeps reviewing new plugins before install a ten-minute job instead of a scheduled meeting." },
        { h2: 'Why a ban fails and open install is worse' },
        { p: 'A ban does not stop plugin use. It moves it to personal machines and throwaway branches, where nothing is recorded and nobody reviews anything. Open install is the opposite failure: the dependency list grows, the review surface grows with it, and the first time something breaks you have to audit a hundred entries under time pressure.' },
        { ul: [
          'Ban: no record, no review, no way to answer "what are we running" in an incident.',
          'Open install: full record, zero review, and a dependency list nobody can vouch for.',
          'Review process: the record exists and the review is scaled to the risk.',
        ] },
        { h2: 'The plugin review checklist' },
        { p: 'Keep it to eight items, in this order. The first four are mechanical and take about four minutes; the last four are judgement calls.' },
        { ul: [
          'Identity: does the index name match the source repo name, or is there a wrapper in between?',
          'Recency: when was the last publish, not the last commit?',
          'Install path: read the install script. Anything fetched at runtime is a separate review.',
          'Score: check the current DSH score and, more usefully, whether it has been dropping.',
          'Scope: does it ask for permissions or file access wider than the job it does?',
          'Maintenance: open issue response time over the last three months.',
          'Bus factor: how many people have committed in the last six months?',
          'Exit plan: if you remove it next quarter, what breaks?',
        ] },
        { p: 'The first four are the ones that catch supply chain problems. The last four decide whether you want to depend on it for a year.' },
        { h2: 'Where the PR plugin gate belongs' },
        { p: 'A PR plugin gate is a check in CI that runs when a pull request touches the plugin manifest. It does not reject; it prints what changed and what the reviewer should look at. There are three sensible placements.' },
        { table: { head: ['Placement', 'What it catches', 'Cost'], rows: [
          ['Pre-commit hook', 'Typo and name errors before a PR exists', 'Low, runs locally'],
          ['PR check (recommended)', 'Every manifest diff, with score and install-script summary', 'Low, a few seconds'],
          ['Release gate', 'Plugins added outside the manifest on developer machines', 'High, needs machine inventory'],
        ] } },
        { p: 'Start with the PR check. It covers the path almost every plugin actually takes, and the diff it prints is the same artifact a human reviewer would assemble by hand.' },
        { h2: 'Thresholds worth enforcing' },
        { p: 'Pick numbers before you need them, and make them few. Three tiers is enough.' },
        { table: { head: ['Tier', 'Condition', 'Action'], rows: [
          ['Auto-approve', 'Score 80+, install script bundled, index name matches repo', 'Merge without review'],
          ['One reviewer', 'Score 60-79, or any single mechanical check unclear', 'One approval, checklist attached to the PR'],
          ['Hold', 'Score under 60, runtime fetch in install script, or name mismatch', 'Needs a written reason and a second approval'],
        ] } },
        { blockquote: 'A gate that blocks everything gets disabled within a month. A gate that prints a diff and asks one question survives, because it is cheaper than the argument it replaces.' },
        { h2: 'Rolling it out without annoying everyone' },
        { ul: [
          'Run the gate in report-only mode for two weeks. Collect what it would have flagged before you enforce anything.',
          'Approve the existing manifest in one commit, so the baseline is clean and every later diff is meaningful.',
          'Put the checklist in the PR template, not in a wiki nobody opens.',
          'Name one owner per plugin in the manifest. Rotating ownership is the usual reason review decays.',
          'Re-review quarterly, and only the entries whose score moved.',
        ] },
        { h2: 'FAQ' },
        { ul: [
          'How long should a review take? Ten minutes for a tier-two plugin, and most of that is reading the install script.',
          'Does this slow down installs? No. The gate runs on the manifest diff, not on the developer machine.',
          'What about plugins installed globally outside the repo? That is the release gate tier, and it needs machine inventory first.',
          'Do we need to review removals too? Only when the plugin was a tier-three approval, since that is where the exit plan was written down.',
        ] },
        { p: 'Start with the checklist and the PR check; the rest can come later. The team-wide version of this is covered in /blog/plugin-supply-chain-security-team-enforcement, the per-plugin red flags are listed in /blog/how-to-avoid-risky-dsh-plugins, and if you want to fix the list you already have, /blog/setting-up-a-plugin-allowlist-for-your-dev-team walks through it. Score thresholds are explained in /blog/dsh-quality-score-decoded, and the full plugin index is at /.' },
      ],
    },
    zh: {
      title: '如何为你的仓库建立 DSH 插件评审流程',
      excerpt:
        '一刀切禁用不管用，随装随用更糟。一套简短的评审流程能在不把每个新插件都变成一场会的前提下，把有问题的挡在外面。',
      metaDescription:
        '一套可落地的插件评审流程：新依赖要过的插件评审清单、PR 插件闸门在 CI 里怎么接，以及一套把安装前审查新插件控制在十分钟内的 DSH 插件审批流程。',
      body: [
        { p: '多数团队最后落在两个位置之一：要么干脆禁用插件，要么谁都能加、没人看。插件评审流程是第三条路，而且比前两条都快。这篇讲新插件落地前要过的插件评审清单、PR 插件闸门放在哪里才不会变成瓶颈，以及一套把安装前审查新插件控制在十分钟而不是排一次会的 DSH 插件审批流程。' },
        { h2: '为什么禁用会失败，而放开更糟' },
        { p: '禁用挡不住插件的使用，只是把它赶到个人机器和临时分支上去 —— 那里没有任何记录，也没有任何人审查。放开是相反的失败：依赖列表在长，审查面跟着长，等到第一次出事，你得在时间压力下审计上百条记录。' },
        { ul: [
          '禁用：没有记录、没有审查，出事时回答不了「我们现在到底在跑什么」。',
          '放开：记录完整、审查为零，依赖列表没人敢担保。',
          '评审流程：记录存在，且审查的强度与风险匹配。',
        ] },
        { h2: '插件评审清单' },
        { p: '控制在八条，按这个顺序。前四条是机械检查，大约四分钟；后四条是判断。' },
        { ul: [
          '身份：索引上的名字和源仓库一致吗，中间有没有包装层？',
          '新鲜度：看最后发布时间，不是最后提交时间。',
          '安装路径：把安装脚本读一遍。任何运行时拉取的东西都要单独审。',
          '评分：查当前 DSH 评分，更有用的是看它有没有在往下掉。',
          '权限范围：它要的权限或文件访问，比它要干的活大吗？',
          '维护：近三个月 issue 的响应时间。',
          '巴士系数：近六个月有几个人提交过代码？',
          '退出方案：如果下个季度要摘掉它，会断什么？',
        ] },
        { p: '前四条拦的是供应链问题。后四条决定的是你愿不愿意依赖它一年。' },
        { h2: 'PR 插件闸门放在哪里' },
        { p: 'PR 插件闸门是 CI 里的一条检查，在 pull request 改动插件清单时触发。它不做拒绝，只打印改了什么、审查者该看什么。有三个合理的落点。' },
        { table: { head: ['落点', '能拦住什么', '成本'], rows: [
          ['提交前钩子', 'PR 还没建就已经发现拼写和名字错误', '低，本地跑'],
          ['PR 检查（推荐）', '每一次清单 diff，附评分与安装脚本摘要', '低，几秒钟'],
          ['发布闸门', '开发者在清单之外、装在机器上的插件', '高，需要先有机器清单'],
        ] } },
        { p: '从 PR 检查开始。它覆盖了几乎所有插件实际会走的那条路，而且它打印的 diff，本来就是人工审查者要手工拼出来的东西。' },
        { h2: '值得强制执行的阈值' },
        { p: '在你还不需要的时候就先把数字定下来，而且别定太多。三档就够了。' },
        { table: { head: ['档位', '条件', '动作'], rows: [
          ['自动通过', '评分 80 以上、安装脚本打包在内、索引名与仓库名一致', '免审查直接合并'],
          ['单人审查', '评分 60 到 79，或某项机械检查不清楚', '一次批准，清单附在 PR 上'],
          ['暂缓', '评分低于 60、安装脚本里有运行时拉取、或名字不一致', '需要书面理由加第二次批准'],
        ] } },
        { blockquote: '什么都拦的闸门，一个月内就会被关掉。只打印 diff、只问一个问题的闸门活得下来，因为它比它替代的那场争论更便宜。' },
        { h2: '推行时不惹恼所有人的做法' },
        { ul: [
          '先让闸门只报告、不拦截，跑两周。在强制之前，先看它本来会标出什么。',
          '用一次提交把现有清单整体批准，让基线干净，之后的每次 diff 才有意义。',
          '把清单放进 PR 模板，别放进一个没人打开的 wiki。',
          '在清单里给每个插件写清一个负责人。负责人轮换是审查走样最常见的原因。',
          '每季度复审一遍，而且只复审评分发生变化的那些。',
        ] },
        { h2: '常见问题' },
        { ul: [
          '一次审查要多久？二档插件十分钟，其中大部分花在读安装脚本上。',
          '会不会拖慢安装？不会。闸门跑在清单 diff 上，不在开发者机器上。',
          '装在仓库之外、全局的插件怎么办？那是发布闸门那一档，而且先得有机器清单。',
          '移除插件也要审吗？只有当初是三档批准的才需要，因为退出方案只写在那一档里。',
        ] },
        { p: '先从清单和 PR 检查开始，其余的可以后补。团队层面的做法见 /blog/plugin-supply-chain-security-team-enforcement，单个插件的危险信号列在 /blog/how-to-avoid-risky-dsh-plugins，想先修你手头这份清单的话，/blog/setting-up-a-plugin-allowlist-for-your-dev-team 里有步骤。评分阈值在 /blog/dsh-quality-score-decoded 里讲过，完整插件索引在 /。' },
      ],
    },
  },
  {
    slug: 'dependency-confusion',
    date: '2026-10-04',
    keywords: ['dependency confusion', 'plugin supply chain attack', 'plugin name impersonation', 'registry security'],
    longTail: ['dependency confusion attack', 'typosquatting plugin names', 'private registry hijack', 'plugin name impersonation'],
    en: {
      title: 'Dependency Confusion: The Threat Hiding in Plugin Names',
      excerpt:
        'No phishing, no compromised maintainer, no malicious commit. Someone registers a name you already use and waits for your resolver to pick theirs.',
      metaDescription:
        'A dependency confusion attack explained for plugin users: how typosquatting plugin names and private registry hijack work, the plugin name impersonation signals you can check in three minutes, and the registry settings that stop all three.',
      body: [
        { p: "Dependency confusion hides inside a name. A manifest asks for something called internal-utils, the resolver takes the highest version it can find, and the copy it finds is not yours: a public package carrying the same name wins because its version number is bigger. No one phished you and no maintainer was compromised. Someone read a name out of your repository and registered it. Below: how a dependency confusion attack is carried out, what separates it from typosquatting plugin names, where private registry hijack fits in the same family, and the plugin name impersonation signals you can actually verify before installing." },
        { h2: 'How a dependency confusion attack runs' },
        { p: 'The steps are dull, which is part of why nobody catches them. Someone reads a public repository, finds a private dependency named in a manifest, and registers that exact name on the public registry with a version number high enough to win any comparison. The next time a build resolves dependencies without a scope or a registry pin, it pulls the public copy instead of the internal one. Nothing in the diff looks wrong, because the manifest line never changed.' },
        { ul: [
          'Internal names are guessable. They follow naming conventions that leak through documentation, stack traces and example configs.',
          'Version resolution usually prefers the highest number available, so an attacker controls the outcome by publishing something absurd like 99.0.0.',
          'Code review does not help here. The change you would be reviewing is not in your repository.',
        ] },
        { h2: 'Typosquatting plugin names is the cheaper cousin' },
        { p: 'Typosquatting plugin names needs none of that reconnaissance. The attacker takes a popular name and registers near-misses: transposed letters, a hyphen where you expect an underscore, a plausible-looking prefix. The economics favour them, since one mistyped install command is enough and the person mistyping is usually in a hurry.' },
        { table: { head: ['Aspect', 'Dependency confusion', 'Typosquatting'], rows: [
          ['What gets abused', 'A real private name that already exists', 'A misspelling of a public name'],
          ['Who gets hit', 'Teams running a private registry', 'Anyone typing quickly'],
          ['Where it is caught', 'Registry config and scope rules', 'A name check before install'],
          ['Cleanup afterwards', 'Purge caches, re-pin, rotate secrets', 'Remove the package, check what it did'],
        ] } },
        { p: 'Both end the same way: software you did not choose runs on machines you are responsible for. Only the entry point differs, so the two are worth defending against together rather than separately.' },
        { h2: 'Private registry hijack sits between them' },
        { p: 'A private registry hijack is the variant people forget, because nothing about the plugin looks wrong. The namespace existed legitimately for years, then ownership lapsed: expired payment, an abandoned maintenance account, a domain transfer nobody watched. A new party takes control of a name other people already depend on, and the package keeps working exactly as before, which is what makes it hard to notice.' },
        { h2: 'Plugin name impersonation signals worth checking' },
        { p: 'Three minutes with a name rules out most of this. What you are looking for is a mismatch between how established a plugin appears and how thin its actual history is.' },
        { table: { head: ['Signal', 'Healthy', 'Suspicious'], rows: [
          ['Publisher vs repo owner', 'Same org on the index and the source', 'Index name appears nowhere in the repo'],
          ['First publish date', 'Years of releases', 'Recent publish, widely referenced anyway'],
          ['Namespace', 'Scoped, such as @acme/tool', 'Unscoped generic noun'],
          ['Install behaviour', 'Reads bundled files', 'Fetches from a host registered recently'],
        ] } },
        { blockquote: 'On a public registry a name is a claim, not an identity. Verify the thing behind the name rather than the name itself.' },
        { h2: 'Where the fixes belong' },
        { p: 'This is one of the few supply chain problems with cheap mitigations, and they live in four different places. You want all four, because each one covers a case the others miss.' },
        { ul: [
          'Registry side: claim your prefixes and enable namespace protection, so nobody can register anything matching them.',
          'Resolver side: disable the behaviour that lets a public source satisfy a name you normally pull privately.',
          'CI side: fail the build when a manifest adds a name whose owner does not match a known publisher, instead of printing a warning.',
          'Index side: check the entry against the source repository before installing, using the same checks described in /blog/how-to-avoid-risky-dsh-plugins.',
        ] },
        { h2: 'FAQ' },
        { ul: [
          'Is dependency confusion still common? Less than at its peak, because large registries now offer namespace protection and most package managers default to scoped installs. It survives in smaller ecosystems and internal mirrors.',
          'Does version pinning solve it? Partly. Pinning stops the surprise upgrade but not the first wrong install. Pinning the source registry is the part that closes it.',
          'How is this different from a compromised maintainer? A compromised maintainer is a person problem; this is a naming problem. The code was never trustworthy from the first publish.',
          'What should I do today? Claim your prefixes on the public registry you use, then check whether any manifest entry resolves from somewhere you did not intend.',
        ] },
        { p: 'All three variants start in the name field, so that is where to spend your attention first. The related naming games are covered in /blog/tag-baiting-problem, per-plugin red flags are listed in /blog/how-to-avoid-risky-dsh-plugins, team-wide enforcement with an allowlist is described in /blog/plugin-supply-chain-security-team-enforcement and /blog/setting-up-a-plugin-allowlist-for-your-dev-team, registry-side scanning in CI is at /blog/ci-cd-plugin-scanning, and the full plugin index is at /.' },
      ],
    },
    zh: {
      title: '依赖混淆：藏在插件名字里的威胁',
      excerpt:
        '不用钓鱼、不用拿下维护者账号、也不用提交恶意代码。有人把你已经在用的名字注册走，然后等你的解析器选他那份。',
      metaDescription:
        '讲清依赖混淆攻击对插件用户意味着什么：抢注相似插件名和私有仓库劫持分别怎么发生，三分钟内能查完的插件冒名信号有哪些，以及能一次挡住这三类的仓库端设置。',
      body: [
        { p: '依赖混淆就藏在一个名字里。清单向解析器要一个叫 internal-utils 的东西，解析器取它能找到的最高版本，结果拿到的那一份不是你的：一个同名公开包因为版本号更大而胜出。没有人被钓鱼，也没有维护者账号失守。有人从你的仓库里读到一个名字，把它注册走了。下面讲依赖混淆攻击是怎么跑通的、抢注相似插件名和它有什么区别、私有仓库劫持在这个家族里占什么位置，以及安装前三分钟就能验完的插件冒名信号。' },
        { h2: '依赖混淆攻击是怎么跑通的' },
        { p: '步骤很枯燥，这也正是没人发现它的原因之一。有人翻完公开仓库，在清单里找到一个私有依赖名，然后把这个名字原样注册到公开仓库，版本号抬到足以在任何比较里胜出。下一次构建在解析依赖时既没有 scope 也没有锁定来源，抓到的就是那份公开副本而不是你的内部包。diff 里看不出问题，因为清单那一行从头到尾没改过。' },
        { ul: [
          '内部包名是可以猜的。它们遵循内部命名习惯，而这套习惯会从文档、报错堆栈和示例配置里漏出去。',
          '版本解析通常取可用范围内的最高版本号，所以攻击者发一个 99.0.0 这种荒唐版本号就能控制结果。',
          '代码审查看不出这种问题。你本该 review 的那次改动，压根不在你的仓库里。',
        ] },
        { h2: '抢注相似插件名是它的廉价版' },
        { p: '抢注相似插件名连前期侦察都不需要。攻击者挑一个热门名字，然后把各种近似写法注册下来：字母换个顺序、你以为下划线的地方写成连字符、加个看起来像那么回事的前缀。这件事的经济学对他们有利，因为只要有一条安装命令打错就够了，而打错的人通常在赶时间。' },
        { table: { head: ['维度', '依赖混淆', '抢注相似名'], rows: [
          ['被利用的是什么', '一个真实存在的私有名字', '一个公开名字的错拼写法'],
          ['谁会被打中', '跑私有仓库的团队', '任何手快的人'],
          ['在哪一步被拦下', '仓库端配置与 scope 规则', '安装前对名字做一次核对'],
          ['事后怎么清理', '清缓存、重新锁定来源、轮换密钥', '删掉这个包，查清它做过什么'],
        ] } },
        { p: '两者的结局是一样的：你没选过的软件跑在了你负责的机器上。区别只在入口处，所以这两件事应该一起防，而不是分开防。' },
        { h2: '夹在中间的私有仓库劫持' },
        { p: '私有仓库劫持是最容易被人忘掉的那种，因为插件本身看不出任何不对。这个命名空间合法存在了好些年，然后所有权断了：付费到期、维护账号被弃用、域名过户时没人盯着。新的控制方接手一个别人已经在依赖的名字，而这个包照旧能正常工作——这恰恰是它难以被发现的原因。' },
        { h2: '值得查的插件冒名信号' },
        { p: '花三分钟核一遍名字，就能排除掉大部分情况。你要找的是一种错位：某个插件看起来很成熟，实际历史却薄得不合比例。' },
        { table: { head: ['信号', '正常情况', '可疑情况'], rows: [
          ['发布者与仓库归属', '索引与源码同属一个组织', '索引上的名字在仓库里根本不出现'],
          ['首次发布时间', '有连续数年的版本', '刚发布不久却已被到处引用'],
          ['命名空间', '带 scope，如 @acme/tool', '无 scope 的通用名词'],
          ['安装行为', '只读包内文件', '从注册不久的主机拉取内容'],
        ] } },
        { blockquote: '在公开仓库上，名字只是声明，不是身份。要验的是名字背后那个东西，而不是名字本身。' },
        { h2: '修复该落在哪里' },
        { p: '这是供应链问题里少数几个缓解成本低的一种，而且这些措施分散在四个地方。四处都要做，因为每一处覆盖的是另外几处漏掉的场景。' },
        { ul: [
          '仓库端：把你的前缀认领下来、开启命名空间保护，让别人没法注册任何匹配的变体。',
          '解析器端：关掉「允许公开源来满足一个你平时私下拉取的名字」这种行为。',
          'CI 端：清单里新增名字、而发布者与已知发布方不匹配时，让构建直接失败，而不是只打一条警告。',
          '索引端：安装前把索引条目和源码仓库对一遍，具体核对项写在 /blog/how-to-avoid-risky-dsh-plugins 里。',
        ] },
        { h2: '常见问题' },
        { ul: [
          '依赖混淆现在还常见吗？比高峰期少多了，因为大型仓库都提供了命名空间保护，多数包管理器也默认按 scope 安装。它在更小的生态和内部镜像里还活着。',
          '锁定版本能解决吗？只能解决一半。锁版本挡得住意外升级，挡不住第一次装错；真正收口的是锁定来源仓库。',
          '这和维护者账号被攻破有什么不同？后者是人的问题，前者是命名的问题。这种包从第一次发布起就不值得信任。',
          '今天该做什么？先在你使用的公开仓库上认领自己的前缀，然后检查清单里有没有哪个条目是从你没打算用的地方解析来的。',
        ] },
        { p: '这三种变体都从名字字段开始，所以注意力应该先放在那里。相关的命名把戏写在 /blog/tag-baiting-problem，单个插件的危险信号列在 /blog/how-to-avoid-risky-dsh-plugins，团队层面的强制手段与白名单见 /blog/plugin-supply-chain-security-team-enforcement 和 /blog/setting-up-a-plugin-allowlist-for-your-dev-team，CI 里的仓库端扫描见 /blog/ci-cd-plugin-scanning，完整插件索引在 /。' },
      ],
    },
  },
  {
    slug: 'what-a-b-grade-dsh-plugin-tells-you',
    date: '2026-10-05',
    keywords: ['b grade plugin', 'dsh plugin grade', 'plugin grade interpretation', 'plugin quality grade'],
    longTail: ['b grade meaning', 'plugin grade interpretation', 'dsh plugin grade scale', 'what a b grade plugin tells you'],
    en: {
      title: 'What a B-Grade DSH Plugin Tells You (And What It Doesn\'t)',
      excerpt:
        'A B is not a warning and it is not a clean bill of health. Here is what the grade actually measures, the two things it stays silent about, and the four checks that decide whether to install one.',
      metaDescription:
        'The b grade meaning on the dsh plugin grade scale: a b grade plugin passed the security checks and lost points somewhere softer. A practical plugin grade interpretation, and what a b grade plugin tells you before you install.',
      body: [
        { p: "A b grade plugin is the one people pause on, and the pause usually comes from not knowing what the letter covers. Start with the b grade meaning: on the dsh plugin grade scale a B sits directly below A, which means the security checks passed and the points came off somewhere softer, usually documentation or release cadence. That is the whole plugin grade interpretation in one line. What a b grade plugin tells you is therefore narrow: it is not dangerous, and it is not flawless. Below is where the line actually sits, the two B grades that came out of our top-ten scan, and the four things worth checking before you install one." },
        { h2: 'Where B sits on the dsh plugin grade scale' },
        { p: 'The letter grades are a compressed reading of the 0-100 score, and the compression is where the confusion starts. The score page breaks the number into four bands, with 70-89 described as good with minor concerns. The letter version put OpenViking at B (82) and nocobase at B (78) in the top-ten scan, while the A grades in that same table ran from 84 to 92 and the single D came in at 45.' },
        { table: { head: ['Grade', 'Score seen in our scans', 'What it generally means'], rows: [
          ['A', '84-92', 'Passed security, documentation and maintenance both current'],
          ['B', '78-82', 'Passed security, minor gaps in documentation or release cadence'],
          ['C', 'below the B band', 'Review the install script before proceeding'],
          ['D', '45 in the top-ten scan', 'Dangerous install script, do not install without reading the source'],
        ] } },
        { p: 'The gap between A and B is smaller than the letters suggest, and it is not a security gap. Both bands cleared the same checks.' },
        { h2: 'What a B grade does tell you' },
        { p: 'Three things, and they are all worth knowing before you read anything else on the plugin page.' },
        { ul: [
          'The install script came back clean. That is the check that separates B from C and D, and it is the one that matters most.',
          'The points came off a soft pillar: documentation quality or maintenance activity, both of which are recoverable and neither of which is a risk on its own.',
          'The plugin is closer to the top of the ecosystem than to the bottom. In the top-ten scan, seven of ten were A and only one was D.',
        ] },
        { p: 'Read as a security signal, a B is closer to an A than to a C. The letters above and below it are the ones carrying risk information.' },
        { h2: 'What a B grade does not tell you' },
        { p: 'This is where people get it wrong in both directions, and both mistakes are expensive.' },
        { ul: [
          'It says nothing about fit. A well-documented plugin that does half of what you need is still the wrong plugin.',
          'It says nothing about the trend. A B that was an A six months ago is a different situation from a B that has been flat. Score movement is covered in /blog/dsh-plugin-score-trends-what-a-dropping-score-means.',
          'It says nothing about permissions. Requesting broader file or network access than the job requires does not always move the grade as far as it should.',
          'It does not predict the future. A small plugin with one maintainer can be fine for two years and then stop entirely.',
        ] },
        { blockquote: 'A grade is a snapshot of four pillars on one day. It is not a maintenance guarantee, and treating it as one is how teams end up surprised.' },
        { h2: 'The two B grades from the top-ten scan' },
        { p: 'Concrete examples are easier to reason about than a definition. Both B grades in our scan of the ten highest-starred plugins failed the same soft pillar.' },
        { table: { head: ['Plugin', 'Score', 'Why it lost points', 'Install anyway?'], rows: [
          ['OpenViking', 'B (82)', 'Minor documentation gaps', 'Yes, if the README covers what you need'],
          ['nocobase', 'B (78)', 'Slightly stale last-push date', 'Yes, check the release cadence first'],
        ] } },
        { p: 'Neither raised an alarm. Both would benefit from more frequent releases, and that is a different problem from being unsafe.' },
        { h2: 'Before you install a b grade plugin' },
        { p: 'Four checks, in this order. They take about five minutes together and they are the same four you would run on an A grade, just with less margin for error.' },
        { ul: [
          'Read the install script yourself. The scanner cleared it, and you should still know what runs on your machine.',
          'Check the last publish date rather than the last commit. A repo can be busy while the published artifact is a year old.',
          'Compare the score to its own history rather than to the ecosystem. Direction beats position.',
          'Confirm the index name matches the source repo. The naming tricks that sit behind /blog/tag-baiting-problem have nothing to do with grade.',
        ] },
        { p: 'If all four come back clean, install it. If two come back wrong, the grade is not what should stop you.' },
        { h2: 'FAQ' },
        { ul: [
          'Is a B grade safe to install? Usually yes. The security pillar cleared. What a B asks for is a quick look at documentation and release cadence, not a full audit.',
          'Should I wait for the plugin to reach an A? Only if the missing points are in something you depend on. A plugin you use through a narrow, stable API does not need a perfect README.',
          'Why not just install A grades only? Because the A band is small and the B band contains most of the plugins worth using. Filtering to A excludes working software.',
          'Does a B mean the maintainer is unreliable? No. It means the measurable activity signals were slightly weaker. One maintainer shipping on a slow schedule can still be dependable.',
        ] },
        { p: 'The scoring behind all four pillars is explained at /blog/dsh-quality-score-decoded, and the signals that sit outside any grade are listed at /blog/how-to-avoid-risky-dsh-plugins. The full plugin index, with current grades, is at /.' },
      ],
    },
    zh: {
      title: 'B 级 DSH 插件告诉你什么（以及没告诉你什么）',
      excerpt: 'B 级既不是警告，也不是免检证书。这篇讲清楚这个等级到底在量什么、有哪两件事它闭口不提，以及装之前该查的四项。',
      metaDescription: '讲清 B 级在 DSH 插件评级刻度上的位置（b grade meaning）：B 级插件通过了安全检查，分扣在文档或发布节奏这类更软的地方（plugin grade interpretation）。附装之前该查的四项，以及 B 级到底能告诉你什么。',
      body: [
        { p: 'B 级插件是最让人犹豫的那一档，而犹豫多半来自不知道这个字母到底覆盖了什么。先说等级含义：在 DSH 插件评级刻度上，B 紧挨着 A 下面，意味着安全检查过了，分扣在了更软的地方，通常是文档或发布节奏。整个评级解读可以一句话说完：B 级告诉你的其实很窄：它不危险，但也不完美。下面是这条线具体划在哪、我们 Top 10 扫描里出现的两个 B 级，以及装之前值得查的四件事。' },
        { h2: 'B 在 dsh plugin grade scale 上的位置' },
        { p: '字母等级是 0-100 分的压缩读法，而压缩正是困惑的来源。评分页把分数分成四档，70-89 被描述为「良好，有小顾虑」。字母版里，Top 10 扫描给 OpenViking 打了 B（82）、nocobase 打了 B（78），同一张表里 A 级从 84 到 92，唯一的 D 是 45 分。' },
        { table: { head: ['等级', '我们扫描中见到的分数', '大致含义'], rows: [
          ['A', '84-92', '安全检查通过，文档与维护都跟得上'],
          ['B', '78-82', '安全检查通过，文档或发布节奏有小缺口'],
          ['C', '低于 B 档', '装之前先看安装脚本'],
          ['D', 'Top 10 扫描中 45 分', '安装脚本危险，没读源码不要装'],
        ] } },
        { p: 'A 和 B 之间的差距比字母暗示的要小，而且不是安全上的差距。两档过的是同一批检查。' },
        { h2: 'B 级确实告诉你的三件事' },
        { p: '三件事，在看插件页上别的内容之前，这三件都值得先知道。' },
        { ul: [
          '安装脚本查下来是干净的。这正是把 B 和 C、D 分开的那项检查，也是最重要的一项。',
          '分扣在软支柱上：文档质量或维护活跃度，两者都能补回来，单独看都不构成风险。',
          '这个插件离生态顶部比离底部近。Top 10 扫描里十个有七个是 A，D 只有一个。',
        ] },
        { p: '当安全信号读，B 离 A 比离 C 近。真正携带风险信息的是它上面和下面的字母。' },
        { h2: 'B 级没有告诉你的事' },
        { p: '两个方向都会读错，而两种错法代价都不小。' },
        { ul: [
          '它不说明合不合适。一个文档写得很好、却只做了你一半需求的插件，仍然是错的选择。',
          '它不说明趋势。半年前是 A、现在是 B，和一直平稳在 B，是两种情况。分数走势写在 /blog/dsh-plugin-score-trends-what-a-dropping-score-means。',
          '它不说明权限。申请的文件或网络访问范围超出本职工作时，并不总会让等级掉到该掉的位置。',
          '它不预测未来。只有一个维护者的小插件，可以稳稳用两年，然后突然停更。',
        ] },
        { blockquote: '等级是某一天四个支柱的快照，不是维护承诺。把它当承诺，团队迟早会被吓一跳。' },
        { h2: 'Top 10 扫描里的两个 B 级' },
        { p: '具体的例子比定义好懂。我们对星数最高的十个插件做扫描时，两个 B 级失分失在同一个软支柱上。' },
        { table: { head: ['插件', '分数', '为什么扣分', '要不要装'], rows: [
          ['OpenViking', 'B（82）', '文档有小缺口', '装，前提是 README 覆盖了你需要的部分'],
          ['nocobase', 'B（78）', '最后推送时间略旧', '装，但先看发布节奏'],
        ] } },
        { p: '两个都没响警报。两个都该更频繁地发版，而「该多发版」和「不安全」是两个不同的问题。' },
        { h2: '装一个 B 级插件之前' },
        { p: '四项检查，按这个顺序。加起来大约五分钟，和你在 A 级上会跑的四项一样，只是容错空间更小。' },
        { ul: [
          '自己读一遍安装脚本。扫描器说没问题，你仍然该知道什么东西会在你机器上跑起来。',
          '看最后一次发布的时间，而不是最后一次提交。仓库可以很忙，而发布出去的产物已经一年没动。',
          '把分数和它自己的历史比，而不是和整个生态比。方向比位置重要。',
          '确认索引名和源码仓库名对得上。/blog/tag-baiting-problem 里那些命名把戏和等级毫无关系。',
        ] },
        { p: '四项都干净就装。有两项不对，拦住你的也不该是那个等级。' },
        { h2: '常见问题' },
        { ul: [
          'B 级能装吗？通常能。安全这一支柱过了。B 级要求的是快速看一眼文档和发布节奏，不是做一次完整审计。',
          '要不要等它升到 A？只有当扣掉的分正好在你依赖的那部分时才需要。通过稳定窄接口使用的插件，不需要一份完美的 README。',
          '为什么不只装 A 级？因为 A 档很小，而 B 档里装着大多数值得用的插件。只筛 A 会把能用的软件一起排除掉。',
          'B 级是不是说明维护者不靠谱？不是。它说明可测的活跃度信号稍弱。一个人按自己的慢节奏发版，照样可以很可靠。',
        ] },
        { p: '四个支柱怎么算分写在 /blog/dsh-quality-score-decoded，任何等级都覆盖不到的危险信号列在 /blog/how-to-avoid-risky-dsh-plugins。带当前等级的完整插件索引在 /。' },
      ],
    },
  },
  {
    slug: 'dsh-monthly-digest-september-2026',
    date: '2026-10-06',
    keywords: ['dsh plugin digest', 'DSH plugin ecosystem', 'monthly plugin digest', 'plugin ecosystem recap'],
    longTail: ['dsh plugin digest september 2026', 'monthly plugin digest', 'plugin ecosystem recap', 'september plugin security recap'],
    en: {
      title: 'DSH Monthly Digest: September Edition',
      excerpt:
        'The dsh plugin digest for September 2026: eleven entries, grouped into comparisons, team habits, scoring signals and hygiene, plus the one thing nobody should skip before upgrading anything.',
      metaDescription:
        'The dsh plugin digest september 2026 edition: eleven entries from this monthly plugin digest, grouped into one plugin ecosystem recap of comparisons, team habits and scoring signals, plus a short september plugin security recap.',
      body: [
        { p: "This is the dsh plugin digest september 2026 edition, the monthly plugin digest we assemble from what the scanner actually flagged over the month. Eleven entries went up in September, and this plugin ecosystem recap groups them the way a team would read them: comparisons that settle arguments, habits worth copying, scoring signals, and the september plugin security recap half, which is mercifully short because nothing dangerous turned up in the index." },
        { h2: 'September by the numbers' },
        { p: 'Small numbers, but they say something about where the work went. Everything below counts only what landed on the site between 2026-09-02 and 2026-09-21.' },
        { table: { head: ['Metric', 'September 2026'], rows: [
          ['Entries published', '11'],
          ['Comparison posts (DSH vs other ecosystems)', '3'],
          ['Team and pipeline posts', '3'],
          ['Scoring and signal posts', '3'],
          ['Care and hygiene posts', '2'],
          ['New grade changes in the index', 'none flagged'],
        ] } },
        { p: 'The last row is the useful one. A month with no movement on grades means the dangerous findings list stayed empty, which is a better outcome than a busy month.' },
        { h2: 'Three comparisons that settled arguments' },
        { p: 'September spent most of its energy answering questions of the form is this ecosystem safer than that one. All three reached the same conclusion in different words: the install command looks identical, the protection underneath does not.' },
        { ul: [
          '/blog/dsh-vs-vscode-extensions compared permission models and sandboxing. A VS Code extension runs in the editor process with full filesystem access; DSH plugins run isolated with limited access by default, which is why the same sloppy code does less damage here.',
          '/blog/dsh-vs-homebrew-ecosystem-risk looked at both ecosystems installing third-party code with one command, and where review actually happens in each.',
          '/blog/compare-two-dsh-plugins-side-by-side gave teams a five-factor framework with weights, so the deciding conversation stops being a gut call.',
        ] },
        { h2: 'Team and pipeline habits' },
        { p: 'One person reading quickly does not scale. These three posts moved the same check from a personal habit to something the codebase enforces.' },
        { ul: [
          '/blog/setting-up-a-plugin-allowlist-for-your-dev-team turns review into three tiers so experimentation survives alongside default-deny.',
          '/blog/ci-cd-plugin-scanning wires the same checks into every commit, which matters because a plugin can rot after it passes review.',
          '/blog/how-to-update-dsh-plugins-without-breaking-your-setup lays out the pre-update check, snapshot, one-at-a-time update, and rollback.',
        ] },
        { h2: 'Signals, scores, and what they leave out' },
        { p: 'Three posts looked at the parts of a plugin listing that people either over-trust or do not read at all.' },
        { ul: [
          '/blog/dsh-plugin-score-trends-what-a-dropping-score-means argues that the direction of a score matters more than its current value.',
          '/blog/tag-baiting-problem covers plugins that stuff their metadata with keywords they do not deliver, and how scoring reads around it.',
          '/blog/hidden-gem-dsh-plugins makes the case against top-ten lists: the safest plugin for your stack is often one nobody is talking about.',
        ] },
        { blockquote: 'A plugin that scored 84 last quarter and 78 today is telling you something the current letter cannot. Direction is the part people skip.' },
        { h2: 'Care, hygiene, and what to check in October' },
        { p: 'Two posts closed the month on maintenance, and both exist because configs fail quietly rather than loudly.' },
        { ul: [
          '/blog/backup-dsh-plugin-configuration covers surviving a bad update, a wiped machine, and a repo rename.',
          '/blog/how-to-evaluate-plugin-documentation-quality is a checklist for judging whether docs will still support you three months into production.',
        ] },
        { h3: 'Your October list' },
        { ul: [
          'Pick one plugin you installed before September and re-run its score. Anything trending down goes on a watchlist.',
          'Add a plugin check step to CI before adding a second plugin to any project.',
          'Back up one config using the routine above, then test the restore once. An untested backup is a rumour.',
          'Subscribe at /weekly if you want next month to arrive instead of being something you remember in November.',
        ] },
        { p: 'The full index lives at dshquality.com, with every score and its method explained at /blog/dsh-quality-score-decoded. Grade interpretation is at /blog/what-a-b-grade-dsh-plugin-tells-you, the decline signals are at /blog/dsh-plugin-score-trends-what-a-dropping-score-means, and the low end of the index is browsable at /low-quality. Everything published sits at /blog.' },
        { h2: 'FAQ' },
        { ul: [
          'How often does this monthly plugin digest come out? On the first business day after each month closes, pulling whatever the scanner flagged across the previous four weeks.',
          'What counts as a September entry? Anything published between 2026-09-02 and 2026-09-21 was written against September scanning data.',
          'Where do the scores come from? The same four pillars every month, described in full at /blog/dsh-quality-score-decoded so numbers stay comparable across editions.',
          'Nothing dangerous turned up this month. Should we relax? No. An empty findings list is what the checks are for, and it only stays empty while the checks run.',
        ] },
      ],
    },
    zh: {
      title: 'DSH 月度摘要：九月刊',
      excerpt:
        '2026 年 9 月的 DSH 插件摘要：十一篇内容按对比、团队习惯、评分信号和日常维护归拢，外加一件事——升级之前谁都不该跳过它。',
      metaDescription:
        '2026 年 9 月刊 DSH 插件摘要：本期月度摘要收录十一篇，一份插件生态回顾涵盖横向对比、团队习惯与评分信号，另附简短的九月安全回顾。',
      body: [
        { p: "这是 2026 年 9 月刊的 DSH 插件摘要，也就是我们按当月扫描器实际标记出来的东西整理出来的月度摘要。九月一共上了十一篇，这份插件生态回顾按团队读得进去的方式分了组：能终结争论的横向对比、值得抄走的习惯、评分信号，再加一小段九月安全回顾——这一段短得让人庆幸，因为索引里确实没冒出什么危险的东西。" },
        { h2: '九月数字一览' },
        { p: '数字不大，但能看出精力花在哪了。下面只统计 2026-09-02 到 2026-09-21 之间上站的内容。' },
        { table: { head: ['指标', '2026 年 9 月'], rows: [
          ['发布条目', '11'],
          ['生态对比类', '3'],
          ['团队与流水线类', '3'],
          ['评分与信号类', '3'],
          ['维护与素养类', '2'],
          ['索引内的等级变动', '无标记'],
        ] } },
        { p: '最后一行才是最有用的。一个月里等级没有变动，说明危险清单上空无一物，这比热热闹闹过一个月好得多。' },
        { h2: '三篇终结争论的横向对比' },
        { p: '九月的力气大部分花在回答这一类问题：这个生态比那个更安全吗。三篇得出的结论换汤不换药——安装命令长得一模一样，底下的保护机制不是一回事。' },
        { ul: [
          '/blog/dsh-vs-vscode-extensions 比较了权限模型和沙箱机制。VS Code 扩展和编辑器同进程运行，拥有完整文件系统访问权；DSH 插件默认隔离运行、访问受限，所以同样一段粗糙代码在这里造成的伤害更小。',
          '/blog/dsh-vs-homebrew-ecosystem-risk 看了两个生态如何用一条命令装第三方代码，以及各自的审查到底发生在哪一步。',
          '/blog/compare-two-dsh-plugins-side-by-side 给团队一套带权重的五要素对比框架，让拍板不再靠直觉。',
        ] },
        { h2: '团队与流水线的习惯' },
        { p: '一个人快速扫一眼是撑不住规模的。这三篇把同一项检查从个人习惯搬进了代码库能强制执行的地方。' },
        { ul: [
          '/blog/setting-up-a-plugin-allowlist-for-your-dev-team 把审查拆成三档，让试错和默认拒绝共存。',
          '/blog/ci-cd-plugin-scanning 把同样的检查接进每次提交，这一点很重要，因为插件可能通过审查之后才烂掉。',
          '/blog/how-to-update-dsh-plugins-without-breaking-your-setup 讲清楚了升级前的检查、快照、逐个更新和回滚。',
        ] },
        { h2: '评分信号，以及它没说出口的部分' },
        { p: '三篇看的是插件列表里那些要么被过度信任、要么根本没人读的字段。' },
        { ul: [
          '/blog/dsh-plugin-score-trends-what-a-dropping-score-means 认为分数下降的方向比当前值更值得看。',
          '/blog/tag-baiting-problem 讲的是那些往元数据里塞自己并不提供的关键词的插件，以及评分怎么绕开它。',
          '/blog/hidden-gem-dsh-plugins 反对前十榜单：最适合你技术栈的那一个，往往是没人讨论的那个。',
        ] },
        { blockquote: '一个上季度 84 分、现在 78 分的插件，正在说一件当前字母说不出的事。方向才是大家最容易跳过的那部分。' },
        { h2: '维护、素养，以及十月该查什么' },
        { p: '两篇给这个月收尾，讲的都是维护，而它们之所以存在，是因为配置坏起来是悄无声息的。' },
        { ul: [
          '/blog/backup-dsh-plugin-configuration 覆盖三种情况：一次失败的更新、一台被清空的机器、一个改名了的代码仓。',
          '/blog/how-to-evaluate-plugin-documentation-quality 是一份清单，用来判断文档在你跑进生产三个月之后还能不能托底。',
        ] },
        { h3: '你的十月清单' },
        { ul: [
          '挑一个九月之前装的插件，重跑一次评分。凡是趋势向下的，都放进观察名单。',
          '在往任何项目里加第二个插件之前，先把插件检查这一步塞进 CI。',
          '按上面的流程备份一份配置，然后试着恢复一次。没验证过的备份只是一句传闻。',
          '想让下个月自己找上门而不是等到十一月才想起来，去 /weekly 订阅。',
        ] },
        { p: '完整索引在 dshquality.com，每个分数及其算法写在 /blog/dsh-quality-score-decoded。等级怎么读看 /blog/what-a-b-grade-dsh-plugin-tells-you，分数下滑的信号列在 /blog/dsh-plugin-score-trends-what-a-dropping-score-means，评分靠后的部分可以直接从 /low-quality 浏览。所有文章都在 /blog。' },
        { h2: '常见问题' },
        { ul: [
          '这份月度摘要多久出一期？每月结束后的第一个工作日，汇总前四周扫描器标记到的内容。',
          '什么算九月的条目？2026-09-02 到 2026-09-21 之间发布的、基于九月扫描数据写成的都算。',
          '分数依据是什么？每个月都是同样的四个支柱，完整说明在 /blog/dsh-quality-score-decoded，这样各期数字才能横向比较。',
          '这个月没有危险项，可以放松了吗？不行。空的结果清单正是这些检查存在的理由，也只有检查一直跑着它才一直是空的。',
        ] },
      ],
    },
  },
  {
    slug: "plugin-security-culture-champions",
    date: "2026-10-07",
    keywords: ["plugin security culture", "security champion program", "plugin safety culture", "dsh plugin security"],
    longTail: ["security champion program", "plugin safety culture", "security champion responsibilities"],
    en: {
      title: "Security Champions: Building Plugin Safety Culture on a Small Team",
      excerpt:
        "Plugin security culture fails when nobody owns it. A security champion program gives one person per team named responsibility, and here is what that actually costs in time.",
      metaDescription:
        "A security champion program turns plugin safety culture into named ownership. What security champion responsibilities look like on a team with no security team.",
      body: [
        { p: "Most teams treat a plugin decision as a personal one, which is why plugin safety culture never forms. A security champion program fixes that by handing one person per team named ownership instead of a policy nobody opens twice. Below is what security champion responsibilities look like on a team too small to have a security team, how to start the program without adding headcount, and where a champion should stop." },
        { h2: "Why a policy document is not a culture" },
        { p: "Every team that has tried this has written the document first. It rarely changes anything, for three reasons that have nothing to do with the writing." },
        { ul: [
          "The document has no owner once the meeting ends. Nobody is assigned to notice that a plugin was added last Tuesday, so nobody does.",
          "Review happens after install, not before. By the time anyone looks, the plugin has already run its install script and the argument is about removing something people now use.",
          "The score exists but nobody is assigned to read it. A grade sitting in an index is information; a grade someone checks every Monday is a control.",
        ] },
        { p: "A champion closes that gap by being a name rather than a rule. The rule already exists in most teams. What is missing is the person." },
        { h2: "Security champion responsibilities, concretely" },
        { p: "Five things, and none of them require a security background." },
        { ul: [
          "Own the plugin list. One file, in the repo, listing what is installed and who asked for it.",
          "Be the first reviewer on anything new. Not the approver by force, but the person a teammate messages before installing.",
          "Run the weekly score pass. Ten minutes against the index, looking for entries whose grade moved rather than entries that are simply low.",
          "Keep the allowlist honest. Remove entries nobody has used in a quarter, because a stale allowlist is how a denied plugin comes back.",
          "Write the note when something is pulled. One paragraph on what was removed and why, so the next person does not reinstall it.",
        ] },
        { h2: "What a champion does each week" },
        { table: { head: ["Task", "Time", "Output"], rows: [
          ["Review new plugin requests", "15 min", "Approve, deny, or ask for a score first"],
          ["Scan the installed list", "10 min", "Any grade change flagged, direction noted"],
          ["Check the allowlist", "5 min", "Unused entries removed"],
          ["Write one note", "10 min", "What changed and why, in the repo"],
        ] } },
        { p: "Forty minutes a week. Teams that let this grow past an hour usually lose the champion by the second quarter, because the role quietly becomes a second job." },
        { h2: "Starting a champion program with no headcount" },
        { p: "You are not hiring anyone. You are naming someone who already reviews pull requests." },
        { ul: [
          "One per team, not one for the company. A central champion cannot know which plugin a team actually depends on.",
          "Give them the score, not a rulebook. A number they can check is faster to act on than a document they have to interpret.",
          "Cap the time. Say out loud that this is forty minutes a week, and mean it.",
          "Rotate every two quarters. Rotation keeps the knowledge spread and stops the role from hardening into a bottleneck.",
        ] },
        { h2: "Where the champion stops" },
        { p: "Three limits matter, mostly because crossing them turns a useful role into a blamed one." },
        { ul: [
          "They do not approve high-risk installs alone. Two names on anything that touches credentials or network access.",
          "They do not write policy. They report what they see; someone else decides the rule.",
          "They are not the incident owner. If a plugin turns out to be hostile, that is an incident with its own process, not a champion failure.",
        ] },
        { blockquote: "A champion is the person who notices. The program breaks the moment they become the person who decides everything alone." },
        { h2: "Getting the first champion through the first month" },
        { p: "The first month decides whether the role survives. Three things make it stick." },
        { ul: [
          "Start with the list, not with a rule. Writing down what is already installed takes an afternoon and produces something concrete.",
          "Pair the champion with the score. Reading grades is the part that feels like progress, and it is also the part that catches problems early.",
          "Report once, publicly. One short message a month on what changed is enough to make the role visible without making it a performance.",
        ] },
        { p: "The full index lives on dshquality.com, and the four-pillar score behind every entry is explained at /blog/dsh-quality-score-decoded. Pair this with the allowlist guide at /blog/setting-up-a-plugin-allowlist-for-your-dev-team, the pipeline wiring at /blog/ci-cd-plugin-scanning, and the supply-chain write-up at /blog/plugin-supply-chain-security-team-enforcement. All posts are at /blog." },
        { h2: "FAQ" },
        { ul: [
          "How many champions do we need? One per team of five to ten engineers. Below that the team lead can hold it; above that the list gets too long for one person to know.",
          "Does the champion need security training? No. The role is noticing and record-keeping, not analysis. Anything that needs real analysis should be escalated instead of decided locally.",
          "What happens when the champion leaves? Rotate every two quarters and keep the list in the repo, not in a document. Rotation is what stops the departure from becoming an outage.",
          "How is this different from an allowlist? An allowlist is a control that blocks installs. A champion is the person who keeps that control current, which is the part allowlists usually fail at.",
        ] },
      ],
    },
    zh: {
      title: "安全负责人机制：小团队怎么把插件安全文化做起来",
      excerpt:
        "插件安全文化做不起来，通常是因为没有人负责。安全负责人机制给每个团队指定一个人，下面说清这到底要花多少时间。",
      metaDescription:
        "安全负责人机制把插件安全文化变成有人认领的事。没有安全团队的小团队里，安全负责人职责具体长什么样。",
      body: [
        { p: "多数团队把装什么插件当成个人选择，这正是插件安全文化始终建不起来的原因。安全负责人机制的解决办法很直接：给每个团队指定一个人认领这件事，而不是写一份没人会打开第二遍的规范。下面说的是没有安全团队的小团队里，安全负责人职责具体是什么、不增加人手怎么把机制启动起来，以及负责人该在哪里止步。" },
        { h2: "为什么一份规范不等于一种文化" },
        { p: "试过这件事的团队几乎都是先写文档。文档很少带来改变，原因有三条，而且都跟写得怎么样无关。" },
        { ul: [
          "会开完之后，文档就没有主人了。没有人被指定去注意上周二是不是多了一个插件，于是也就没人注意。",
          "审查发生在安装之后，不是之前。等人来看的时候，插件的安装脚本已经跑完了，讨论变成了要不要删掉一个大家已经在用的东西。",
          "分数存在，但没人被指定去看。躺在索引里的等级只是信息；每周一有人去查的等级才是一道控制。",
        ] },
        { p: "负责人补上的正是这个缺口：他是一个人名，而不是一条规则。多数团队里规则已经有了，缺的是那个人。" },
        { h2: "安全负责人职责，具体一点" },
        { p: "五件事，没有一件需要安全背景。" },
        { ul: [
          "认领插件清单。仓库里一个文件，记录装了什么、是谁提出装的。",
          "做新插件的第一位审查人。不是强制审批人，而是同事在安装之前会先问一句的人。",
          "每周跑一遍分数。花十分钟对一遍索引，重点看等级发生变化的条目，而不是只看分数本来就低的那些。",
          "让白名单保持真实。一个季度没人用过的条目就删掉，因为白名单过期正是被否掉的插件悄悄回来的方式。",
          "有东西被撤下时写一条说明。一段话讲清删了什么、为什么，免得下一个人又装回来。",
        ] },
        { h2: "负责人每周做什么" },
        { table: { head: ["事项", "耗时", "产出"], rows: [
          ["审查新的插件申请", "15 分钟", "批准、拒绝，或要求先给出评分"],
          ["扫一遍已装清单", "10 分钟", "标出所有等级变动并记录方向"],
          ["检查白名单", "5 分钟", "清掉不再使用的条目"],
          ["写一条说明", "10 分钟", "在仓库里记录变了什么、为什么"],
        ] } },
        { p: "一周四十分钟。让这件事长过一小时的团队，通常在第二个季度就把负责人弄丢了，因为这个角色会悄悄变成第二份工作。" },
        { h2: "不增加人手，怎么启动这套机制" },
        { p: "你不需要招人，只需要给已经在审 pull request 的那个人一个名字。" },
        { ul: [
          "每个团队一个，不是全公司一个。中央负责人不可能知道某个团队到底依赖哪个插件。",
          "给他分数，不要给他规章。一个可以直接查的数字，比一份需要他先解读的文档更快落地。",
          "把时间封顶。公开说清这就是每周四十分钟，而且说到做到。",
          "每两个季度轮换一次。轮换能把知识摊开，也能避免这个角色固化成一个瓶颈。",
        ] },
        { h2: "负责人该在哪里止步" },
        { p: "三条边界很重要，越过它们会把一个有用的角色变成背锅的角色。" },
        { ul: [
          "高风险安装不由他一个人批。凡是碰到凭据或网络访问的，要有两个名字。",
          "他不写规范。他汇报看到的情况，规则由别人来定。",
          "他不是事故负责人。如果某个插件最后被证实是恶意的，那是一起有自己的流程的事故，不是负责人的失职。",
        ] },
        { blockquote: "负责人是那个注意到的人。一旦他变成独自决定一切的人，这套机制就坏了。" },
        { h2: "让第一位负责人撑过第一个月" },
        { p: "第一个月决定这个角色能不能活下来。三件事能让它扎住。" },
        { ul: [
          "从清单开始，不要从规则开始。把已经装了什么写下来，一个下午就能做完，而且产出是具体的东西。",
          "把负责人和评分绑在一起。读等级是最有进展感的部分，也恰恰是能最早发现问题的部分。",
          "公开汇报一次。一个月一条简短的消息说明变了什么，足以让角色被看见，又不至于变成一场考核。",
        ] },
        { p: "完整索引在 dshquality.com，每个分数背后的四根支柱写在 /blog/dsh-quality-score-decoded。这一篇可以搭配白名单指南 /blog/setting-up-a-plugin-allowlist-for-your-dev-team、流水线接入 /blog/ci-cd-plugin-scanning，以及供应链那篇 /blog/plugin-supply-chain-security-team-enforcement。所有文章都在 /blog。" },
        { h2: "常见问题" },
        { ul: [
          "需要几个负责人？五到十名工程师的团队配一个。人更少时组长就能兼任，人更多时清单会长到一个人认不全。",
          "负责人需要安全培训吗？不需要。这个角色要做的是留意和记录，不是分析。真需要分析的事情应该上报，而不是在本地拍板。",
          "负责人离职了怎么办？每两个季度轮换，并把清单放在仓库里而不是文档里。轮换正是让离职不至于变成一次中断的原因。",
          "这和白名单有什么区别？白名单是一道挡住安装的控制措施；负责人是让这道措施保持最新的人，而这恰恰是白名单最容易坏掉的地方。",
        ] },
      ],
    },
  },
  {
    slug: "how-to-spot-renamed-or-cloned-dsh-plugin",
    date: "2026-10-08",
    keywords: ["cloned plugin detection", "dsh plugin security", "plugin impersonation", "plugin provenance"],
    longTail: ["plugin cloning", "impersonation plugins", "how to detect a cloned plugin", "renamed plugin package"],
    en: {
      title: "How to Spot a Renamed or Cloned DSH Plugin",
      excerpt:
        "A clone borrows trust, not code. How to detect a cloned plugin by checking name, author, publish history and install script before it runs, and what to do when a renamed plugin package is already installed.",
      metaDescription:
        "Cloned plugin detection for DSH: how to detect a cloned plugin by name, author, publish history and install script, and how plugin cloning and impersonation plugins show up as a renamed plugin package.",
      body: [
        { p: "Cloned plugin detection is mostly a paperwork problem. A copy of a popular DSH plugin rarely rewrites the code, because the point of plugin cloning is to borrow trust rather than to write software, so impersonation plugins usually look correct on the page and differ in the metadata. Here is how to detect a cloned plugin before it runs anything: four checks on the name, the author, the publish history and the install script, plus what to do when a renamed plugin package turns up in a list you already trust." },
        { h2: "What a clone copies, and what it leaves behind" },
        { p: "A clone is not a rewrite. It is a re-upload, and the parts that survive a re-upload are exactly the parts worth checking." },
        { ul: [
          "The README and the description. Copied verbatim, typos included, which is the fastest tell you get.",
          "The code. Usually identical, which is why diffing the source is less useful than people expect.",
          "The install script. Sometimes extended, and that is where the real risk sits.",
          "What does not survive: the author, the commit history, the release cadence and the issue tracker. Those four are attached to the repository, not to the files.",
        ] },
        { p: "That asymmetry is the whole method. Compare the parts a clone cannot carry." },
        { h2: "Four checks for cloned plugin detection" },
        { p: "Run them in order. Any single failure is a reason to look harder, and two together is a reason to skip the plugin." },
        { table: { head: ["Check", "Where to look", "Clone signal"], rows: [
          ["Name", "The plugin page and its repo or package name", "A familiar name with a suffix, a changed separator, or a scope you do not recognise"],
          ["Author", "The owner field against the original repository", "An account created recently, or one that publishes nothing else"],
          ["Publish history", "First release date and release count", "A first release dated after the original got popular, and only one version"],
          ["Install script", "The scanned install step on the detail page", "A clone of a plugin whose original has no install script at all"],
        ] } },
        { h2: "Impersonation plugins versus honest forks" },
        { p: "Not every copy is hostile, and treating forks as attacks produces a lot of noise. Four distinctions hold up in practice." },
        { ul: [
          "A fork says so. Its README names the upstream project and links back to it.",
          "A fork changes something. A diff, an extra feature, a pinned dependency. A clone ships identical files.",
          "A fork keeps its own name or an obvious variant. An impersonation plugin takes the name and moves a hyphen.",
          "A fork has a history you can read. A clone has one commit, dated last week.",
        ] },
        { blockquote: "Forks want credit for the change. Clones want the installs the original already earned." },
        { h2: "When a renamed plugin package is already installed" },
        { p: "The awkward case is not deciding whether to install. It is finding out that something you already run is a copy. Four steps, in order." },
        { ul: [
          "Do not uninstall in a panic. Note the version, the install date and where it came from first, because that is what you need if it turns out to be hostile.",
          "Compare the install script against the original. If the clone added one, treat it as an incident rather than as cleanup.",
          "Check what the plugin can reach. Credentials, network access and file writes are the three that matter.",
          "Replace it with the original and watch the score. The index grades both, and the gap between them is usually the clearest summary available.",
        ] },
        { h2: "Keeping clones out of a team list" },
        { p: "Individual caution works once. A list is what makes it repeatable." },
        { ul: [
          "Record the author next to every plugin, not just the name. Clones change the name and keep the word you recognise.",
          "Re-check the list monthly rather than only at install time. A plugin that was legitimate when added can be renamed later.",
          "Watch for grade movement, not just low grades. A copy usually scores worse than the original it imitates.",
          "Route new requests through one person. Most impersonation plugins get in because nobody was assigned to look.",
        ] },
        { p: "The full index is on dshquality.com, and the four-pillar score behind every entry is explained at /blog/dsh-quality-score-decoded. For adjacent reading, /blog/plugin-supply-chain-security-team-enforcement covers how a copy reaches your machine, /blog/how-to-avoid-risky-dsh-plugins covers the evaluation step, and /blog/tag-baiting-problem covers the naming tricks that make a clone look official. All posts are at /blog." },
        { h2: "FAQ" },
        { ul: [
          "Can a clone pass a code review? Yes, because it usually is the same code. The signals sit in the metadata, the author and the publish history, not in the diff.",
          "Is a lower score proof that a plugin is a clone? No. A clone often scores lower because it has no history and no maintenance, but a low score on its own only means look closer.",
          "What if someone cloned a plugin I published? Open an issue on the copy, report it through the registry, and link your original from your own README. Most copies disappear once the original identifies itself clearly.",
          "Do clones matter when there is no install script? Less, but they still matter. A copy with no install script today can add a hostile one in a later version, which is why the publish history check comes before the trust decision.",
        ] },
      ],
    },
    zh: {
      title: "怎么识别被改名或克隆的 DSH 插件",
      excerpt:
        "克隆借走的是信任，不是代码。从名称、作者、发布记录和安装脚本四处核对，在它跑起来之前发现克隆插件；已经装上了该怎么办也写在下面。",
      metaDescription:
        "识别克隆插件：从名称、作者、发布记录、安装脚本四处查出仿冒插件，以及已装的改名插件包该怎么处理。",
      body: [
        { p: "识别克隆插件主要是个核对工作。热门 DSH 插件的副本很少去改代码，因为插件克隆的目的是借走信任，而不是写软件，所以仿冒插件在页面上往往看着都对，差别藏在元数据里。下面说怎么在一个克隆插件跑起来之前发现它：从名称、作者、发布记录和安装脚本四处核对，以及当你已经信任的清单里出现一个改名插件包时该怎么办。" },
        { h2: "克隆会复制什么，又会留下什么" },
        { p: "克隆不是重写，是重新上传。而能跨过重新上传幸存下来的部分，恰好就是值得查的部分。" },
        { ul: [
          "README 和描述。整段照抄，连错别字一起，这是你能拿到的最快线索。",
          "代码。通常一模一样，所以比对源码没有大家以为的那么有用。",
          "安装脚本。有时会加东西，真正的风险就在这里。",
          "带不过来的：作者、提交历史、发布节奏、issue 区。这四样挂在仓库上，不挂在文件上。",
        ] },
        { p: "这个不对称为整套方法提供了依据：去比对克隆搬不走的那几项。" },
        { h2: "识别克隆插件的四处核对" },
        { p: "按顺序做。任何一处对不上，都值得再看仔细；两处同时对不上，就值得跳过这个插件。" },
        { table: { head: ["核对项", "看哪里", "克隆的信号"], rows: [
          ["名称", "插件页以及它的仓库或包名", "熟悉的名字多了一个后缀、换了分隔符，或者出现一个你不认识的 scope"],
          ["作者", "把 owner 字段和原始仓库对照", "账号是最近才建的，或者除了这个插件什么都没发布过"],
          ["发布记录", "首次发布日期和版本数量", "首次发布的时间晚于原版走红，而且只有一个版本"],
          ["安装脚本", "详情页上被扫描过的安装步骤", "原版根本不带安装脚本，这个副本却带"],
        ] } },
        { h2: "仿冒插件和正经 fork 的区别" },
        { p: "不是每个副本都有恶意，把 fork 一律当成攻击会制造大量噪音。下面四条区分在实践中站得住。" },
        { ul: [
          "fork 会说明。它的 README 会写出上游项目并链回去。",
          "fork 会改东西。一个 diff、一个新功能、一个锁定的依赖。克隆发布的是相同的文件。",
          "fork 用自己的名字，或者一眼能看出的变体。仿冒插件直接拿走名字，只挪一个连字符。",
          "fork 的历史你可以读。克隆只有一个提交，日期在上周。",
        ] },
        { blockquote: "fork 想要的是这次改动带来的认可，克隆想要的是原版已经攒下的安装量。" },
        { h2: "改名插件包已经装上了怎么办" },
        { p: "难办的不是决定装不装，而是发现你已经在跑的东西是个副本。四步，按顺序。" },
        { ul: [
          "别慌着卸载。先把版本、安装时间和来源记下来，因为万一它真的有恶意，你要用的正是这些。",
          "把安装脚本和原版对照。如果副本自己加了一段，那就按事故处理，而不是按清理处理。",
          "查这个插件能碰到什么。凭据、网络访问、写文件，这三样才是要紧的。",
          "换回原版，然后盯着分数。索引对两个都评分，两者之间的差距通常是你能拿到的最清楚的一份总结。",
        ] },
        { h2: "让克隆进不了团队的清单" },
        { p: "靠个人谨慎只能管一次，清单才能让这件事重复发生。" },
        { ul: [
          "每条插件都记下作者，不只是名字。克隆改的是名字，留的是你认得的那个词。",
          "每月复查一次清单，不要只在安装那一刻查。装的时候没问题的插件，之后也可能被改名。",
          "盯等级变动，不只是盯低分。副本的分数通常比它模仿的原版更低。",
          "新申请统一个人过。多数仿冒插件能进来，是因为没有人被指定去看。",
        ] },
        { p: "完整索引在 dshquality.com，每个分数背后的四根支柱写在 /blog/dsh-quality-score-decoded。相关阅读：/blog/plugin-supply-chain-security-team-enforcement 讲副本是怎么到你的机器上的，/blog/how-to-avoid-risky-dsh-plugins 讲评估这一步，/blog/tag-baiting-problem 讲那些让克隆看起来很官方的命名手法。所有文章都在 /blog。" },
        { h2: "常见问题" },
        { ul: [
          "克隆能通过代码审查吗？能，因为它通常就是同一份代码。信号在元数据、作者和发布记录里，不在 diff 里。",
          "分数低就能证明是克隆吗？不能。克隆往往因为没有历史、没有维护而分数更低，但光是分数低只意味着该再看一眼。",
          "我发布的插件被别人克隆了怎么办？在副本上开 issue，通过注册源举报，并在自己的 README 里链回原版。原版把自己标清楚之后，多数副本就消失了。",
          "没有安装脚本的克隆也要在意吗？程度轻一些，但仍然要在意。今天不带安装脚本的副本，可以在后面的版本里加一段恶意的，这正是发布记录要排在信任决定之前的原因。",
        ] },
      ],
    },
  },
  {
    slug: 'why-your-plugin-list-is-a-security-asset',
    date: '2026-10-11',
    keywords: ['plugin list security', 'dsh plugin inventory', 'plugin security audit', 'installed plugin list'],
    longTail: ['plugin inventory value', 'why your plugin list is a security asset', 'how to run a plugin list security audit', 'know what plugins you have installed'],
    en: {
      title: 'Why Your Plugin List Is a Security Asset',
      excerpt:
        'Most teams cannot say which plugins are installed where. That gap turns every advisory into a day of archaeology. What a plugin inventory is worth, the three days it pays for itself, and how to build one in an afternoon.',
      metaDescription:
        'The plugin inventory value shows up the day an advisory lands: if you cannot answer which machines run the affected plugin, you cannot scope the incident. Why your plugin list is a security asset, how to run a plugin list security audit, and how to know what plugins you have installed.',
      body: [
        { p: "Most teams cannot answer the question that decides whether a security advisory costs an afternoon or a week: which projects actually run the affected plugin. That gap is where the plugin inventory value lives, and it is also why your plugin list is a security asset rather than housekeeping. Once the record exists, a plugin list security audit stops being paperwork and becomes the tool that scopes an incident in minutes. Below is how to know what plugins you have installed without asking anyone to remember, what that record is worth on the three days you actually need it, and the shortest way to keep it current." },
        { h2: 'What a plugin inventory is worth' },
        { p: 'The list itself carries almost no value on a quiet Tuesday. Its worth shows up under pressure, in four specific situations.' },
        { ul: [
          'Advisory response. A published vulnerability gets scoped by querying the list instead of grepping every repo and hoping.',
          'Duplicate discovery. Two plugins solving the same problem means two things to review and two sets of permissions granted for one job.',
          'Drift detection. The developer running a plugin nobody else has is either ahead of the team or has drifted, and both are worth a conversation.',
          'Offboarding and handovers. A written record survives the person who installed it.',
        ] },
        { p: 'None of this requires new tooling. It requires one file that is updated when something changes.' },
        { table: { head: ['Question you get asked', 'Without an inventory', 'With an inventory'], rows: [
          ['Which projects use the affected plugin?', 'Grep every repo, then guess', 'One query'],
          ['How many machines are exposed?', 'Unknown until someone answers in chat', 'A count, immediately'],
          ['Did we ever install it?', 'Nobody remembers', 'In the record, with dates'],
          ['What else came from the same author?', 'Another round of searching', 'Grouped and listed'],
        ] } },
        { h2: 'The three days the list pays for itself' },
        { p: 'Every team that keeps one hits these eventually, usually within a year.' },
        { ul: [
          'The advisory day. Something you installed is named publicly. With a list, answering is a query. Without one, it is a day of searching followed by an answer nobody fully trusts.',
          'The audit day. Someone asks for evidence of what runs in the build. The list is the evidence, and building it retroactively always takes longer than expected.',
          'The incident day. Something behaves oddly, and narrowing the suspects starts with knowing what is installed. The permission patterns behind bad installs are covered at /blog/how-install-script-scanning-works.',
        ] },
        { blockquote: 'An inventory is not found security work. It is the part you do once so the other three days are not spent looking for the list.' },
        { h2: 'Building one in an afternoon' },
        { p: 'This is a spreadsheet job. Do not wait for a platform decision.' },
        { ul: [
          'Export the installed plugin list from one machine and put it in a shared file with today\'s date.',
          'Add three columns per entry: version or commit, source (registry, repo, or local path), and date added.',
          'Repeat on each developer machine and each CI image. The CI column is the one people forget, and it often has the most restrictive permissions.',
          'Mark every entry that touches network access, credentials, or files outside the project directory.',
          'Put one person in charge of rerunning the export monthly. Rotation is where most inventories quietly die.',
        ] },
        { p: 'The scores attached to each entry do not need to be in the file. Link the plugin pages instead, because grades move and the file should not have to. The four inputs behind every grade are explained at /blog/dsh-quality-score-decoded.' },
        { h2: 'Keeping it current without adding process' },
        { p: 'Inventories fail for the same reason most checklists fail: they ask people to remember. Attach the update to something that already happens.' },
        { ul: [
          'Regenerate the export when a machine is set up or wiped, not on a calendar nobody follows.',
          'Make adding a plugin require a line in the file, the same way adding a dependency requires a pull request. The allowlist write-up at /blog/setting-up-a-plugin-allowlist-for-your-dev-team covers this gate from the team side.',
          'Diff on update rather than trusted including by hand, so changes surface automatically.',
          'Keep the historical versions. A plugin that was fine two versions ago is relevant context when a new release is flagged.',
        ] },
        { h2: 'FAQ' },
        { ul: [
          'Is a plugin inventory worth it for a solo developer? Yes, and the reason changes rather than disappears. For one person the value is mainly reinstall speed after a machine wipe, plus a record of what you grant permissions to.',
          'How often should it be refreshed? Whenever the set changes. A monthly regeneration catches drift; anything longer usually means the record has already gone stale.',
          'Do scores belong in the inventory? Reference them rather than copying them. Grades move with maintenance and publishing activity, and a frozen number in a spreadsheet becomes wrong quietly.',
          'What if we already have a dependency manifest? Keep both. A manifest covers packages your code imports; plugins run as tooling inside your editor or harness and usually are not in it.',
          'Does this replace scanning? No. The inventory tells you what to check; scanning tells you what it does. Independent scoring rather than self-reported claims is the subject of /blog/why-independent-plugin-scoring-beats-self-reported-ratings.',
        ] },
        { p: 'Start with one machine today and add the rest this week. Every plugin in your list has a score page on dshquality.com, and the scoring behind those pages is independent rather than self-reported. The review habit that keeps the list honest is described at /blog/dsh-plugin-review-process, and everything we publish is at /blog.' },
      ],
    },
    zh: {
      title: '你的插件清单为什么是一项安全资产',
      excerpt:
        '多数团队说不清自己装了哪些插件、装在什么地方。这个缺口会把每一条安全公告变成一整天的考古。这份清单到底值多少、它在哪三天真正派上用场、以及一个下午怎么把它搭起来。',
      metaDescription:
        '插件清单的价值会在安全公告落地的那一天显现：如果答不上来受影响的插件跑在哪些机器上，你就没法界定事件范围。本文讲为什么你的插件清单是一项安全资产、如何做一次插件清单安全审计，以及怎样在需要答案之前就知道自己装了什么。',
      body: [
        { p: "多数团队答不上来一个决定性问题：受影响的插件到底跑在哪些项目里。而正是这个问题，决定一条安全公告的代价是一个下午还是一周。插件清单的价值就藏在这个缺口里，这也是为什么你的插件清单是一项安全资产，而不是一份杂物台账。一旦记录存在，插件清单安全审计就不再是为了留痕的文书工作，而变成了几分钟就能界定事件范围的工具。下面讲的是如何在不靠谁回忆的前提下知道自己装了哪些插件、这份记录在你真正用得上的三天里值多少，以及保持它不过期的最短路径。" },
        { h2: '插件清单到底值多少' },
        { p: '风平浪静的工作日里，这份清单几乎没什么价值。它的价值在压力下显现，具体是下面四种情况。' },
        { ul: [
          '响应安全公告。某个插件被公开点名时，范围靠查清单界定，而不是全仓库 grep 之后再猜。',
          '发现重复项。两个插件解决同一个问题，意味着要多评审一份、多授予一份权限，而活只干一份。',
          '发现偏移。某位开发者装着别人都没有的插件，要么是他走在团队前面，要么是配置已经漂移了，两种情况都值得聊一聊。',
          '交接与离职。写下来的记录能活过当初装它的人。',
        ] },
        { p: '这些都不需要新工具。只需要一个文件，在有变动的时候更新它。' },
        { table: { head: ['你被问到的问题', '没有清单', '有清单'], rows: [
          ['哪些项目用了受影响的插件？', '全仓库 grep，然后靠猜', '一次查询'],
          ['有多少台机器暴露？', '要等有人在群里回话说不清', '立刻给出数量'],
          ['我们当初装过它吗？', '没人记得', '记录里有，还带日期'],
          ['同一作者还装了别的吗？', '再搜一轮', '按作者归类好了'],
        ] } },
        { h2: '清单真正派上用场的三天' },
        { p: '每个坚持做清单的团队迟早都会撞上这三天，一般一年内都会遇到。' },
        { ul: [
          '公告那天。你装的东西被公开点名。有清单，回答是一次查询；没有清单，是一整天的搜索，最后还得出一个没人完全信服的答案。',
          '审计那天。有人要你拿出构建环境里跑了什么的证据。清单本身就是证据，而事后补做清单，永远比预想的花时间长。',
          '事故那天。某个东西行为异常，缩小嫌疑范围的第一步就是知道装了什么。问题安装脚本背后的权限套路写在 /blog/how-install-script-scanning-works。',
        ] },
        { blockquote: '清单不是白捡的安全工作。它是你一次性做掉的部分，好让另外三天不用花在找清单这件事上。' },
        { h2: '一个下午把它搭起来' },
        { p: '这是个表格就能干的活。别等什么平台选型。' },
        { ul: [
          '从一台机器上导出已装插件列表，放进共享文件，写上当天日期。',
          '每条加三列：版本或 commit、来源（注册表、仓库还是本地路径）、加入日期。',
          '在每台开发机和每个 CI 镜像上重复一遍。CI 那一列最容易被忘，而它的权限往往是给得最宽的。',
          '把涉及网络访问、凭据、以及项目目录之外文件的条目标出来。',
          '指定一个人每月重跑一次导出。没有轮流负责的人，是多数清单悄悄失效的原因。',
        ] },
        { p: '每条的评分不必写进文件，链接插件页面就行，因为分数会动，而文件不该跟着动。每个分数背后的四个输入写在 /blog/dsh-quality-score-decoded。' },
        { h2: '不增加流程也能保持更新' },
        { p: '清单失败的原因和多数检查表一样：它指望人去记。把更新挂在已经会发生的事情上。' },
        { ul: [
          '在装机或清机的那天重新导出，而不是挂在一个没人看的日历上。',
          '新增插件必须同时在文件里加一行，就像加依赖要提 PR 一样。这道闸门在团队层面怎么落地，写在 /blog/setting-up-a-plugin-allowlist-for-your-dev-team。',
          '更新时用 diff 比对，而不是靠手填，变更自己就会冒出来。',
          '保留历史版本。某个插件两个版本前还很干净，这在它的新版本被标记时是有用的上下文。',
        ] },
        { h2: '常见问题' },
        { ul: [
          '个人开发者也值得做吗？值得，只是价值会变而不是消失。对一个人来说，价值主要是清机后的重装速度，外加一份你到底授予了哪些权限的记录。',
          '多久刷新一次？只要装的东西变了就刷新。每月重跑一次能抓到漂移；间隔再长，记录基本已经过期了。',
          '分数要写进清单吗？引用，不要抄。分数会随维护和发布活跃度变动，抄在表格里的数字会不知不觉变成错的。',
          '我们已有依赖清单了怎么办？两个都留着。依赖清单管的是代码 import 的包；插件是跑在编辑器或 harness 里的工具，通常不在里面。',
          '这能替代扫描吗？不能。清单告诉你该查什么，扫描告诉它做了什么。为什么评级要独立于开发者自报的数据，写在 /blog/why-independent-plugin-scoring-beats-self-reported-ratings。',
        ] },
        { p: '今天先做一台机器，这周把剩下的补齐。你清单里的每个插件在 dshquality.com 都有对应的评分页，那些页面的评分是独立给出的，不是开发者自报的。让清单保持诚实的评审习惯写在 /blog/dsh-plugin-review-process，我们发布的全部文章在 /blog。' },
      ],
    },
  },
];

/** 按日期倒序（新在前） */
export function getBlogPosts(): BlogPost[] {
  return [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1));
}
export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
