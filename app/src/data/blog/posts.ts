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
    longTail: [
      'how to check dsh plugin security before install',
      'dsh quality score meaning',
      'risky dsh plugins to avoid',
      'dsh.bundle declaration missing',
    ],
    en: {
      title: 'DSH Plugin Security Scanner: How to Spot Risky Plugins Before You Install Them',
      excerpt:
        'A dsh plugin security scanner is the difference between a clean workspace and a compromised build. Learn how the DSH Quality score flags risky plugins before they enter your project.',
      metaDescription:
        'How to check dsh plugin security before install: understand the DSH Quality score, spot missing dsh.bundle declarations, dangerous install scripts and stale repos before they compromise your build.',
      body: [
        {
          p: "A dsh plugin security scanner isn't just a tool — it's the difference between a clean workspace and a compromised build. When you install plugins into your DeepSeek Harness environment, you're giving third-party code access to your system. The question isn't whether you should check before installing; it's whether you know what to look for.",
        },
        {
          h2: 'Understanding the DSH Quality Score',
        },
        {
          p: 'The DSH Quality Score evaluates plugins across four dimensions: maintenance health, documentation quality, npm ecosystem integration, and security posture. Every plugin receives a letter grade from A to D plus a 0-100 numerical score.',
        },
        {
          table: {
            head: ['Grade', 'Score Range', 'What It Means'],
            rows: [
              ['A', '90-100', 'Excellent maintenance, clear docs, secure'],
              ['B', '75-89', 'Good health, minor documentation gaps'],
              ['C', '60-74', 'Acceptable but needs attention'],
              ['D', '0-59', 'High risk, avoid unless necessary'],
            ],
          },
        },
        {
          p: 'The current distribution shows 4 A-grade, 4 B-grade, 6 C-grade, and 7 D-grade plugins. That 35% risk rate (C+D) is exactly why a pre-install dsh plugin security audit matters.',
        },
        {
          h2: 'Three Red Flags You Cannot Ignore',
        },
        {
          h3: '1. Missing dsh.bundle declaration',
        },
        {
          p: 'This is the most common issue. Over half of the D-grade plugins lack the dsh.bundle declaration, which means the bundle structure was never properly defined or audited. Without it you have no guarantee the package is self-contained or that dependencies are scoped correctly.',
        },
        {
          h3: '2. Dangerous install scripts',
        },
        {
          p: 'Some plugins ship post-install scripts that execute arbitrary commands. This is the highest-risk warning. If a plugin flags "dangerous install script", never use it in a production environment.',
        },
        {
          h3: '3. Stale last-push dates',
        },
        {
          p: 'A plugin that has not been pushed in 30+ days may carry unpatched vulnerabilities. Security updates do not happen by themselves — they require active maintenance. Check last-push before trusting any plugin.',
        },
        {
          h2: 'How to Use the Scanner Effectively',
        },
        {
          ul: [
            'Check the grade before you click install — A and B passed the full audit; C needs extra scrutiny; D should be avoided unless there is no alternative.',
            'Read the security warnings column — it tells you exactly what is wrong with each plugin.',
            'Cross-reference with star count — a 2,000-star A-grade plugin like dsh-core is more trustworthy than a 5-star D-grade one.',
            'Check maintenance frequency — recent pushes show active development; months of silence is a red flag.',
          ],
        },
        {
          h2: 'What the Data Shows',
        },
        {
          p: 'Top performers (dsh-core, dsh-vision-router, dsh-context-bridge, dsh-memory-store) all score 84+ with recent activity. The middle tier offers solid B-grade alternatives for common needs. Problem cases (dsh-miner, dsh-telemetry, dsh-payload) all carry dangerous install script warnings.',
        },
        {
          p: 'The lesson is clear: run a dsh plugin security check before every installation. It takes seconds and could save you from a security incident.',
        },
      ],
    },
    zh: {
      title: 'DSH 插件安全扫描器：安装前如何识别风险插件',
      excerpt:
        'dsh 插件安全扫描器是清洁工作区与被入侵构建之间的区别。了解 DSH Quality 评分如何在你安装前标记风险插件。',
      metaDescription:
        '安装前如何检查 dsh 插件安全：理解 DSH Quality 评分，识别缺失的 dsh.bundle 声明、危险安装脚本与过时仓库，避免构建被入侵。',
      body: [
        {
          p: 'dsh 插件安全扫描器不仅是一个工具——它是清洁工作区与被入侵构建之间的区别。当你为 DeepSeek Harness 环境安装插件时，你实际上是在允许第三方代码访问你的系统。问题不是你该不该检查，而是你知道该看什么。',
        },
        { h2: '理解 DSH Quality Score' },
        {
          p: 'DSH Quality Score 从四个维度评估插件：维护健康度、文档质量、npm 生态系统集成、安全态势。每个插件获得 A 到 D 的字母等级和 0-100 的数值分数。',
        },
        {
          table: {
            head: ['等级', '分数范围', '含义'],
            rows: [
              ['A', '90-100', '维护优秀，文档清晰，安全'],
              ['B', '75-89', '健康状况良好，文档有小缺口'],
              ['C', '60-74', '可用但需要关注'],
              ['D', '0-59', '高风险，非必要避免使用'],
            ],
          },
        },
        {
          p: '当前分布显示 4 个 A 级、4 个 B 级、6 个 C 级和 7 个 D 级插件。35% 的风险率（C+D）正是安装前做 dsh 插件安全审计重要的原因。',
        },
        { h2: '三个不能忽视的红牌警告' },
        { h3: '1. 缺少 dsh.bundle 声明' },
        {
          p: '这是最常见的问题。超过一半的 D 级插件缺少 dsh.bundle 声明，意味着包结构从未被正确定义或审计。没有它，你无法保证包自包含或依赖项被正确作用域化。',
        },
        { h3: '2. 危险安装脚本' },
        {
          p: '某些插件携带执行任意命令的 post-install 脚本。这是最高风险警告。如果插件标记了"危险安装脚本"，绝不应在生产环境使用。',
        },
        { h3: '3. 过期的最后推送日期' },
        {
          p: '超过 30 天未推送的插件可能包含未修补的漏洞。安全更新不会自动发生——它们需要主动维护。信任任何插件前先检查最后推送时间。',
        },
        { h2: '如何有效使用扫描器' },
        {
          ul: [
            '安装前先检查等级——A/B 已通过完整审计；C 需要额外审查；D 除非没有替代否则应避免。',
            '阅读安全警告列——它准确告诉你每个插件的问题。',
            '交叉参考星数——2000 星的 A 级插件（如 dsh-core）比 5 星的 D 级插件更值得信赖。',
            '检查维护频率——近期推送显示活跃开发；数月沉默是红旗。',
          ],
        },
        { h2: '数据说明了什么' },
        {
          p: '顶级表现者（dsh-core、dsh-vision-router、dsh-context-bridge、dsh-memory-store）评分均 84+ 且有近期活动。中层提供可靠的 B 级替代方案。问题案例（dsh-miner、dsh-telemetry、dsh-payload）都携带危险安装脚本警告。',
        },
        { p: '教训很明确：每次安装前运行 dsh 插件安全检查。只需几秒，却能避免安全事件。' },
      ],
    },
  },
  {
    slug: 'dsh-plugin-ecosystem-explosion-analysis',
    date: '2026-08-18',
    keywords: ['dsh plugin ecosystem', 'dsh plugin growth', 'tag farming'],
    longTail: [
      'why dsh plugin count exploded',
      'dsh plugin tag baiting problem',
      'how many dsh plugins exist',
    ],
    en: {
      title: 'The DSH Plugin Explosion: 4,300 Plugins in Days, and What It Means for You',
      excerpt:
        'The DeepSeek Harness ecosystem grew past 4,300 plugins within days. We break down the numbers, the tag-baiting problem, and what it means for installers.',
      metaDescription:
        'Why the dsh plugin count exploded past 4,300 in days: growth math, tag farming and tag baiting in the dsh plugin ecosystem, and practical advice for installers.',
      body: [
        {
          p: "If you've watched the dsh plugin ecosystem over the past few weeks you already know how fast it moved. What started as a handful of curated plugins became thousands in a matter of days — and not all of that growth is healthy. Here is the breakdown of why the dsh plugin count exploded, and what it means when you search for a plugin to install.",
        },
        { h2: 'How 4,300 Plugins Appeared So Fast' },
        {
          p: 'The DeepSeek Harness runtime made "everything is a plugin" the default mental model, and the community responded. Plugin authors published tools, integrations, themes and utilities at a pace we have not seen in other ecosystems. Growth that took years elsewhere happened in days here.',
        },
        {
          ul: [
            'Low publishing friction: a dsh.bundle + package.json is enough to publish.',
            'A viral topic on GitHub: topic:dsh-plugin became one of the fastest-growing tags.',
            'AI-assisted generation: many plugins are scaffolded with the official SDK and shipped quickly.',
          ],
        },
        { h2: 'The Tag-Baiting Problem' },
        {
          p: 'Rapid growth attracts noise. Some repositories add the dsh-plugin topic without shipping a real plugin — no dsh.bundle declaration, no runtime entry point, nothing that actually loads in the harness. That is tag farming: using a trending topic to pull in stars, watchers, and install traffic.',
        },
        {
          p: 'Our scanner treats a missing dsh.bundle declaration as a security signal, and it is the single most common flag among low-grade plugins. If you are evaluating a plugin, the topic tag alone is not a quality signal — it is closer to the opposite.',
        },
        { h2: 'What This Means for Installers' },
        {
          ul: [
            'Do not install by name alone: check the DSH Quality grade and the security warnings column.',
            'Prefer plugins with a dsh.bundle declaration and a recent last-push date.',
            'Be suspicious of overnight star counts — they often correlate with tag farming, not community vetting.',
          ],
        },
        {
          p: 'The ecosystem is young and genuinely exciting. The same energy that produced 4,300 plugins also produced the noise — and a pre-install quality check is the cheapest way to tell them apart.',
        },
      ],
    },
    zh: {
      title: 'DSH 插件大爆发：数天内 4300+ 插件，对你意味着什么',
      excerpt:
        'DeepSeek Harness 生态在几天内超过 4300 个插件。我们拆解数字、蹭标签问题，以及它对安装者的意义。',
      metaDescription:
        'dsh 插件数量为何在数天内爆发到 4300+：增长算术、dsh 插件生态中的蹭标签问题，以及给安装者的实用建议。',
      body: [
        {
          p: '如果你过去几周关注过 dsh 插件生态，你已经知道它发展得多快。从少数几个精选插件开始，数天内变成了数千个——而且并非所有增长都是健康的。下面是 dsh 插件数量为何爆发，以及当你搜索要安装的插件时这意味着什么。',
        },
        { h2: '4300 个插件为何出现得这么快' },
        {
          p: 'DeepSeek Harness 运行时把"一切皆插件"变成默认心智模型，社区积极响应。插件作者以其他生态中从未见过的速度发布工具、集成、主题与工具类插件。其他地方需要数年的增长在这里数天就完成了。',
        },
        {
          ul: [
            '发布摩擦低：一个 dsh.bundle + package.json 就足以发布。',
            'GitHub 上的热门话题：topic:dsh-plugin 成为增长最快的话题之一。',
            'AI 辅助生成：许多插件用官方 SDK 快速脚手架并迅速发布。',
          ],
        },
        { h2: '蹭标签问题' },
        {
          p: '快速增长吸引噪音。一些仓库添加 dsh-plugin 话题却没有发布真正的插件——没有 dsh.bundle 声明、没有运行时入口、没有任何能在 harness 中加载的东西。这就是蹭标签：利用热门话题获取星标、关注与安装流量。',
        },
        {
          p: '我们的扫描器把缺失 dsh.bundle 声明当作安全信号，这是低分插件中最常见的标记。如果你在评估插件，话题标签本身不是质量信号——它更接近反义。',
        },
        { h2: '对安装者意味着什么' },
        {
          ul: [
            '不要只看名字安装：检查 DSH Quality 等级与安全警告列。',
            '优先选择有 dsh.bundle 声明与近期推送日期的插件。',
            '警惕一夜暴涨的星数——它通常与蹭标签相关，而非社区审核。',
          ],
        },
        {
          p: '生态年轻且真正令人兴奋。产生 4300 个插件的能量也产生了噪音——安装前的质量检查是区分它们最便宜的方式。',
        },
      ],
    },
  },
  {
    slug: 'how-install-script-scanning-works',
    date: '2026-08-18',
    keywords: ['install script scanning', 'dangerous install scripts', 'dsh plugin scanner'],
    longTail: [
      'how dsh install script scanning works',
      'dangerous npm install scripts detection',
      'what install script scanner checks',
    ],
    en: {
      title: 'How Install Script Scanning Works Inside the DSH Quality Scanner',
      excerpt:
        'A look inside our dangerous-pattern scanner: what it checks, what it misses, and how to read the results responsibly.',
      metaDescription:
        'How dsh install script scanning works: dangerous npm install scripts detection, what the scanner checks and misses, and how to interpret security results.',
      body: [
        {
          p: "Install script scanning is the part of DSH Quality people ask about most. When a plugin runs an install script it gets arbitrary code execution on your machine during npm install — which is exactly what a malicious package wants. Here is how our dsh install script scanning works under the hood.",
        },
        { h2: 'What the Scanner Checks' },
        {
          p: 'We inspect the package manifest and scripts that run during install, looking for patterns that should never appear in a well-behaved plugin:',
        },
        {
          ul: [
            'curl / wget piped to sh or bash — the classic remote-code-execution pattern.',
            'Base64-encoded commands or obfuscated strings in postinstall.',
            'Network exfiltration calls (POST to unknown endpoints, reading env files).',
            'File-system sweepers that touch home directories or ssh keys.',
            'Package manager reinstall loops or self-modifying scripts.',
          ],
        },
        { h2: 'What It Misses' },
        {
          p: 'Heuristics are not a proof of safety. A determined attacker can obfuscate past string matching, fetch a payload at runtime, or hide behavior inside a dependency. That is why the scanner flags "dangerous install script" as a hard veto on the grade — but absence of a flag is not a clean bill of health.',
        },
        { h2: 'How to Read the Results' },
        {
          ul: [
            'Dangerous install script flag: do not install. Even for evaluation, run it in an isolated environment.',
            'Missing dsh.bundle: verify the plugin loads before trusting it; it is a warning, not a guarantee of malice.',
            'No flags: still review the plugin repo if you plan to run it with privileged access.',
          ],
        },
        {
          p: 'The goal of the scanner is to make risky dsh plugins visible in seconds. Treat it as your first filter — not your last.',
        },
      ],
    },
    zh: {
      title: 'DSH Quality 扫描器内部的安装脚本扫描是如何工作的',
      excerpt:
        '走进我们的危险模式扫描器：它检查什么、会漏掉什么，以及如何负责任地解读结果。',
      metaDescription:
        'dsh 安装脚本扫描如何工作：危险 npm 安装脚本检测、扫描器检查什么与漏掉什么，以及如何解读安全结果。',
      body: [
        {
          p: '安装脚本扫描是 DSH Quality 中被问得最多的部分。插件运行安装脚本时，它在 npm install 期间于你的机器上获得任意代码执行能力——这正是恶意包想要的。下面是我们的 dsh 安装脚本扫描在底层如何工作。',
        },
        { h2: '扫描器检查什么' },
        {
          p: '我们检查包清单与安装期间运行的脚本，寻找良善插件中绝不应出现的模式：',
        },
        {
          ul: [
            'curl / wget 管道到 sh 或 bash——经典的远程代码执行模式。',
            'postinstall 中的 Base64 编码命令或混淆字符串。',
            '网络外传调用（POST 到未知端点、读取 env 文件）。',
            '触及主目录或 ssh 密钥的文件系统清扫器。',
            '包管理器重装循环或自修改脚本。',
          ],
        },
        { h2: '它会漏掉什么' },
        {
          p: '启发式不是安全证明。坚定的攻击者可以混淆字符串匹配、在运行时获取 payload、或把行为藏在依赖中。这就是为什么扫描器把"危险安装脚本"标记为等级硬否决——但标记缺失不等于完全干净。',
        },
        { h2: '如何解读结果' },
        {
          ul: [
            '危险安装脚本标记：不要安装。即使评估也要在隔离环境运行。',
            '缺失 dsh.bundle：先验证插件能加载再信任；它是警告，不是恶意的保证。',
            '无标记：如果你打算以特权访问运行它，仍要审查插件仓库。',
          ],
        },
        {
          p: '扫描器的目标是在几秒内让风险 dsh 插件可见。把它当作你的第一道过滤器——不是最后一道。',
        },
      ],
    },
  },
  {
    slug: 'deepseek-harness-everything-is-a-plugin',
    date: '2026-08-19',
    keywords: ['deepseek-harness', 'dsh runtime', 'Cordis core'],
    longTail: [
      'deepseek harness plugin architecture explained',
      'dsh runtime cordis core python sdk',
      'how deepseek harness plugins work',
    ],
    en: {
      title: 'DeepSeek Harness 101: Everything Is a Plugin',
      excerpt:
        'The deepseek-ai/deepseek-harness repository launched on June 10, 2026 with a bold premise: everything is a plugin. Here is how the dsh runtime, Cordis core, and the Python SDK fit together.',
      metaDescription:
        'DeepSeek Harness plugin architecture explained: how the dsh runtime, Cordis core and Python SDK fit together, and what the everything-is-a-plugin premise means for developers.',
      body: [
        {
          p: 'The deepseek-ai/deepseek-harness repository went public on June 10, 2026 with a premise that took a while to sink in: everything is a plugin. The runtime, the CLI, the web UI, even the agent skills — all of it loads through the same plugin interface. If you have been trying to understand the deepseek harness plugin architecture, this is the mental model to start with.',
        },
        { h2: 'The dsh Runtime at the Center' },
        {
          p: 'The dsh runtime is the process that loads and executes plugins. It defines the lifecycle — discover, load, validate, run — and it is what enforces the dsh.bundle contract. Plugins declare their entry points in the bundle; the runtime resolves dependencies and sandboxes execution where the platform allows.',
        },
        { h2: 'Cordis Core as the Kernel' },
        {
          p: 'Underneath the runtime sits Cordis core, the dependency-injection kernel inherited from the Cordis framework. It wires services, manages contexts, and gives plugins a predictable environment to talk to each other. Understanding Cordis matters because plugin configuration, context isolation, and service overrides all flow through it.',
        },
        { h2: 'The Python SDK for Plugin Authors' },
        {
          p: 'Most plugins are written against the official Python SDK, which wraps the runtime contract in familiar Python: a class, a few decorators, a bundle manifest. The SDK hides most of the machinery — but knowing it is there helps when a plugin misbehaves, because the error almost always traces back to a contract violation the SDK tried to smooth over.',
        },
        { h2: 'Why the Architecture Matters for Installers' },
        {
          ul: [
            'Everything being a plugin means every piece of code you install gets the same runtime privileges — and the same risk profile.',
            'The dsh.bundle declaration is the one contract the runtime checks; its absence is a legitimate warning.',
            'Cordis-based isolation is only as strong as the sandbox beneath it (see our Landlock deep dive).',
          ],
        },
        {
          p: 'Once you see the architecture as one plugin interface with a kernel underneath, the ecosystem stops looking chaotic. It also becomes clear why quality scoring and security scanning of individual plugins matter so much.',
        },
      ],
    },
    zh: {
      title: 'DeepSeek Harness 入门：一切皆插件',
      excerpt:
        'deepseek-ai/deepseek-harness 仓库于 2026 年 6 月 10 日上线，带着一个大胆的前提：一切皆插件。本文拆解 dsh 运行时、Cordis 内核与 Python SDK 如何组合在一起。',
      metaDescription:
        'DeepSeek Harness 插件架构详解：dsh 运行时、Cordis 内核与 Python SDK 如何组合，以及"一切皆插件"前提对开发者的意义。',
      body: [
        {
          p: 'deepseek-ai/deepseek-harness 仓库于 2026 年 6 月 10 日公开上线，带着一个需要时间消化的前提：一切皆插件。运行时、CLI、Web UI，甚至 agent skills——全部通过同一个插件接口加载。如果你一直在试图理解 deepseek harness 插件架构，这就是该从哪个心智模型开始。',
        },
        { h2: '中心的 dsh 运行时' },
        {
          p: 'dsh 运行时是加载并执行插件的进程。它定义生命周期——发现、加载、验证、运行——并执行 dsh.bundle 契约。插件在 bundle 中声明入口点；运行时解析依赖并在平台允许处做沙箱化执行。',
        },
        { h2: 'Cordis Core 作为内核' },
        {
          p: '运行时下面是 Cordis core，继承自 Cordis 框架的依赖注入内核。它装配服务、管理上下文，给插件一个可预测的彼此通信环境。理解 Cordis 很重要，因为插件配置、上下文隔离与服务覆写都流经它。',
        },
        { h2: '面向插件作者的 Python SDK' },
        {
          p: '大多数插件基于官方 Python SDK 编写，它把运行时契约包装成熟悉的 Python：一个类、几个装饰器、一个 bundle manifest。SDK 隐藏了大部分机制——但知道它存在有助排查，因为插件出问题时，错误几乎总能追溯到 SDK 试图平滑处理的契约违规。',
        },
        { h2: '架构对安装者为何重要' },
        {
          ul: [
            '一切皆插件意味着你安装的每一段代码获得相同的运行时权限——以及相同的风险画像。',
            'dsh.bundle 声明是运行时检查的唯一契约；缺失是合理警告。',
            'Cordis 隔离的强度只取决于底层沙箱（参见我们的 Landlock 深度解读）。',
          ],
        },
        {
          p: '一旦把架构看作一个底层有内核的插件接口，生态就不再混乱。同时也很清楚为什么对单个插件的质量评分与安全扫描如此重要。',
        },
      ],
    },
  },
  {
    slug: 'dsh-cli-journey-rc7-road-to-1.0',
    date: '2026-08-20',
    keywords: ['dsh CLI', 'deepseek-harness CLI', 'v0.1.0-rc.7'],
    longTail: [
      'dsh cli v0.1.0-rc.7 changes',
      'deepseek harness cli web ui onboarding',
      'dsh cli plugin install command',
    ],
    en: {
      title: 'The dsh CLI Journey: v0.1.0-rc.7 and the Road to 1.0',
      excerpt:
        'Twelve thousand commits later, the dsh CLI sits at v0.1.0-rc.7 with the Web UI as the primary onboarding path. What early adopters should know about the plugin architecture and what changed in August.',
      metaDescription:
        'dsh CLI v0.1.0-rc.7 changes and the road to 1.0: Web UI onboarding, plugin install workflow, and what early adopters should know about deepseek-harness CLI.',
      body: [
        {
          p: "Twelve thousand commits later, the dsh CLI sits at v0.1.0-rc.7 — still pre-1.0, but unmistakably the backbone of the deepseek-harness experience. This post covers what changed in the dsh CLI v0.1.0-rc.7 cycle, why the Web UI became the primary onboarding path, and what early adopters should know about installing plugins from the command line.",
        },
        { h2: 'What v0.1.0-rc.7 Changed' },
        {
          ul: [
            'Web UI onboarding: new users now bootstrap through a browser flow instead of fighting flags on the terminal.',
            'Tighter plugin install workflow: dsh plugin install validates the dsh.bundle declaration before touching the filesystem.',
            'Better error surfacing: contract violations now print actionable messages instead of stack traces.',
          ],
        },
        { h2: 'Why the Web UI Took Over Onboarding' },
        {
          p: 'A CLI with a rich plugin ecosystem has a discovery problem: you cannot browse plugins from a shell. The Web UI fixes that with a searchable catalog, one-click installs, and visible security warnings before you commit. The CLI remains for scripting and power users, but the browser is now the front door.',
        },
        { h2: 'Installing Plugins from the CLI' },
        {
          p: 'The core command is still dsh plugin install <name>, and it stays fast and scriptable. The relevant change is validation: the runtime refuses plugins without a valid dsh.bundle and warns on risky install scripts before executing them. If you automate installs, upgrade your scripts against the new exit codes — the old silent-failure path is gone.',
        },
        { h2: 'The Road to 1.0' },
        {
          p: 'The maintainers have been explicit that 1.0 will not land until the plugin contract stops churning. For plugin authors that means pinning the SDK, watching the changelog, and re-testing against each rc. For installers it means the ecosystem is still moving — check quality scores and last-push dates more often, not less.',
        },
      ],
    },
    zh: {
      title: 'dsh CLI 之旅：v0.1.0-rc.7 与通往 1.0 之路',
      excerpt:
        '一万二千次提交之后，dsh CLI 停在 v0.1.0-rc.7，Web UI 成为主要上手路径。早期采用者应该了解的插件架构要点，以及八月发生了什么变化。',
      metaDescription:
        'dsh CLI v0.1.0-rc.7 变化与通往 1.0 之路：Web UI 上手、插件安装工作流，以及早期采用者应该了解的 deepseek-harness CLI 要点。',
      body: [
        {
          p: '一万二千次提交之后，dsh CLI 停在 v0.1.0-rc.7——仍处于 1.0 之前，但无疑是 deepseek-harness 体验的骨干。本文覆盖 dsh CLI v0.1.0-rc.7 周期内改变了什么、为什么 Web UI 成为主要上手路径，以及早期采用者在命令行安装插件时该知道什么。',
        },
        { h2: 'v0.1.0-rc.7 改变了什么' },
        {
          ul: [
            'Web UI 上手：新用户现在通过浏览器流程引导，而不是在终端与 flags 搏斗。',
            '更严格的插件安装工作流：dsh plugin install 在触碰文件系统前验证 dsh.bundle 声明。',
            '更好的错误呈现：契约违规现在打印可操作的提示，而非堆栈跟踪。',
          ],
        },
        { h2: '为什么 Web UI 接管上手' },
        {
          p: '拥有丰富插件生态的 CLI 有发现难题：你无法从 shell 浏览插件。Web UI 用可搜索的目录、一键安装和提交前可见的安全警告解决了它。CLI 仍然服务于脚本与高级用户，但浏览器现在是前门。',
        },
        { h2: '从 CLI 安装插件' },
        {
          p: '核心命令仍是 dsh plugin install <name>，它保持快速与可脚本化。相关变化是验证：运行时拒绝没有有效 dsh.bundle 的插件，并在执行前警告风险安装脚本。如果你自动化安装，请针对新退出码升级脚本——旧的静默失败路径已消失。',
        },
        { h2: '通往 1.0 之路' },
        {
          p: '维护者明确表示，在插件契约停止变动之前 1.0 不会落地。对插件作者这意味着固定 SDK、关注 changelog、针对每个 rc 重测。对安装者意味着生态仍在变动——更频繁地检查质量评分与最后推送日期，而不是更少。',
        },
      ],
    },
  },
  {
    slug: 'landlock-sandboxing-plugin-isolation',
    date: '2026-08-21',
    keywords: ['Landlock', 'sandboxing', 'plugin isolation', 'dsh runtime'],
    longTail: [
      'landlock sandbox dsh plugin isolation',
      'how deepseek harness sandboxes plugins',
      'landlock-run native sandbox explained',
    ],
    en: {
      title: 'Landlock Sandboxing: How deepseek-harness Isolates Plugins',
      excerpt:
        'The landlock-run native sandbox brings Linux Landlock to the dsh runtime. A closer look at why plugin isolation matters and how it changes the security math for installers.',
      metaDescription:
        'Landlock sandbox for dsh plugin isolation: how deepseek-harness sandboxes plugins with landlock-run, why isolation matters, and how it changes installer security.',
      body: [
        {
          p: "Plugin isolation is the feature that turns a risky plugin from an incident into a non-event. deepseek-harness ships the landlock-run native sandbox, which brings Linux Landlock to the dsh runtime. This post explains how Landlock sandboxing works, what the dsh plugin isolation model actually covers, and why it changes the security math for installers.",
        },
        { h2: 'What Landlock Gives You' },
        {
          p: 'Landlock is an unprivileged Linux security module: a process can restrict its own filesystem access with fine-grained rules, no root required. landlock-run wraps the dsh runtime so every plugin runs inside a rule set defined by its bundle manifest — read-only on system paths, write access only to its own data directory, no touching of home or ssh keys.',
        },
        { h2: 'What the Isolation Model Covers' },
        {
          ul: [
            'Filesystem: scoped read/write, with an explicit allowlist for the plugin data dir.',
            'Network: landlock-run setups can pair with network namespaces to block or allow outbound traffic.',
            'Execution: child processes inherit the restricted ruleset instead of escaping it.',
          ],
        },
        { h2: 'What It Does Not Cover' },
        {
          p: 'Landlock is filesystem-first. It does not magically contain memory-safety bugs, and it relies on the kernel version supporting the feature (Linux 5.13+). On platforms without Landlock, the runtime degrades to advisory isolation — which is exactly when you should trust the quality score and install-script scan even more.',
        },
        { h2: 'The New Security Math for Installers' },
        {
          p: 'With sandboxing, a dangerous install script becomes containable rather than catastrophic. But containment is a safety net, not a license to install anything. The recommended posture: let the scanner veto obvious risk, let Landlock contain the rest, and still review anything you plan to run with privileges. Sandboxes make mistakes survivable; they do not make them safe.',
        },
      ],
    },
    zh: {
      title: 'Landlock 沙箱：deepseek-harness 如何隔离插件',
      excerpt:
        'landlock-run 原生沙箱把 Linux Landlock 引入 dsh 运行时。深入看插件隔离为何重要，以及它如何改变安装者的安全计算。',
      metaDescription:
        'Landlock 沙箱与 dsh 插件隔离：deepseek-harness 如何用 landlock-run 沙箱化插件、隔离为何重要，以及它如何改变安装者的安全决策。',
      body: [
        {
          p: '插件隔离是把风险插件从"安全事故"变成"无事发生"的功能。deepseek-harness 自带 landlock-run 原生沙箱，把 Linux Landlock 引入 dsh 运行时。本文解释 Landlock 沙箱如何工作、dsh 插件隔离模型实际覆盖什么，以及它为何改变安装者的安全计算。',
        },
        { h2: 'Landlock 给你什么' },
        {
          p: 'Landlock 是一个无特权 Linux 安全模块：进程可以用细粒度规则限制自己的文件系统访问，无需 root。landlock-run 包装 dsh 运行时，让每个插件运行在其 bundle manifest 定义的规则集内——系统路径只读、只写自己的数据目录、不触碰 home 或 ssh 密钥。',
        },
        { h2: '隔离模型覆盖什么' },
        {
          ul: [
            '文件系统：作用域读写，插件数据目录有显式白名单。',
            '网络：landlock-run 设置可与网络命名空间配合，阻止或允许出站流量。',
            '执行：子进程继承受限规则集而非逃逸它。',
          ],
        },
        { h2: '它不覆盖什么' },
        {
          p: 'Landlock 以文件系统为先。它不会神奇地包含内存安全 bug，且依赖支持该特性的内核版本（Linux 5.13+）。在没有 Landlock 的平台上，运行时降级为建议性隔离——此时你更应该信任质量评分与安装脚本扫描。',
        },
        { h2: '安装者的新安全计算' },
        {
          p: '有了沙箱，危险安装脚本变得可遏制而非灾难性。但遏制是安全网，不是随便安装的许可。推荐姿态：让扫描器否决明显风险，让 Landlock 遏制其余，仍要审查任何打算以特权运行的东西。沙箱让错误可承受；它不会让错误变安全。',
        },
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
