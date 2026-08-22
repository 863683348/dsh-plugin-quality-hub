# 为 dsh 构建跨会话长期记忆插件

周一的早晨，真实项目里的场景。你打开一个新的 dsh 会话，想继续上周四开始的 API 迁移。助手对你上周四的决定一无所知。它不知道你拍板的接口契约，不知道被否决的数据库，也不知道你们争论了二十分钟的命名规范。你把这一切重新讲了一遍。周二你又讲了一遍，周三第三遍。这不是 dsh 的缺陷。这是所有 LLM Agent 的默认契约：一个会话是一间干净的房间，除非有东西把它写下来，否则什么都不会带出这扇门。

我写这篇教程，是因为我自己在那个循环里困了四天。解法不是一个聪明的模型配置，而是一个把磁盘当作唯一跨会话存活物的插件。读完本文，你会得到一个可用的 dsh 跨会话记忆插件：记住你让它记住的事实，在下一次会话开头注入，让模型真的带着这些信息起步，并且把整个记忆库用 git 分支归档，坏的一周也能回滚。代码是完整的，直接复制就能跑。跑完再看讲 dsh-memory-evolve 的那一节，你会看到这个想法的严肃版本走到了哪里。

## 为什么 Agent 默认无状态

dsh 底层的核心模型是大语言模型。大语言模型只有一个上下文窗口，没有硬盘，没有长期存储。它看到的每一个 token 都来自当前的上下文窗口，窗口一关，token 就没了。你所谓的"记忆"，对模型来说，只是你发消息那一刻恰好躺在上下文里的文字。

dsh 继承了这一点，并且把它做成了显式约定。每个会话都从空对话开始。模型不知道你是谁、你在哪个项目、你昨天决定了什么，除非上下文里有东西告诉它。这不是疏漏。无状态是刻意的设计：它让会话彼此隔离，一个项目的失误不会漏进另一个项目；它让你的数据保持私密，因为除非插件主动写，否则不会有任何东西落盘；它让行为可复现，同样的输入得到同样的输出，而不是被过期的假设污染。

因此在写任何插件之前，你需要先内化一条规则：持久化永远不会自动发生。想让模型明天知道某件事，就必须有东西在今天把它写下来。这个东西就是插件。

要理解记忆插件住在哪里，先看 dsh 怎么组织文件。dsh 把一切都放在一个默认是 ~/.dsh 的 home 目录下，插件按 profile 隔离，位于 ~/.dsh/profiles/ 下面。每个 profile 有自己的插件 bundle 集合。profile 大致相当于一套 Agent 配置：你可能有一个叫 web 的 profile 管内容站，一个叫 dev 的 profile 写代码。装进 web profile 的插件，对 dev profile 不可见。这种隔离对记忆是好事，因为一个 profile 的记忆文件不会污染另一个。

dsh 的插件是一个导出 apply 函数的 JavaScript 或 TypeScript 模块，签名是 apply(ctx, config)。dsh 会在模型看到任何用户输入之前调用一次 apply。这个时机就是跨会话记忆的全部技巧，请你记住这一点：apply 在会话开头运行，所以你在 apply 里读到的内容可以放进模型的起始上下文，你在 apply 里写的内容下次会话依然在。

有一个打包细节最坑人，我自己也踩过。插件包只有在 package.json 里声明了特定的 "dsh" 键，才会被识别为 active profile layer。没有它，dsh 只把它当普通依赖加载，永远不调用 apply。声明必须长这样：

```json
{
  "name": "dsh-memory-mini",
  "version": "0.1.0",
  "private": true,
  "main": "index.ts",
  "dsh": {
    "bundle": {
      "patch": ["index.ts"]
    }
  }
}
```

"dsh" 键里的 "bundle" 和 "patch" 就是把目录变成 profile layer 的东西，patch 数组列出会被打入会话的文件。你一定会忘掉这个键，我就忘了，为此浪费了一个晚上调试一个"加载了却什么都不干"的插件。排错时先检查这个键，再碰任何逻辑。

## 记忆到底该存什么

构建记忆最难的不是代码，而是决定什么值得被记住。什么都存，上下文会被琐事淹没，模型反而漏掉真正重要的事实。什么都不存，就回到周一早晨的循环。对我有效的方案，也是参考插件 dsh-memory-evolve 用的方案，是一组有清晰范围和归属的轨道，我叫它五轨模型。

第一轨是用户档案。存关于你的稳定事实：名字、时区、默认分支策略、偏好的技术栈、喜欢怎么解释报错。这些事实变化慢，存起来便宜，注入价值高。一行档案就能阻止模型在每一个会话里重复问你同样的设置问题。

第二轨是全局事实。这些是跨项目恒真的陈述：你的团队主干分支叫 main 不叫 master，上线前必须跑一个叫 check 的 lint 脚本，项目看板在某个固定 URL。全局事实是你工作环境的共同基线，是你对每个新工具、每个新模型都要重复的东西。

第三轨是项目关键事实。周一早晨的痛苦其实都在这条轨上。每个项目一份清单：谈定的接口契约、被否决的数据库及原因、敲定的命名规范、某个遗留服务的负责人。这些是决策。决策的重新推导成本极高，而新会话恰恰无法重建它们。项目事实是整个系统里价值最高的一轨。

第四轨是每日日志。每个会话一行，带日期和项目。每日日志不是给当前会话用的，是给未来那个问"上周我们干了什么"的会话用的。没有日志，模型只能靠项目事实回答，而项目事实记录的是决策，不是活动。

第五轨是大多数教程会跳过的一轨：技能自我进化。记忆插件可以学习自己的用法并适应。例如统计你使用 remember 命令的频率，发现你给项目事实的前缀总是固定格式，然后把这个格式反向建议给你。在 dsh-memory-evolve 里，这变成了真正的自我修改：插件发现可复现的模式后，会把自己学到的命令写回自己的 bundle。下面的最小版本里我只画了个草图，但你应该知道它的存在，因为它决定了你是静态的记事本，还是一个会进步的系统。

同样重要的是什么不该存。别存密钥。记忆库是磁盘上的纯 JSON 文件，你把 API key 放进去，等于把 API key 放进了纯 JSON 文件，一次 git push 之后它就在一个你可能不完全掌控的仓库里了。凭据交给密钥管理器，记忆只放决策、偏好和日志。别存整段对话。原始转写很占空间，会把有用事实挤出上下文，而且会话里大部分话都是过场。存提炼后的结论，不要存那二十分钟的争论过程。

### 记忆文件，落到实处

在写代码之前先看清存储长什么样。跑了几次会话之后，memory.json 大致是这样：

```json
{
  "user": {
    "name": "Lin",
    "timezone": "Asia/Shanghai",
    "defaultBranch": "main"
  },
  "global": [
    "deploys must pass the check linter",
    "changelog lives at docs/changelog.md"
  ],
  "projects": {
    "billing": [
      "billing talks to Postgres 16, not MySQL",
      "billing API versioning uses /v2/",
      "legacy billing service owned by Dana"
    ]
  },
  "daily": [
    "2026-08-14 billing: session opened",
    "2026-08-17 billing: session opened"
  ],
  "skills": {
    "rememberedPatterns": [
      "project facts usually start with the service name"
    ]
  }
}
```

这就是一个纯文件，而这是重点。你可以用编辑器打开它，改个拼写错误，删掉一条坏事实，插件下次会话读取的就是修正后的版本。五个轨道在这里体现为四个键，外加一个存放插件学到的使用模式的 skills 键。这个文件不需要数据库，不需要服务，不需要网络。它就是全部记忆，住在每次 apply 运行时插件都能摸到的地方。

维护这个文件有两条约定。键名跨会话保持稳定，插件永远不会因为某个字段改名而需要迁移数据。值用短句，不用段落。需要三句话的事实通常其实是两条事实，而两条事实更难注入、更难推理。

## 最小可用记忆插件，从零到一

开始动手。建一个 dsh-memory-mini 目录，把上一节的 package.json 放进去，再创建 index.ts，内容如下。插件只有两个职责。读侧在 apply 里加载已存事实并注入 system prompt，让模型带着这些信息开始会话。写侧监听一个叫 remember 的命令，把事实存进正确的轨道，再写回磁盘。这就是全部循环。跨会话记忆本质上就是这循环：按命令写，启动时读，周而复始。

```ts
// dsh-memory-mini: a cross-session memory plugin for dsh.
// 它只做两件事，不多不少：
//   1. 当你让它 remember 时，把事实写入 profile storage
//   2. 在下一次会话的 system prompt 中注入已存事实
//
// 跨会话记忆的全部技巧在于时机。apply() 在模型看到任何用户输入之前
// 运行，所以这里放进上下文的内容，就是模型起步时看到的内容。

import { join } from "path";

interface MemoryStore {
  user: Record<string, string>;          // 第一轨：你是谁
  global: string[];                     // 第二轨：处处为真的事实
  projects: Record<string, string[]>;   // 第三轨：按项目 slug 分组的事实
  daily: string[];                      // 第四轨：每个会话一行
}

const MEMO_HEADER = "## Persistent memory (managed by dsh-memory-mini)";

export function apply(ctx: any, config: Record<string, unknown> = {}) {
  const maxEntries = (config.maxEntries as number) || 50;

  // ctx.storage 是 profile 作用域的持久化句柄。通过它写入的所有内容
  // 都会落在 ~/.dsh/profiles/<profile>/ 下，并跨重启存活。
  const store: MemoryStore =
    ctx.storage.readJson<MemoryStore>("memory.json") || emptyStore();

  // ---- 写路径：remember 命令 -----------------------------------------
  //   remember <fact> for project <slug>   -> 项目轨道
  //   remember <fact>                      -> 全局轨道
  ctx.commands.define("remember", (args: string) => {
    if (!args.trim()) {
      return "Nothing to remember. Usage: remember <fact> [for project <slug>]";
    }
    const slug = /for project (\S+)/i.exec(args)?.[1]?.toLowerCase();
    if (slug) {
      store.projects[slug] = [...(store.projects[slug] || []), args.trim()];
    } else {
      store.global.push(args.trim());
    }
    ctx.storage.writeJson("memory.json", store);
    return `Saved. The store now has ${countFacts(store)} facts.`;
  });

  // ---- 读路径：注入 system prompt ------------------------------------
  // 这是记忆变得对模型可见的时刻。这里不做 patch，事实就只存在于磁盘，
  // 模型永远看不到，这是最常见的"我的插件什么都不干"的 bug。
  const block = buildBlock(store, maxEntries);
  if (block) {
    ctx.patchSystemPrompt(
      (prompt: string) => `${MEMO_HEADER}\n${block}\n\n${prompt}`
    );
  }

  // ---- 每日日志 --------------------------------------------------------
  // 每个会话一行，让未来的会话能回答"上周我们干了什么"，
  // 而这些内容它并没有亲眼见过。
  const today = new Date().toISOString().slice(0, 10);
  const project = ctx.project || "unspecified";
  store.daily.push(`${today} ${project}: session opened`);
  if (store.daily.length > 365) store.daily = store.daily.slice(-365);
  ctx.storage.writeJson("memory.json", store);

  return { commands: ["remember"], injected: Boolean(block) };
}

// 下面都是普通代码，没有 dsh API。

function emptyStore(): MemoryStore {
  return { user: {}, global: [], projects: {}, daily: [] };
}

function countFacts(store: MemoryStore): number {
  return (
    store.global.length +
    Object.values(store.projects).reduce((n, list) => n + list.length, 0) +
    store.daily.length
  );
}

function buildBlock(store: MemoryStore, maxEntries: number): string {
  const lines: string[] = [];

  const profile = Object.entries(store.user).map(([k, v]) => `- ${k}: ${v}`);
  if (profile.length) lines.push("USER PROFILE", ...profile);

  const globals = store.global.slice(-maxEntries).map((f) => `- ${f}`);
  if (globals.length) lines.push("GLOBAL FACTS", ...globals);

  for (const [slug, facts] of Object.entries(store.projects)) {
    lines.push(`[project: ${slug}]`);
    for (const f of facts.slice(-10)) lines.push(`- ${f}`);
  }

  const recentDays = store.daily.slice(-7).map((d) => `- ${d}`);
  if (recentDays.length) lines.push("RECENT SESSIONS", ...recentDays);

  return lines.join("\n");
}
```

按这个顺序读代码。先看 apply 的函数签名，那是 dsh 期望的契约。再看 ctx.storage.readJson，那是会话开头的读。再看 remember 命令，那是写。最后看 patchSystemPrompt，那是记忆真正到达模型的时刻。底部的每日日志是锦上添花，但它是让"上周"类问题可回答的最便宜方式，所以我保留了。

有一个不碰代码就能调整的设计点：config 对象。它是 apply 的第二个参数，dsh 会从插件声明的选项里读它。这就是你不改 index.ts、只改配置文件就能调 maxEntries 或关掉每日日志的方式。代码里的默认值是按 128k 窗口安全选的，只有当你在 token 一节学会测量注入块的真实开销之后，才值得调高。

几个值得说明的细节。remember 命令只对显式命令起作用，这个选择是有意的。隐式的、把模型每句话都存下来的钩子，一个下午就能把存储灌满噪音。显式 remember 让存储保持精挑细选，而精挑细选的存储才值得注入。

buildBlock 给每条轨道都设了上限。全局轨道截取最近 maxEntries 条，项目轨道各取最近十条，日志只取最近七天。这些上限存在，是因为注入块会消耗上下文窗口的 token。128k 窗口你当然可以挥霍很多，但"很多"不等于"无限"，无界的注入块迟早会把真正的对话挤出去。token 那一节我会再回来讲。

### remember 之外的命令：recall、forget 与周报

一个只会写和注入的 dsh memory plugin，只能算半个插件。它能存事实，却答不了关于自己存储的问题，也清理不了自己。两个命令补上这个缺口。recall 直接读存储并返回匹配的事实，模型不用半猜半记。forget 按内容删事实，是你不用打开编辑器就能修错条目的方式。

```ts
ctx.commands.define("recall", (query: string) => {
  const words = query.toLowerCase().split(/\W+/).filter(Boolean);
  const all = [
    ...store.global,
    ...Object.values(store.projects).flat(),
    ...Object.entries(store.user).map(([k, v]) => `${k}: ${v}`),
  ];
  const hits = all
    .filter((f) => words.some((w) => f.toLowerCase().includes(w)))
    .slice(0, 5);
  return hits.length ? hits.join("\n") : "No matching facts in memory.";
});

ctx.commands.define("forget", (content: string) => {
  const before = countFacts(store);
  store.global = store.global.filter((f) => !f.includes(content));
  for (const slug of Object.keys(store.projects)) {
    store.projects[slug] = store.projects[slug].filter((f) => !f.includes(content));
  }
  ctx.storage.writeJson("memory.json", store);
  return `Removed matching facts. Was ${before}, now ${countFacts(store)}.`;
});
```

recall 用的就是检索一节里的关键词过滤器。这不是巧合，是同一个道理出现了两次：记忆只有在模型需要的那一刻能找到正确事实才是有用的。forget 命令是安全阀。错误事实比没有事实更糟，因为基于过期记忆的自信答案，比一句诚实的"我不知道"更难发现。

周报我用的是一个定时命令，不是插件功能。每周一次，我让模型把每日日志压缩成一段，存成全局事实。原始日志仍是事实源，段落则为"最近发生了什么"提供便宜的答案。这就是 token 一节里老化思路的人类版，从代码搬到了人的层面。

接下来接线并测试。dsh 既可以从本地路径添加插件用于开发，也可以从 GitHub 仓库添加用于正式使用。两种形态如下：

```bash
# 把参考插件装进 web profile
dsh plugin --profile web add github:csyangwen/dsh-memory-evolve

# 从本地路径添加你的开发版插件（形态一致，只是来源不同）
dsh plugin --profile web add ./dsh-memory-mini
```

--profile web 告诉 dsh 装进哪个 profile，profile 名也会成为存储路径的一部分。跑任何一个会话之前，先确认插件真的注册成了 layer：

```bash
# 确认插件是 active layer，而不只是 dependency
dsh plugin --profile web list
```

list 命令会打印每个已装插件及其 layer 状态。如果你的插件列的是 dependency 而不是 patch layer，说明 package.json 声明写错了，再怎么跑会话测试也修不好。

layer 看着没问题之后，跑一个会话验证循环。第一个会话教一个事实，第二个会话验证模型还记得，再用一条文件命令确认插件确实写入了。

```bash
# 会话一：给插件一个事实
dsh run --profile web
> remember the billing service talks to Postgres 16, not MySQL

# 会话二：同一个 profile 的全新会话
dsh run --profile web
> which database does billing use?

# 查看插件实际持久化了什么
cat ~/.dsh/profiles/web/memory/memory.json
```

第一次运行，memory.json 还不存在。apply 创建存储，注入空块，写下第一行日志。第二次运行，注入块里带了 billing 事实，模型回答 Postgres 16。这就是整个功能。如果你看到 ~/.dsh/profiles/web/memory/memory.json 里确实有这条事实，模型还是答错，那说明注入没发生，文末的排错一节专门讲这种情况。

## 用 git 分支做归档与恢复

一个 memory.json 能用，而且能用很久。直到某天你误删了一条事实，或者一个项目被砍了但你希望它的决策被保存下来却又不在眼前，或者你想回答"上个季度我们对这事怎么看"。扁平文件给不了这些，git 全都能给，而且每台跑 dsh 的机器上都已经装了 git。

思路很简单。记忆目录本身就是 git 仓库。每次会话结束有改动，备份脚本提交一次。分支承载结构：每个项目一条分支，每天一条分支，外加一条承载当前状态的 main 分支。归档项目就是保留它的分支但不再合入 main。恢复上周就是检出那天的 day 分支。回答历史问题就是在旧分支上读事实，不碰现在。

下面是我每次记忆写入后跑的备份脚本。放在 ~/.dsh/scripts/memory-backup.sh 并加上执行权限。

```bash
#!/usr/bin/env bash
# memory-backup.sh: 把记忆库归档进 git，每个项目或每天一条分支。
# 会话结束后运行，或放进 cron。
set -euo pipefail

# 和插件用同样的方式解析记忆目录
MEM_DIR="${DSH_HOME:-$HOME/.dsh}/profiles/web/memory"
cd "$MEM_DIR"

# 首次运行需要仓库和 git 身份。没有身份，每次 commit 都会以
# "Please tell me who you are" 失败，归档会静默停摆。
if [ ! -d .git ]; then
  git init -q
  git config user.name "dsh-memory-mini"
  git config user.email "memory@local"
fi

# 给了项目名按项目建分支，否则按日期
PROJECT="${1:-}"
if [ -n "$PROJECT" ]; then
  BRANCH="project/$PROJECT"
else
  BRANCH="day/$(date +%F)"
fi

git checkout -q -B "$BRANCH"
git add -A
if git diff --cached --quiet; then
  echo "no changes, $BRANCH is already current"
else
  git commit -q -m "memory snapshot $(date -u +%FT%TZ)"
  echo "committed to $BRANCH"
fi
```

脚本在设置了 DSH_HOME 时读取它，否则回退到 ~/.dsh，和插件保持一致，两边对存储位置的认识不会打架。分支名要么是 project/<slug>（传了参数时），要么是 day/<日期>（没传时）。我在某个项目收尾后用项目 slug 跑它，午夜再让 cron 跑一遍纯日期形式。

恢复流程才是它值钱的地方。假设上周二你试过把 billing 换成 ClickHouse，放弃，又换回来。这个决定埋在 day/ 分支的日志里。用 git log --all --oneline 找到那次提交，检出分支，cat 那一时刻的 memory.json。当前工作记忆完全不受影响，因为你只是读旧分支，并没有把它合回 main。

```bash
# 找到你要的那天
cd ~/.dsh/profiles/web/memory
git log --all --oneline | head -20

# 读那天记忆库的原始状态
git show day/2026-08-11:memory.json | grep -i clickhouse

# 把当前状态恢复到最后一个已知正常的提交
git checkout -B main day/2026-08-11
```

git 身份那一行是每个人都撞过的墙。在新机器上 git 没有 user.name 和 user.email 就拒绝提交，脚本以 "Please tell me who you are" 失败。这个错误我跑了一整周才发现备份从没提交成功过。上面的脚本内置了本地身份，首次运行就能用。

对已经存在的存储做第一次备份，值得多走一步。如果你从几周前的会话开始就有一个 memory.json，别让第一次提交就是没有历史的整份文件。先在 main 上做一次初始提交，再从那里开项目分支和日期分支。这样就有了干净的基线，恢复流程也有了可回退的已知正常点。我还会在另一个目录保留第二个 clone，方便在会话写入的同时读历史，因为被锁的 git 索引和活跃会话会互相踩脚。

两个要提前防的失败模式。第一，别在这个仓库里放大二进制。记忆库是文本，一直很小。一旦你开始往里面塞截图、塞音频，仓库膨胀，每次 clone 都痛。归档只放文本，重资产放独立存储。第二，脚本用 git add -A 提交目录里所有东西。如果你把密钥文件放进同一目录，下次提交就把密钥写进 git 历史，而历史不会忘记。目录里只放 memory.json，密钥放别处。这和存储一节的规则是同一句，只是换了个 git 味的后果。

## 什么时候该升级到向量或 RAG

上面的插件诚实地承认了自己的上限。它按 maxEntries 注入每条轨道最近的事实，不做任何搜索。存储只有几十条时这没问题。存储涨到几千条就开始坏，因为两件事同时发生。注入块越来越大，直到吃掉上下文窗口。截断意味着模型只看到最新的事实，三个月前你需要的那条，被静默丢掉了。

账很好算。你的一条事实平均大约 150 token。注入五十条是 7500 token。注入五百条是 75000 token，哪怕在很大的窗口里也是实打实的一截，而如果模型只需要其中五条，这些全浪费了。当注入块经常超过你愿意花的量，你就越过了"检索优于注入"的门槛。

在伸手拿向量数据库之前，先试试最便宜的过滤器：关键词匹配。把存储过滤成与当前问题共享单词的事实，只注入这些。对大多数个人存储来说，这能拿到八成价值，基础设施成本为零。

```ts
// 关键词检索：最便宜的过滤器，胜过"全量注入"。
const query = "which database did we rule out for billing";
const words = query.toLowerCase().split(/\W+/).filter(Boolean);
const hits = facts
  .filter((f) => words.some((w) => f.toLowerCase().includes(w)))
  .slice(0, 5);
```

当关键词匹配开始漏掉人类一眼就判为相关的事实，下一步是小型的基于 embedding 的排序器。你不需要向量数据库。你需要的是词频编码加余弦相似度，两者几十行就能写完。

```ts
// 类向量检索，不需要向量数据库。把每条事实编码成词频 map，
// 再与查询做余弦相似度排序。
function encode(text: string): Map<string, number> {
  const tf = new Map<string, number>();
  for (const word of text.toLowerCase().split(/\W+/).filter(Boolean)) {
    tf.set(word, (tf.get(word) || 0) + 1);
  }
  return tf;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, na = 0, nb = 0;
  for (const [k, v] of a) { dot += v * (b.get(k) || 0); na += v * v; }
  for (const v of b.values()) nb += v * v;
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

const top = facts
  .map((f) => ({ f, score: cosine(encode(f), encode(query)) }))
  .sort((x, y) => y.score - x.score)
  .slice(0, 5);
```

这个排序器不是真正的 embedding。它不懂同义词，"Postgres" 和 "PostgreSQL" 会得零分。它是一座桥，而且对大多数存储来说是对的桥。只有当三个信号之一出现时，你才需要毕业到真正的向量存储或 RAG。团队知识库被多人共享，存储增长到单个注入块装不下。你的检索需要语义匹配而不只是关键词重合，因为事实用的词和问题用的词不一样。或者你需要对几万条事实做亚秒级搜索，上面的线性扫描已经不够快。

在伸手拿基础设施之前，还有一根杠杆：让数据老化。每日日志是增长最快的轨道，而其中大部分过一个月就没用了。与其每行都永久存着，不如把旧的日志折进月度摘要，把九十天前的原始行丢掉。摘要保留了"七月发生了什么"的答案，原始细节因为大部分已消失而很便宜。老化是检索的廉价表亲，几乎总是值得在加向量存储之前先做。

给你一句实话。只要还能用，就待在"扁平文件加关键词过滤器"上，对独立开发者来说这段时间很长。关键词过滤漏了再上 embedding。真正撞到规模或团队共享再上向量存储。每升一级都加基础设施和排错面，而模型根本分不清"完美的 RAG 管线"和"精心维护的 200 条存储"之间的区别。

## 真插件 dsh-memory-evolve 对照

你不必从零搭这一切。这个领域的参考实现是 csyangwen 的 dsh-memory-evolve。它大约 126 star，维护活跃，也是我的最小版本长出自己的体量之后指向的插件。安装方式和本地插件一样，只是来源换成仓库。

```bash
dsh plugin --profile web add github:csyangwen/dsh-memory-evolve
```

已发布的插件和本教程共用同一个五轨骨架：用户档案、全局事实、项目关键记忆、每日日志，外加我的最小版本只画了草图的第五轨，技能自我进化。区别在于 dsh-memory-evolve 认真对待了第五轨。当插件发现你反复使用同一个模式，它会把新命令写进自己的 bundle，插件随使用增长能力，而不是永远冻在安装时的版本。这跟记事本有本质区别，也是整个方向正在走的路。

它同样用上一节描述的 git 分支隔离，所以归档与恢复的故事和我们的同构。这应该让人安心。本教程里那些来之不易的设计决策不是我的发明，它们是成熟插件已经做过的决定，而我在撞了同样的墙之后独立地得出了同样的结论。

我会抄它的东西。自我进化轨，等你的存储稳定到插件有真实使用模式可学时再上。它把项目作用域记忆和全局记忆分开的做法，能防止共享 profile 把 A 项目的决策漏进 B 项目。我先会跳过的。整套语义层。从扁平文件和关键词过滤开始，等存储真的需要时再加花哨的检索。

评估一个记忆插件时，别只看功能清单。打开它产出的存储，问三个问题。事实是不是短而决策导向，还是囤积了转写？你能否不用删整份文件就修正一条错误条目？跑到第一百个会话，存储长大了，注入还受控吗？dsh-memory-evolve 三项都表现不错，这也是它保持约 126 star 而没有销声匿迹的部分原因。另一部分原因是它是一个你可以读的真实仓库，有许可证、有提交历史，当你打算依赖它时，这很重要。

## 常见坑与排错

插件很简单，但简单的插件也会以可预测的方式失败。以下是我踩过的，按它们消耗我时间的顺序。

插件装了但什么都不干。检查 package.json。带 bundle patch 声明的 "dsh" 键，是"已加载插件"和"active profile layer"的分界线。这个 bug 我花了一个晚上，修复方法是给一个我坚信正确的文件补三行。症状：dsh 正常启动，插件从不触发，任何地方都没有报错。

文件写了但模型答错。这是注入时机 bug。memory.json 证明写路径没问题，但 patchSystemPrompt 才是把事实放到模型面前的动作。跳过 patch，事实就只活在磁盘上，别处都没有。症状：cat 文件，事实在，模型仍然一无所知。修法：确认注入块出现在 system prompt 里，确认你的 patch 函数返回的字符串真的包含这个块。

存储落在错误的目录。这个很隐蔽。插件从 DSH_HOME 或 home 目录解析路径，profile 名来自 ctx.profile。如果你的 shell 把 DSH_HOME 设成一个值，脚本或 cron 设成另一个值，就会出现两个记忆库，它们静默地互相矛盾。早上的会话存进一个，cron 备份读另一个，事实"随机"消失。修法：开发期在 apply 里打印一次解析出的路径，确认循环里的每个工具都解析到同一路径。

DSH_HOME 设了但是错的。插件和备份脚本都读 DSH_HOME，所以变量里的一个拼写错误会让两者以同样的静默方式坏掉。我曾经在 shell 配置里把 DSH_HOME 设成带尾部斜杠的 ~/.dsh/，记忆目录解析出的路径带了双分隔符。大多数工具能容忍，链条里有一个不能，事实于是落进了没人读的目录。设置阶段让插件和脚本都打印解析后的路径，确认它们输出同一串字符。

权限错误。新机器上 ~/.dsh/profiles/web/memory 目录可能不存在，首次写入以 ENOENT 失败，除非插件先创建它。上面的代码用 mkdir recursive 创建了，如果你手写了一个假定目录已存在的版本，就会看到这个错。少见但真实：共享机器上 profile 目录可能归别人所有，路径正确但写入报 EACCES。

JSON 损坏。写入中途崩溃会让 memory.json 截断或畸形，下次启动 readJson 直接抛异常，可能拖垮整个会话。我的 load 函数把坏文件改名成带时间戳的备份再重新开始。丢一次会话的写入，好过插件拒绝启动丢掉所有会话。如果你的版本没做这个防护，在信任它上生产前先补上。

token 上限。注入块要算进上下文窗口，无界的存储迟早把对话挤出去。盯两个症状。模型开始截断自己的回复，这是窗口不够了。或者明明加了旧记忆却不再出现，这是 slice 截断在静默丢数据。修法是 buildBlock 里的上限，加上老实监控注入块到底花了多少 token。

并发写入。同一 profile 同时开两个会话，两边都读存储、都改、后写覆盖先写，输的一方的事实丢了。个人使用很少见。共享 profile 是真问题，修法是给读改写加锁文件，或者干脆告诉团队不要同时在同一个 profile 上跑两个会话。

git 身份未配置。备份脚本内置了本地身份，所以你只有改了脚本才会踩到。没有 user.name 和 user.email，每次 commit 都以 "Please tell me who you are" 失败，备份看着活着其实啥也没干。别只看脚本的退出码，偶尔跑一下 git log --all。

装进了错误的 profile。命令 dsh plugin --profile web add ... 把插件装进 web profile，但如果你跑 dsh run 时不带 --profile web，用的就是默认 profile，插件根本不加载。存储路径也跟着 profile 变，所以即使是正常工作的插件，你去看错 profile 的目录时也会看到空的记忆。安装命令、运行命令、你检查的路径，三处必须指向同一个 profile。

这些坑背后是同一个模式。一个"演示里能用"的插件，环境一变就坏，因为环境是最没人测试的部分。排错时分两头验证：先确认文件里有事实，再确认 prompt 里有块。两头都真而模型还错，问题就上移到模型本身，这时你就能做一个精确的讨论了，而不是瞎猜。

## 相关实例

如果这篇教程勾起了你的兴趣，接下来值得读的两个实现是 dsh-memory-evolve 和 openviking。前者是本文所有内容的参考，后者是探索持久记忆还能住在 Agent harness 哪里的姊妹项目。想要一个有人维护、有评审背书版的五轨思路，值得评估的评测插件是 csyangwen/dsh-memory-evolve，我在全文反复提到它。装上它，把它自我进化的行为和这里的最小插件对比，一个会话你就能看到一年的迭代在一条能跑的循环之上加了多少东西。
