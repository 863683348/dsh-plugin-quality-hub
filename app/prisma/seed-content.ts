// ============================================================
// 内容 seed — Tutorials 教程中心 + Examples 实例库 (Spec §7.2)
// 用法: npm run seed:content  (package.json 已注册)
// 幂等 upsert(按 slug); published 条目强制 en/zh 双语非空;
// 互链断言: relatedExampleSlugs / relatedTutorialSlugs 存在,
//           relatedPluginNames 存在于 plugins 表(否则抛错退出)。
// 不动 prisma/seed.ts(mock 插件池), 互不干扰。
// ============================================================

import { PrismaClient } from "@prisma/client";
import { TUTORIAL_SLUGS } from "../src/lib/content-constants";

const prisma = new PrismaClient();

// ------------------------------------------------------------
// 3 篇种子教程 (对应 PM 种子1/2/3: T1 入门 / T6 进阶 / T9 实战)
// ------------------------------------------------------------

const tutorials = [
  {
    slug: TUTORIAL_SLUGS.writeFirstPlugin,
    status: "published",
    level: "beginner",
    order: 1,
    readingMinutes: 6,
    publishedAt: new Date("2026-08-19T00:00:00Z"),
    titleEn: "Write Your First DeepSeek Harness Plugin from Scratch",
    titleZh: "从 0 写你的第一个 DeepSeek Harness 插件",
    excerptEn:
      "Everything is a plugin. Build a minimal dsh.bundle + apply(ctx, config) plugin, install it into your web profile and verify it runs.",
    excerptZh:
      "一切皆插件。从最小可运行的 dsh.bundle + apply(ctx, config) 骨架开始，装进 web profile 并验证生效。",
    contentEn: [
      "## One sentence: everything is a plugin",
      "DeepSeek Harness (dsh) is built around a single idea: the CLI, the web UI, tools, commands, skills, MCP servers, LLM adapters and cron jobs are **all plugins**. A plugin is just a JS/TS module that exports `apply(ctx, config)`. Once you internalise this, every extension point in dsh becomes the same skill with a different registration call.",
      "",
      "## The minimal skeleton that actually loads",
      "The first trap for beginners: a package that installs but never activates. Only packages that declare `dsh.bundle` (specifically `dsh.bundle.patch`) become an **active profile layer**. Here is the smallest package.json that works:",
      "",
      "```json",
      "{",
      '  "name": "my-first-plugin",',
      '  "version": "0.1.0",',
      '  "type": "module",',
      '  "main": "index.ts",',
      '  "dsh": { "bundle": { "patch": ["index.ts"] } }',
      "}",
      "```",
      "",
      "And the plugin itself:",
      "",
      "```ts",
      "export function apply(ctx, config) {",
      "  ctx.log('my-first-plugin activated');",
      "  ctx.commands.register('hello', {",
      "    description: 'Say hello from your first plugin',",
      "    action: () => `Hello from ${config.name ?? 'my-first-plugin'}`,",
      "  });",
      "}",
      "```",
      "",
      "`apply(ctx, config)` is the contract: `ctx` is how your plugin registers capabilities, `config` is the user-provided options. No other lifecycle hooks are required.",
      "",
      "## Install it into your web profile",
      "dsh keeps plugin bundles isolated per profile under `$DSH_HOME/profiles/` (default `~/.dsh`). Point your local plugin at the web profile and restart:",
      "",
      "```bash",
      "dsh plugin --profile web add ./",
      "npx @deepseek-ai/dsh web",
      "```",
      "",
      "Open `http://127.0.0.1:3080` and you should see the activation log plus a `/hello` command ready to run.",
      "",
      "## Verify, then compare against the Hub",
      "If nothing happened, the usual suspect is a missing `dsh.bundle` declaration. Confirm the profile list shows your plugin: `dsh plugin --profile web list`.",
      "",
      "Once it runs, browse Top Rated plugins on this site and open one you admire — every one of them is the same shape: a module exporting `apply(ctx, config)`. The only difference is what they register on `ctx`.",
    ].join("\n"),
    contentZh: [
      "## 一句话：一切皆插件",
      "DeepSeek Harness (dsh) 围绕一个核心思想构建：CLI、Web UI、工具、命令、技能、MCP server、LLM 适配器和定时任务，**全部都是插件**。插件就是一个导出 `apply(ctx, config)` 的 JS/TS 模块。想通这一点后，dsh 的所有扩展点都是同一个技能，只是注册调用不同。",
      "",
      "## 真正能加载的最小骨架",
      "新手第一个坑：装上了却不生效。只有声明了 `dsh.bundle`（具体是 `dsh.bundle.patch`）的包才会成为 **active profile layer**。这是能工作的最小 package.json：",
      "",
      "```json",
      "{",
      '  "name": "my-first-plugin",',
      '  "version": "0.1.0",',
      '  "type": "module",',
      '  "main": "index.ts",',
      '  "dsh": { "bundle": { "patch": ["index.ts"] } }',
      "}",
      "```",
      "",
      "插件本体：",
      "",
      "```ts",
      "export function apply(ctx, config) {",
      "  ctx.log('my-first-plugin activated');",
      "  ctx.commands.register('hello', {",
      "    description: 'Say hello from your first plugin',",
      "    action: () => `Hello from ${config.name ?? 'my-first-plugin'}`,",
      "  });",
      "}",
      "```",
      "",
      "`apply(ctx, config)` 就是契约：`ctx` 是插件注册能力的入口，`config` 是用户提供的配置。没有其他必需的生命周期钩子。",
      "",
      "## 装进 web profile",
      "dsh 在 `$DSH_HOME/profiles/`（默认 `~/.dsh`）下按 profile 隔离插件 bundle。把本地插件指向 web profile 并重启：",
      "",
      "```bash",
      "dsh plugin --profile web add ./",
      "npx @deepseek-ai/dsh web",
      "```",
      "",
      "打开 `http://127.0.0.1:3080`，应该能看到激活日志和一个可执行的 `/hello` 命令。",
      "",
      "## 验证，然后对照 Hub",
      "如果没生效，最常见的元凶就是缺 `dsh.bundle` 声明。用 `dsh plugin --profile web list` 确认插件出现在 profile 列表里。",
      "",
      "跑通之后，去本站 Top Rated 榜单打开一个你欣赏的插件——它们每一个都是同一个形态：一个导出 `apply(ctx, config)` 的模块。唯一的区别是它们在 `ctx` 上注册了什么。",
    ].join("\n"),
    relatedExampleSlugs: ["dsh-web-ui", "dsh-hooks-claude-code"],
    relatedPluginNames: ["deepseek-harness/backup-tool", "ysr666/notifier"],
  },
  {
    slug: TUTORIAL_SLUGS.connectMcpTools,
    status: "published",
    level: "intermediate",
    order: 2,
    readingMinutes: 8,
    publishedAt: new Date("2026-08-19T00:00:00Z"),
    titleEn: "Bridge an MCP Server or Custom Tool into DeepSeek Harness",
    titleZh: "给 dsh 接入 MCP server 或自定义 tool",
    excerptEn:
      "Two paths to give your model real capabilities: register a custom tool with ctx.tools.register, or wrap an existing MCP server into a dsh plugin.",
    excerptZh:
      "两条路径让模型获得真实能力：用 ctx.tools.register 注册自定义 tool，或把现成 MCP server 包成 dsh 插件。",
    contentEn: [
      "## Tool vs command: who calls whom",
      "A **command** is triggered by the user through the UI. A **tool** is called by the model itself when it decides a function would help. If you want the agent to act on its own, you register a tool.",
      "",
      "## Path A — register a custom tool",
      "The minimal registration node:",
      "",
      "```ts",
      "ctx.tools.register({",
      "  name: 'read_local_file',",
      "  description: 'Read a text file from the workspace',",
      "  parameters: {",
      "    type: 'object',",
      "    properties: {",
      "      path: { type: 'string', description: 'Relative path' },",
      "    },",
      "    required: ['path'],",
      "  },",
      "  async execute(args) {",
      "    try {",
      "      return { ok: true, content: await fs.readFile(args.path, 'utf8') };",
      "    } catch (err) {",
      "      // Errors must be surfaced to the model, not swallowed",
      "      return { ok: false, error: String(err) };",
      "    }",
      "  },",
      "});",
      "```",
      "",
      "Three details matter: a clear `description` (it steers model selection), a strict JSON Schema for `parameters`, and structured error returns so the model can recover and retry.",
      "",
      "## Path B — wrap an existing MCP server",
      "MCP (Model Context Protocol) servers expose tools over stdio or HTTP. Instead of re-implementing them, start the server inside your plugin and register its tools on `ctx`:",
      "",
      "```ts",
      "import { startMcpClient } from '@dsh/mcp';",
      "",
      "export async function apply(ctx) {",
      "  const client = await startMcpClient({",
      "    command: 'npx',",
      "    args: ['-y', '@modelcontextprotocol/server-filesystem', './'],",
      "  });",
      "  const tools = await client.listTools();",
      "  for (const tool of tools) {",
      "    ctx.tools.register({",
      "      name: `mcp_${tool.name}`,",
      "      description: tool.description,",
      "      parameters: tool.inputSchema,",
      "      execute: (args) => client.callTool(tool.name, args),",
      "    });",
      "  }",
      "}",
      "```",
      "",
      "For remote servers, pass a `url` instead of `command`/`args`. Either way, the model now sees one more tool in its toolbox — no protocol work on the model side.",
      "",
      "## Verify end to end",
      "Start dsh, open a session and ask the model to do something that requires the tool (e.g. \"what is in ./package.json?\"). Watch the model call `read_local_file` (or `mcp_filesystem_*`) on its own, then answer from the result.",
      "",
      "## Related teardowns",
      "Real plugins show the same pattern at scale: modlens returns structured visual evidence as a tool result, and dsh-at-file extends the input channel with Codex-style @file references.",
    ].join("\n"),
    contentZh: [
      "## Tool 与 command：谁调用谁",
      "**command** 由用户在 UI 里触发；**tool** 由模型自己决定需要时调用。想让 agent 自主行动，就注册 tool。",
      "",
      "## 路径 A — 注册自定义 tool",
      "最小注册节点：",
      "",
      "```ts",
      "ctx.tools.register({",
      "  name: 'read_local_file',",
      "  description: 'Read a text file from the workspace',",
      "  parameters: {",
      "    type: 'object',",
      "    properties: {",
      "      path: { type: 'string', description: 'Relative path' },",
      "    },",
      "    required: ['path'],",
      "  },",
      "  async execute(args) {",
      "    try {",
      "      return { ok: true, content: await fs.readFile(args.path, 'utf8') };",
      "    } catch (err) {",
      "      // 错误必须回传给模型，不能吞掉",
      "      return { ok: false, error: String(err) };",
      "    }",
      "  },",
      "});",
      "```",
      "",
      "三个细节很关键：清晰的 `description`（它决定模型选不选这个 tool）、严格的 JSON Schema `parameters`、以及结构化错误返回（让模型能恢复并重试）。",
      "",
      "## 路径 B — 包一个现成 MCP server",
      "MCP (Model Context Protocol) server 通过 stdio 或 HTTP 暴露工具。与其重新实现，不如在插件里启动 server 并把它的工具注册到 `ctx`：",
      "",
      "```ts",
      "import { startMcpClient } from '@dsh/mcp';",
      "",
      "export async function apply(ctx) {",
      "  const client = await startMcpClient({",
      "    command: 'npx',",
      "    args: ['-y', '@modelcontextprotocol/server-filesystem', './'],",
      "  });",
      "  const tools = await client.listTools();",
      "  for (const tool of tools) {",
      "    ctx.tools.register({",
      "      name: `mcp_${tool.name}`,",
      "      description: tool.description,",
      "      parameters: tool.inputSchema,",
      "      execute: (args) => client.callTool(tool.name, args),",
      "    });",
      "  }",
      "}",
      "```",
      "",
      "远程 server 只需传 `url` 代替 `command`/`args`。无论哪种方式，模型的工具箱里都多了一个工具，协议层完全不用模型操心。",
      "",
      "## 端到端验证",
      "启动 dsh，开一个会话，让模型做一件需要工具的事（比如\"package.json 里有什么？\"）。观察模型自主调用 `read_local_file`（或 `mcp_filesystem_*`），然后基于结果作答。",
      "",
      "## 相关拆解",
      "真实插件在更大规模上展示了同一模式：modlens 把结构化视觉证据作为 tool 结果返回，dsh-at-file 用 Codex 风格的 @file 引用扩展输入通道。",
    ].join("\n"),
    relatedExampleSlugs: ["modlens", "dsh-agent-teams"],
    relatedPluginNames: ["deepseek-harness/swagger-helper", "strukto-ai/mirage"],
  },
  {
    slug: TUTORIAL_SLUGS.publishAndGetRated,
    status: "published",
    level: "advanced",
    order: 3,
    readingMinutes: 7,
    publishedAt: new Date("2026-08-19T00:00:00Z"),
    titleEn: "Publish to GitHub topic dsh-plugin & Get Rated on the Hub",
    titleZh: "把插件发布到 GitHub topic dsh-plugin 并拿到 Hub 评测",
    excerptEn:
      "There is no official registry — the discovery mechanism is the dsh-plugin GitHub topic. Publish, add the topic, and let the Hub rate you.",
    excerptZh:
      "官方没有插件市场，唯一的发现机制是 GitHub topic `dsh-plugin`。发布、打标，然后让 Hub 为你评分。",
    contentEn: [
      "## Why the topic is the registry",
      "dsh has **no official plugin marketplace**. The community discovery mechanism is a convention: repositories tagged with the GitHub topic `dsh-plugin`. Directories like awesome-dsh-plugin and this Hub both crawl that topic — so a missing tag means your plugin is invisible.",
      "",
      "## Pre-publish checklist",
      "1. **Tag the repo** with the `dsh-plugin` topic on GitHub (Repository settings -> Topics).",
      "2. **Declare `dsh.bundle`** in package.json so installers can activate it as a profile layer.",
      "3. **README**: include the install command and the license. A one-liner install snippet is the difference between tried and skipped.",
      "",
      "```bash",
      "dsh plugin --profile web add github:owner/repo",
      "```",
      "",
      "## Lock versions for safety",
      "Installing from a GitHub source runs the repository's build scripts at install time. Always pin what you install:",
      "",
      "```bash",
      "# Pin a commit or a tag for reproducible, auditable installs",
      "dsh plugin --profile web add github:owner/repo@commit",
      "dsh plugin --profile web list",
      "dsh plugin --profile web remove github:owner/repo",
      "```",
      "",
      "## Get rated on the Hub",
      "The DSH Plugin Quality Hub runs a daily automated evaluation pipeline (GitHub Actions): it discovers new `dsh-plugin` repositories, scores them across maintenance, docs, npm and ecosystem, and publishes Top Rated, Trending and Security Watch. Submit once, get re-scored automatically as your repository changes.",
      "",
      "> Submit your plugin at the Hub — a Top Rated badge is a stronger signal than a README claim.",
      "",
      "## The loop is closed",
      "Publish -> add the topic -> get rated -> link your tutorial back to your own evaluation page. That is the same content loop this site is built on: tutorials reference examples, examples reference rated plugins, and every rated plugin links back to a tutorial.",
    ].join("\n"),
    contentZh: [
      "## 为什么 topic 就是注册表",
      "dsh **没有官方插件市场**。社区的发现机制是一个约定：仓库打上 GitHub topic `dsh-plugin`。awesome-dsh-plugin 和本 Hub 都在爬这个 topic——没打标，你的插件就是隐形的。",
      "",
      "## 发布前检查清单",
      "1. **打标**：在 GitHub 仓库设置 -> Topics 里加上 `dsh-plugin`。",
      "2. **声明 `dsh.bundle`**：让安装器能把它激活为 profile layer。",
      "3. **README**：包含安装命令和许可。一行安装片段决定别人是试还是跳过。",
      "",
      "```bash",
      "dsh plugin --profile web add github:owner/repo",
      "```",
      "",
      "## 锁版本更安全",
      "从 GitHub 源安装会在安装时执行仓库的构建脚本。永远固定你要装的东西：",
      "",
      "```bash",
      "# 固定 commit 或 tag，保证可复现、可审计",
      "dsh plugin --profile web add github:owner/repo@commit",
      "dsh plugin --profile web list",
      "dsh plugin --profile web remove github:owner/repo",
      "```",
      "",
      "## 在 Hub 上拿到评测",
      "DSH Plugin Quality Hub 每天跑一次自动化评测管道（GitHub Actions）：发现新的 `dsh-plugin` 仓库，从维护、文档、npm、生态四个维度打分，发布 Top Rated、Trending 和 Security Watch。提交一次，仓库变化后自动重评。",
      "",
      "> 去 Hub 提交你的插件——Top Rated 徽章比 README 自夸更有说服力。",
      "",
      "## 闭环完成",
      "发布 -> 打标 -> 被评测 -> 在教程里互链回自己的评测页。这正是本站的内容闭环：教程引用实例，实例引用被评测的插件，每个被评测的插件又链回教程。",
    ].join("\n"),
    relatedExampleSlugs: ["dsh-agent-teams", "modlens"],
    relatedPluginNames: ["vostride/agent-qa", "deepseek-harness/backup-tool"],
  },
];

// ------------------------------------------------------------
// 4 个真实实例拆解 (对应 PM E1/E8/E13/E16)
// pluginName 为真实 owner/repo; 若尚未入库, View on Hub 优雅降级为 GitHub 外链
// ------------------------------------------------------------

const examples = [
  {
    slug: "dsh-web-ui",
    status: "published",
    pluginName: "zhu1090093659/dsh-web-ui",
    category: "ui-enhancements",
    order: 1,
    titleEn: "dsh-web-ui: a panel, a skin center, and task boards",
    titleZh: "dsh-web-ui：右侧面板 + 皮肤中心 + 任务看板",
    excerptEn:
      "The fastest-growing UI bundle in the early ecosystem: injects a right-side panel, a skin center, Git graph and token statistics into the web UI.",
    excerptZh:
      "早期生态增长最快的 UI 合集：向 Web UI 注入右侧面板、皮肤中心、Git 图和 token 统计。",
    configEn:
      "```bash\n# install into the web profile and restart\ndsh plugin --profile web add github:zhu1090093659/dsh-web-ui\nnpx @deepseek-ai/dsh web\n```\n\nThis is a classic `github:owner/repo` install — the plugin repo ships its own bundle, so no npm package is required.",
    configZh:
      "```bash\n# 装进 web profile 并重启\ndsh plugin --profile web add github:zhu1090093659/dsh-web-ui\nnpx @deepseek-ai/dsh web\n```\n\n这是典型的 `github:owner/repo` 安装——插件仓库自带 bundle，不需要 npm 包。",
    codeEn:
      "The pattern worth stealing is **panel injection without kernel changes**: the plugin registers UI capabilities on `ctx` that the web client discovers at startup, then mounts panels, a skin center, a Git graph and token statistics as first-class widgets.\n\n```ts\nexport function apply(ctx, config) {\n  // registers widgets the web client renders on the right rail\n  ctx.ui.registerPanel('tasks', { title: 'Task board' });\n  ctx.ui.registerPanel('git', { title: 'Git graph' });\n  ctx.ui.registerSkin(config.skin ?? 'default');\n}\n```",
    codeZh:
      "值得偷师的模式是**不改内核的面板注入**：插件在 `ctx` 上注册 UI 能力，web 客户端启动时发现它们，把面板、皮肤中心、Git 图和 token 统计挂成一等公民组件。\n\n```ts\nexport function apply(ctx, config) {\n  // 注册 web 客户端在右侧栏渲染的组件\n  ctx.ui.registerPanel('tasks', { title: 'Task board' });\n  ctx.ui.registerPanel('git', { title: 'Git graph' });\n  ctx.ui.registerSkin(config.skin ?? 'default');\n}\n```",
    highlightsEn:
      "- **Growth signal**: 900+ to ~1868 stars within days of the public preview.\n- **Scope**: task boards, Git graph, token statistics and a skin center in one bundle.\n- **Lesson**: UI plugins are the fastest way to differentiate — and they never touch the kernel.",
    highlightsZh:
      "- **增长信号**：公测数天内从 900+ 涨到约 1868 star。\n- **覆盖面**：任务看板、Git 图、token 统计、皮肤中心一包打尽。\n- **启示**：UI 插件是差异化的最快路径——而且完全不碰内核。",
    relatedTutorialSlugs: ["write-first-plugin"],
  },
  {
    slug: "modlens",
    status: "published",
    pluginName: "liustack/modlens",
    category: "tools-capabilities",
    order: 2,
    titleEn: "modlens: giving the model eyes",
    titleZh: "modlens：给模型装上眼睛",
    excerptEn:
      "The first vision plugin: paste an image, a vision engine returns structured JSON evidence, and the model answers from the evidence.",
    excerptZh:
      "首个视觉插件：粘贴图片，视觉引擎返回结构化 JSON 证据，模型基于证据作答。",
    configEn:
      "```bash\n# pin the version - pnpm intentionally delays fresh publishes for 24h\nnpx -y @deepseek-ai/dsh plugin --profile web add @liustack/modlens@3.18.1\n```\n\nThe plugin keeps your API keys self-hosted: Gemini, OpenAI-compatible or Claude CLI engines are configured locally, never sent to a third-party proxy.",
    configZh:
      "```bash\n# 锁版本安装——pnpm 会对 24 小时内新发布的版本延迟解析\nnpx -y @deepseek-ai/dsh plugin --profile web add @liustack/modlens@3.18.1\n```\n\n密钥完全自持：Gemini、OpenAI 兼容或 Claude CLI 引擎都在本地配置，不会发往任何第三方代理。",
    codeEn:
      "The three-step data flow is the teardown highlight: image in -> structured evidence out -> model answers.\n\n```ts\n// 1. paste image -> 2. vision engine returns JSON evidence\nconst evidence = await visionEngine.analyze(image, {\n  ocr: true,\n  layout: true,\n  entities: true,\n});\n// 3. evidence becomes the tool result the model reasons over\nreturn { ok: true, evidence };\n```\n\nOCR transcription, reading-order layout and entity relations are returned as **structured JSON**, not prose — exactly what a reasoning model can consume.",
    codeZh:
      "三步数据流是拆解亮点：图片进 -> 结构化证据出 -> 模型作答。\n\n```ts\n// 1. 粘贴图片 -> 2. 视觉引擎返回 JSON 证据\nconst evidence = await visionEngine.analyze(image, {\n  ocr: true,\n  layout: true,\n  entities: true,\n});\n// 3. 证据作为 tool 结果交给模型推理\nreturn { ok: true, evidence };\n```\n\nOCR 转录、阅读顺序版面、实体关系都以**结构化 JSON** 返回，而不是散文——正是推理模型能直接消费的形态。",
    highlightsEn:
      "- **First-mover**: the first vision plugin in the ecosystem (857 to ~2444 stars).\n- **Design**: external capability returning structured evidence is the canonical tool pattern.\n- **Privacy**: keys stay on the machine; nothing is proxied.",
    highlightsZh:
      "- **先发优势**：生态首个视觉插件（857 到约 2444 star）。\n- **设计**：外部能力返回结构化证据，是 tool 类插件的标准范式。\n- **隐私**：密钥留在本机，零代理转发。",
    relatedTutorialSlugs: ["connect-mcp-tools"],
  },
  {
    slug: "dsh-agent-teams",
    status: "published",
    pluginName: "NanmiCoder/dsh-agent-teams",
    category: "workflow-automation",
    order: 3,
    titleEn: "dsh-agent-teams: from solo to squad",
    titleZh: "dsh-agent-teams：从单兵到小队",
    excerptEn:
      "Turn the current session into a captain, spawn a persistent team of sub-agents, split tasks with dependencies, and let a shared scheduler dispatch.",
    excerptZh:
      "把当前会话升级为 captain，组建持久化子 agent 团队，拆分带依赖的任务，由共享调度器派活。",
    configEn:
      "```bash\ndsh plugin --profile web add github:NanmiCoder/dsh-agent-teams\n```\n\nThe plugin elevates the current session into captain mode; the Web UI renders each member's live state (working / idle / paused).",
    configZh:
      "```bash\ndsh plugin --profile web add github:NanmiCoder/dsh-agent-teams\n```\n\n插件把当前会话升级为 captain 模式；Web UI 实时渲染每个成员的 working / idle / paused 状态。",
    codeEn:
      "The orchestration loop worth copying: decompose -> dispatch -> aggregate.\n\n```ts\nconst team = await ctx.agent.spawnTeam({\n  roles: ['researcher', 'writer', 'reviewer'],\n  persistent: true,\n});\nconst tasks = splitIntoDependentTasks(goal, team);\nconst results = await scheduler.dispatch(tasks, {\n  assign: (t) => team.idleMember(), // by availability\n  dependencies: true,\n});\nreturn captain.summarize(results);\n```\n\nA shared scheduler assigns work to idle members, honours task dependencies, and the captain aggregates the archive. It is the same pattern as parallel \"research N competitors, write one page each\" flows.",
    codeZh:
      "值得照抄的编排循环：拆解 -> 派发 -> 汇总。\n\n```ts\nconst team = await ctx.agent.spawnTeam({\n  roles: ['researcher', 'writer', 'reviewer'],\n  persistent: true,\n});\nconst tasks = splitIntoDependentTasks(goal, team);\nconst results = await scheduler.dispatch(tasks, {\n  assign: (t) => team.idleMember(), // 按空闲度派活\n  dependencies: true,\n});\nreturn captain.summarize(results);\n```\n\n共享调度器把任务派给空闲成员、尊重任务依赖，队长汇总归档。\"并行调研 N 个竞品、各写一页\"就是同一模式。",
    highlightsEn:
      "- **Pattern**: persistent sub-agent teams with a shared scheduler (429 stars).\n- **UX**: live member states in the Web UI make orchestration visible.\n- **Lesson**: multi-agent is not chaos if dispatch is deterministic.",
    highlightsZh:
      "- **范式**：共享调度器 + 持久化子 agent 团队（429 star）。\n- **体验**：Web UI 实时成员状态让编排可见。\n- **启示**：只要派发是确定性的，多 Agent 就不会乱。",
    relatedTutorialSlugs: ["connect-mcp-tools", "publish-and-get-rated"],
  },
  {
    slug: "dsh-hooks-claude-code",
    status: "published",
    pluginName: "deepseek-harness/dsh-hooks-claude-code",
    category: "dev-runtime",
    order: 4,
    titleEn: "dsh-hooks-claude-code: the official bridge as a plugin",
    titleZh: "dsh-hooks-claude-code：官方 bridge 即插件",
    excerptEn:
      "The official bridge translates your existing Claude Code hooks.json into dsh hook extension points — reuse, don't rewrite. Proof that everything is a plugin.",
    excerptZh:
      "官方 bridge 把你现有的 Claude Code hooks.json 翻译成 dsh hook 扩展点——复用而非重写。一切皆插件的最好证明。",
    configEn:
      "```bash\ndsh plugin --profile web add dsh-hooks-claude-code\n```\n\nInstalled like any other plugin. Your existing Claude Code hooks configuration becomes dsh hooks without a rewrite.",
    configZh:
      "```bash\ndsh plugin --profile web add dsh-hooks-claude-code\n```\n\n和任何插件一样安装。你现有的 Claude Code hooks 配置无需重写即可变成 dsh hooks。",
    codeEn:
      "The bridging idea: read the foreign format, map it onto dsh extension points.\n\n```ts\nexport function apply(ctx, config) {\n  const hooks = readClaudeHooksJson(config.path);\n  for (const [event, commands] of Object.entries(hooks)) {\n    ctx.hooks.register(mapEvent(event), {\n      commands,\n      // run at the mapped agent/tool lifecycle extension point\n    });\n  }\n}\n```\n\nIt proves the ecosystem claim from the top: even an official migration tool is shipped as a plugin.",
    codeZh:
      "桥接思路：读取外来格式，映射到 dsh 扩展点。\n\n```ts\nexport function apply(ctx, config) {\n  const hooks = readClaudeHooksJson(config.path);\n  for (const [event, commands] of Object.entries(hooks)) {\n    ctx.hooks.register(mapEvent(event), {\n      commands,\n      // 在映射后的 agent/tool 生命周期扩展点运行\n    });\n  }\n}\n```\n\n它从最高处证明了生态主张：连官方迁移工具都是以插件形态发布的。",
    highlightsEn:
      "- **Official**: shipped by the DeepSeek Harness team as a bridge plugin.\n- **Migration path**: Claude Code and Codex hooks.json translate into dsh hooks — reuse, don't rewrite.\n- **Ecosystem proof**: if the official tool is a plugin, everything is a plugin.",
    highlightsZh:
      "- **官方出品**：DeepSeek Harness 团队以 bridge 插件形式发布。\n- **迁移路径**：Claude Code / Codex 的 hooks.json 直接翻译成 dsh hooks——复用而非重写。\n- **生态证明**：官方工具都是插件，一切皆插件。",
    relatedTutorialSlugs: ["write-first-plugin"],
  },
];

// ------------------------------------------------------------
// 幂等 upsert + 引用断言
// ------------------------------------------------------------

async function run() {
  let tutorialCount = 0;
  let exampleCount = 0;

  for (const t of tutorials) {
    const exists = await prisma.tutorial.findUnique({ where: { slug: t.slug } });
    // 路线①: 现有内容全免费; 后续 pro 内容在对象里加 tier: "pro" 即可
    await prisma.tutorial.upsert({
      where: { slug: t.slug },
      create: { ...t, tier: "free" },
      update: { ...t, tier: "free" },
    });
    tutorialCount++;
    if (!exists) console.log(`  + tutorial ${t.slug}`);
    else console.log(`  ~ tutorial ${t.slug} (updated)`);
  }

  for (const e of examples) {
    const exists = await prisma.example.findUnique({ where: { slug: e.slug } });
    await prisma.example.upsert({
      where: { slug: e.slug },
      create: { ...e, tier: "free" },
      update: { ...e, tier: "free" },
    });
    exampleCount++;
    if (!exists) console.log(`  + example ${e.slug}`);
    else console.log(`  ~ example ${e.slug} (updated)`);
  }

  // ---- 断言 1: published 条目 en/zh 双语非空 ----
  for (const t of tutorials) {
    if (
      !t.titleEn ||
      !t.titleZh ||
      !t.excerptEn ||
      !t.excerptZh ||
      !t.contentEn ||
      !t.contentZh
    ) {
      throw new Error(`Tutorial ${t.slug} has empty bilingual fields`);
    }
  }
  for (const e of examples) {
    const dims = [e.titleEn, e.titleZh, e.excerptEn, e.excerptZh, e.configEn, e.configZh, e.codeEn, e.codeZh, e.highlightsEn, e.highlightsZh];
    if (dims.some((v) => !v)) {
      throw new Error(`Example ${e.slug} has empty bilingual fields`);
    }
  }

  // ---- 断言 2: 互链 slug 均存在 ----
  const allTutorialSlugs: string[] = tutorials.map((t) => t.slug);
  const allExampleSlugs: string[] = examples.map((e) => e.slug);
  const missingRefs: string[] = [];
  for (const t of tutorials) {
    for (const s of t.relatedExampleSlugs) {
      if (!allExampleSlugs.includes(s)) missingRefs.push(`tutorial:${t.slug} -> example:${s}`);
    }
  }
  for (const e of examples) {
    for (const s of e.relatedTutorialSlugs) {
      if (!allTutorialSlugs.includes(s)) missingRefs.push(`example:${e.slug} -> tutorial:${s}`);
    }
  }

  // ---- 断言 3: relatedPluginNames 必须存在于 plugins 表 ----
  const pluginNames = Array.from(
    new Set(tutorials.flatMap((t) => t.relatedPluginNames))
  );
  const foundPlugins = await prisma.plugin.findMany({
    where: { name: { in: pluginNames } },
    select: { name: true },
  });
  const foundSet = new Set(foundPlugins.map((p) => p.name));
  for (const n of pluginNames) {
    if (!foundSet.has(n)) missingRefs.push(`tutorial -> plugin:${n} (NOT in plugins table)`);
  }

  if (missingRefs.length > 0) {
    throw new Error(`Reference integrity failed:\n${missingRefs.join("\n")}`);
  }

  console.log(`\nSeed complete: ${tutorialCount} tutorials, ${exampleCount} examples, 0 missing references.`);
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
