<!-- CONFIG -->

## 安装与配置 dsh-memory-evolve

我把这个插件装在了日常使用的 profile 上，而不是临时工作区。这个决定很重要，因为记忆插件一定会在某处落盘。运行安装命令之前，先想好状态存在哪里。

安装命令很短：

```
dsh plugin --profile web add github:csyangwen/dsh-memory-evolve
```

`--profile web` 指定你真正用 `dsh web` 启动的 profile。如果你主要用 TUI，就指向那个 profile。我两个 profile 都有，记忆插件分别装。插件不会跨 profile 同步，装在哪就要在哪用。

如果仓库发布了 tag，也可以锁版本：

```
dsh plugin --profile web add github:csyangwen/dsh-memory-evolve#v0.2.1
```

`#v0.2.1` 是分支或 tag 引用。dsh CLI 会先向远端解析再写入 profile。tag 不存在就报解析错误，什么都不写。我打错过一次，解决办法是 `dsh plugin ls` 确认没写入，再用正确 tag 重试。

为什么要锁版本？记忆插件每次会话都在写文件。如果新版本改了磁盘格式，老版本可能读不了新目录。锁版本是便宜的保险。代价是你得手动升版本才拿得到修复。

## 插件在磁盘上写什么

第一次会话结束后看工作区。插件会建一个记忆目录，典型布局：

```
.memory/
  user-profile.md
  global-facts/
    001-rust-version.md
    002-timezone.md
  projects/
    <当前仓库名>/
      key-memories.md
      project-log.md
      daily-log/
        2026-08-17.md
        2026-08-18.md
  skills/
    tailwind-patch-pitfall.md
```

实际路径可能不同，以你装的版本 README 为准。不要假设上面的树和未来版本一致。这是 issue 里最常见的困惑来源，所以我保存了一份 README 里画树的段落。

## 全局状态还是项目状态

最关键的配置决定是记忆根目录放哪。插件提供两种放法。

项目内记忆根目录把状态放在当前仓库里，跟着代码走，换机器克隆下来就有。缺点是用户档案和全局事实会复制到每个项目。

全局记忆根目录把用户档案、全局事实、技能放在一处，只有项目日志留在项目里。我用的就是这种。全局事实不会散落在十五个仓库里，用户档案不管打开哪个目录都在。

## 配置块

插件从 profile 配置读选项。在 dsh 里，插件配置在 profile JSON 的 plugins 键下。我用的块，去掉次要字段：

```json
{
  "plugins": {
    "memory-evolve": {
      "root": "~/.dsh/memory",
      "projectScope": "local",
      "tracks": {
        "userProfile": true,
        "globalFacts": true,
        "projectKeyMemory": true,
        "projectLog": true,
        "dailyLog": true
      },
      "gitIsolation": {
        "enabled": true,
        "branchPrefix": "mem",
        "autoCommit": true,
        "archiveThreshold": 200
      },
      "inject": {
        "maxTokens": 2400,
        "headOnly": true
      },
      "skills": {
        "selfEvolve": true,
        "maxFiles": 40
      }
    }
  }
}
```

每个字段都有默认值。不写整个块，插件用默认配置，这就是裸安装后的行为。上面的块只覆盖我在意的项。

`root` 指记忆库位置。`projectScope: local` 表示项目记忆留在项目目录内，全局根目录在别处也没关系。想全放一个树里就设 `global`。

`tracks` 控制五条记忆轨道的开关。我全开。如果觉得注入上下文太重，先关 `dailyLog`，它是最啰嗦的轨道。

## git 分支隔离

`gitIsolation` 是它和多数记忆工具不一样的地方。记忆库本身是个 git 仓库，按项目或日期开分支，当前会话只注入本分支的记忆。

`branchPrefix: "mem"` 时，在 `web-checkout` 项目里的会话读 `mem/web-checkout` 分支。日期变化时，每日日志切到 `mem/2026-08-19`。这样不同项目、不同日期的记忆不会混。

`archiveThreshold: 200` 是日志膨胀的临界点。分支提交数过 200，插件开归档分支并重置工作分支。归档分支还在，`git log` 能看到完整历史。恢复就是 checkout 回来。

`autoCommit: true` 让插件每次写入后提交。关掉的话分支隔离仍有效，但历史有缺口，回滚很乱。我保持开启。

## 注入预算

`inject` 控制进模型的记忆量。`maxTokens: 2400` 大概是我整块记忆的上限。别轻易调高。记忆每轮都前置，不只是第一轮，长对话里成本会叠加。

`headOnly: true` 只注入每条轨道最近几条。旧条目留在磁盘但不进上下文。这是新鲜度和 token 花费之间的取舍。目标不是永不遗忘，而是最近状态始终在场。

## 技能自我进化

`skills` 控制后台进化。`selfEvolve: true` 时，插件观察会话反复解决同类问题的模式。同类修复出现多次就草拟一个技能文件放进 `skills/`，并在会话里提议。你批准后，它进入后续注入的记忆。

`maxFiles: 40` 封顶技能目录。满了插件拒绝新建，直到你清理。我撞到过两次上限，两次都逼我做了一次有用的清理。

## 验证安装

装完先跑：

```
dsh plugin ls
```

确认输出里有插件名。再开一个会话随便聊一句，检查记忆目录是否生成。目录没出现，常见原因：profile 指错、配置键和插件注册名对不上、目标目录没权限。插件写不了会打警告，日志里会带路径。

再提一句 profile。把插件加进 `web` 却用默认 profile 启动，插件根本不加载，也没有报错。这个静默行为容易坑人，所以我在要用的那个 profile 里跑 `dsh plugin ls`。

## 最简起步配置

第一次试别抄我的完整块。从小开始：

```json
{
  "plugins": {
    "memory-evolve": {
      "root": "~/.dsh/memory"
    }
  }
}
```

这一个字段就够启用全部五条轨道、git 隔离和默认预算。先跑一周，读读生成的记忆文件，再调。多数调优字段解决的是跑久之后才出现的问题，比如记忆大到没法注入，或者技能文件累积比清理快。

## 每条轨道注入什么

调 token 预算前，先知道什么会进提示词。

用户档案轨道注入偏好：时区、语言、编辑器、提交信息写法。很短，通常一段。

全局事实轨道注入跨项目成立的事，比如团队用 pnpm 不用 npm，或者部署都在周五下午。每个事实一个小文件，注入最近几条的头部。

项目关键记忆轨道放找回成本高的决策：某个服务为什么在 feature flag 后面、staging 用的端口、迁移命名约定。我隔一周回仓库时最依赖这条。

项目日志按时间倒序记录项目里发生过什么，给会话一个近况感，不用重读完整历史。

每日日志最细，一天一个文件，会话过程中持续追加。也最吃 token，所以我说预算紧就先关它。

## 常见配置错误

issue 里反复出现三种。

第一，插件键拼错。配置键必须和插件注册名一致。写成 `memory` 而注册名是 `memory-evolve`，你的块会被静默忽略。`dsh plugin ls` 输出里有注册名，先看它。

第二，`root` 指向不存在的路径且 dsh 创建不了。Windows 上 `C:\dsh\memory` 要指向你有权限写的目录。创建不了，插件打警告并回退到内存存储，只存活一个会话。这个回退很容易漏看，因为没有明显报错。

第三，忘记分支隔离只在记忆库是 git 仓库时生效。目录不在 git 下，插件会在记忆根目录里自建仓库。这时项目里 `git branch` 看不到记忆分支，分支在 `root` 指向的记忆库里。找分支先去那里。

## 升级与回滚

出新版本时：

```
dsh plugin --profile web update memory-evolve
```

升级记忆插件前，我备份记忆根目录。记忆库不是带迁移的数据库，版本升级可能改文件名。备份是一条 tar 命令的事。回滚就是锁旧 tag 重装：

```
dsh plugin --profile web add github:csyangwen/dsh-memory-evolve#v0.2.1
```

因为记忆文件是纯 Markdown 且是 git 仓库，数据本身很少丢。风险在读的那一侧变了形状。所以我的规则很简单：升级前备份，升级后验证，旧 tag 常备。

<!-- CODE -->

## 追踪代码路径

插件的核心并不华丽。它只是薄薄一层，包着两样东西：一个 Markdown 文件目录，和一个包住这个目录的 git 仓库。其余全是调度和 token 预算。这份简单正是我觉得它可信、且项目需要定制时好改的原因。

读代码前先说一句。dsh 插件迭代很快，不同版本里钩子名不一样。我装的是较新构建，下面的名字和我在跑的版本一致。如果你的不一样，以你版本 README 为准。这里重要的是结构，不是每个钩子的具体字符串。

## 入口

dsh 首先检查 package.json。没有 `dsh` bundle 声明，插件就只是个永远不会被加载的 Node 模块。文件长这样：

```json
{
  "name": "dsh-memory-evolve",
  "version": "0.2.1",
  "main": "index.ts",
  "dsh": {
    "bundle": {
      "patch": ["index.ts"]
    }
  }
}
```

`patch` 数组告诉 harness 哪些文件属于插件 bundle。跑 `dsh plugin add` 时，harness 读这个声明，把插件接进会话生命周期。这块缺失或格式错误，`dsh plugin ls` 可能仍然列出这个包，但 apply 函数永远不执行。这个静默失败值得记住：插件"装了"却什么都不做，多半是这里。

## 读配置、打开存储

apply 收到的是 profile 里解析好的配置。harness 在调用 apply 之前，会把你 JSON 块和默认值合并，所以你在里面拿到的 config 已经是完整的。插件的任务是校验它，不是发明默认值。

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const DEFAULTS = {
  root: "~/.dsh/memory",
  tracks: {
    userProfile: true,
    globalFacts: true,
    projectKeyMemory: true,
    projectLog: true,
    dailyLog: true,
  },
  inject: { maxTokens: 2400, headOnly: true },
  git: { enabled: true, branchPrefix: "mem", autoCommit: true },
};

export default async function apply(ctx: Ctx, cfg: MemoryEvolveConfig) {
  const config = deepMerge(DEFAULTS, cfg);
  const root = expandHome(config.root);
  await fs.mkdir(root, { recursive: true });
  await ensureGitRepo(root);
  ctx.on("session:create", (session) => onSessionCreate(ctx, session, root, config));
  ctx.on("message:complete", (session, message) =>
    onMessageComplete(ctx, session, message, root, config)
  );
}
```

进入任何会话逻辑前有两件事。第一，记忆根目录不存在就创建。第二，根目录还不是 git 仓库就初始化。那个 `ensureGitRepo` 调用是分支隔离能成立的前提，所以它只在加载时跑一次，而不是每条消息跑。

钩子注册值得停一下。`session:create` 在新会话开始时触发，读路径在这里。`message:complete` 在每条消息完成后触发，写路径在这里。两条路径分开，每条都好单独测试。

## 写路径

写记忆是碰磁盘最频繁的部分，所以要便宜、要幂等。插件不重写整个文件，而是追加行，结构变了才改名。

```ts
async function onMessageComplete(ctx, session, message, root, config) {
  const facts = extractFacts(message);
  const project = session.project || "scratch";

  for (const fact of facts) {
    if (fact.kind === "project") {
      await writeProjectFact(root, project, fact);
    } else if (fact.kind === "global") {
      await writeGlobalFact(root, fact);
    }
  }

  await appendDailyLog(root, project, summarize(message));
  await maybeEvolveSkill(ctx, root, session, message, config);

  if (config.git.autoCommit) {
    await commitMemory(root, project);
  }
}
```

`extractFacts` 是唯一不薄的部分。判断什么算值得持久化的事实，是语言模型的判断，插件会对消息跑一个小的分类。最简形式是找陈述模式：偏好、决策、约束。我跑的这个实现很保守，所以误报少。会有几条事实被漏掉，但不会灌进一堆垃圾条目。

`writeProjectFact` 追加到项目的 key-memories 文件。`writeGlobalFact` 给每个全局事实写一个小文件，因为全局事实少，每条值得独立成文件方便手改。每日日志追加是无条件的，每条完成的消息一行摘要。

## 分支隔离

提交这一步是 git 干重活的地方。插件确保当前项目分支存在，checkout 过去，暂存记忆文件，然后提交。

```ts
async function commitMemory(root: string, project: string) {
  const branch = `mem/${sanitize(project)}`;
  const cwd = root;

  await exec("git", ["checkout", "-B", branch], { cwd });
  await exec("git", ["add", "-A"], { cwd });

  const result = await exec("git", ["diff", "--cached", "--quiet"], { cwd });
  if (result.code !== 0) {
    await exec("git", ["commit", "-m", `memory update for ${project}`], { cwd });
  }
}
```

`checkout -B` 这种形式，分支不存在就建，存在就重置。分支名从项目名派生，所以同一项目的会话落在同一分支。不同项目的会话永远看不到彼此的记忆，这正是隔离的意义。

`git diff --cached --quiet` 检查避免空提交。没变化还提交会污染历史，还会误触归档逻辑。这个守卫很小，作用比看起来大。

每日日志分支同理，只是分支名里放日期而不是项目名。日期翻转，新分支出现，前一天的文件留在自己的分支上不动。

## 读路径

会话开始时，插件读取适用于当前会话的分支，然后在 token 预算内组装记忆块。

```ts
async function onSessionCreate(ctx, session, root, config) {
  const project = session.project || "scratch";
  const branch = `mem/${sanitize(project)}`;

  const [user, facts, keys, projectLog, daily] = await Promise.all([
    readHead(root, "user-profile.md", config.inject.maxTokens),
    readGlobalFacts(root, config.inject.maxTokens),
    readFileFromBranch(root, branch, "projects/keys.md", config.inject.maxTokens),
    readFileFromBranch(root, branch, "projects/log.md", config.inject.maxTokens),
    readTodaysLog(root, branch, config.inject.maxTokens),
  ]);

  const block = composeMemoryBlock({ user, facts, keys, projectLog, daily });
  ctx.attachMemory(block, { maxTokens: config.inject.maxTokens });
}
```

`readHead` 只读每个文件的开头，这就是 `headOnly` 行为。每日日志读取器只打开当天日期那个文件，不是整个分支。这些读取是并行的，彼此没有依赖，而且每条读取有自己的 token 上限，单条轨道挤不掉其他轨道。

`composeMemoryBlock` 把五条轨道组装成一个有序 Markdown 块。顺序是刻意的。用户档案在前，全局事实第二，然后是项目记忆，最后是日志。用户档案是最稳定的信号，所以放最前。每日日志最吵，所以放最后，提供细节而不淹没信号。

## 技能自我进化

进化功能是一个计数器加一个提议。插件观察重复的解决模式，模式跨过阈值就草拟技能文件。

```ts
const patternCounts = new Map<string, number>();

async function maybeEvolveSkill(ctx, root, session, message, config) {
  if (!config.skills.selfEvolve) return;

  const signature = classifyProblem(message);
  if (!signature) return;

  const count = (patternCounts.get(signature) || 0) + 1;
  patternCounts.set(signature, count);
  if (count < 3) return;

  const skillFile = path.join(root, "skills", `${signature}.md`);
  if (await exists(skillFile)) return;

  const draft = buildSkillDraft(signature, session, message);
  ctx.proposeSkill(draft, {
    summary: `A pattern for "${signature}" showed up ${count} times.`,
  });
}
```

计数器活在内存里，不在磁盘上。这意味着 harness 重启它就清零，没关系，因为阈值是三，而三次通常发生在同一个会话内。`ctx.proposeSkill` 把草稿摆出来让你批准。没有这个批准，skills 目录里什么都不会写，所以这个功能不可能悄悄塞满一堆半成品技能。

这个设计回答了谁决定什么成为技能。插件决定模式何时重复，用户决定它值不值得留。我觉得这个分工合理。全自动的写手只会产出自信的废话。

## 归档逻辑

分支跨过归档阈值，插件就轮换它。轮换让工作分支保持小，同时保留历史。

```ts
async function maybeArchive(root: string, project: string, threshold: number) {
  const branch = `mem/${sanitize(project)}`;
  const { stdout } = await exec("git", ["rev-list", "--count", branch], { cwd: root });
  const commits = parseInt(stdout.trim(), 10);
  if (commits < threshold) return;

  const archiveBranch = `${branch}-archive-${Date.now()}`;
  await exec("git", ["branch", archiveBranch, branch], { cwd: root });
  await exec("git", ["checkout", "-B", branch, "--orphan"], { cwd: root });
  await exec("git", ["rm", "-r", "--cached", "."], { cwd: root });
  await exec("git", ["commit", "-m", "archive rotation"], { cwd: root, ignoreErrors: true });
}
```

轮换先从当前分支做一个快照分支，再把工作分支重置成一个没有父提交的孤儿分支。历史留在归档分支上，工作分支重新开始。这就是 `archiveThreshold` 配置背后的机制。

孤儿重置是那种让评审者紧张的操作，因为它看起来有破坏性。其实没有，只要归档分支先建好。顺序很重要，代码不会自己重排，所以这个守卫是结构性的。

## 错误处理与回退存储

插件的错误处理刻意平淡。每条写操作都包起来，一条轨道失败不会杀掉整个会话。

```ts
async function safeWrite(fn: () => Promise<void>, ctx: Ctx, label: string) {
  try {
    await fn();
  } catch (err) {
    ctx.log.warn(`memory write failed (${label}): ${err.message}`);
  }
}
```

记忆根目录写不了时，插件回退到内存存储。回退意味着会话还能工作，只是结束后全忘。警告行是唯一信号，而且带 label，看到"会话跑完了但什么都没记住"时定位很快。

跑了这个插件一阵之后，我对记忆插件有一条规则：绝不让持久层拖垮会话。丢一次记忆写入很便宜。因为一次文件追加抛异常而丢掉整个对话，不便宜。这个插件把这条取舍做对了。

## 两个会话同时跑

记忆插件会引出个自然的问题：同时开两个会话处理同一项目会怎样？我试过，答案是大致没问题，但有一个坑。

每个会话都往同一个每日日志文件追加，提交到同一分支。提交那侧由 git 正常机制处理，插件不加锁。实际写入又小又快，冲突很少。坑在每日日志。两个会话并发追加可能交错行，因为追加在文件层面是读改写，不是原子操作。结果就是每日日志里两边的行交替出现。读起来怪，但什么都没丢。

如果你并行跑很多会话，考虑给每个会话独立的项目名，或者用 `projectScope` 全局选项把项目记忆集中到一个共享树。那也不解决交错，但把清理工作集中到一处。单人交互式用 dsh，这从来不是实际问题。

## 为什么用 Markdown 和 git 而不是 JSON

存储格式选纯 Markdown 看起来没野心，这正是它的长处。JSON 数据库会给插件严格结构和快查询，也会让 schema 一变所有旧文件不可读，还会把数据藏在一个编辑器里打不开的查询 API 后面。

Markdown 文件可检视。我想知道插件认为我的全局事实是什么，打开文件就行。记忆看着不对，我手改，下一次会话读我的改动。不用走迁移工具的弯路。git 层再提供历史、回滚，以及让多项目使用变正常的分支隔离。两个各自无聊的简单技术，组合成一个好信任、好修的体系。

这个组合正是插件能当教学锚点的原因。数据从不隐藏，行为就从不神秘。

## 测试行为

因为存储是纯 Markdown 加 git，你完全可以不用模型就测插件。建一个会话，发一条带明确项目决策的消息，然后用普通 git 命令检查记忆仓库：

```
git -C ~/.dsh/memory branch --list
git -C ~/.dsh/memory log --oneline -5
```

分支列表显示隔离是否产出了预期分支。日志显示提交是否落在正确分支、空提交守卫是否生效。读生成的 Markdown 文件，能看出分类是否写对了东西。这比多数插件代码的调试体验好得多，直接归功于选文件加 git 而不是二进制数据库。

<!-- HIGHLIGHTS -->

## 它凭什么拿高分

我评记忆插件，看的是用一个月之后的表现，不是第一次安装的观感。第一天惊艳、第三十天烦人的插件不是好插件。按这个标准，dsh-memory-evolve 拿高分，而且理由大多是架构层面的。

- 跨会话连续性是真实有效的。这是头号卖点，也是它存在的理由。周一开个会话告诉 agent staging 端口是 8080。周三新开会话问部署的事，答案直接出来，不用你重讲背景。我亲自验证过这条流程，事实确认的那一刻，记忆文件就落在项目关键记忆里。我试过的大多数"长期记忆"工具都在这里栽跟头，要么激进摘要，要么存原始对话。这个插件存决策，这才是你之后真正需要的。

- 五轨拆分胜过单一文件。很多记忆插件就是一个文件，什么都往里追加。结果是从有用变成噪音。这里用户档案、全局事实、项目关键记忆、项目日志、每日日志各自独立，按固定顺序注入，各有各的 token 上限。你的时区这种事实不会和项目决策抢同一个预算。我调注入预算时，按轨道调让我能缩掉吵的每日日志而不碰项目关键记忆。这个粒度不是装饰，是好用的记忆和只是吃 token 的记忆之间的差别。

- git 分支隔离是正确的隔离模型。记忆天然是多上下文的。web checkout 上的工作和 billing 服务上的工作不是一回事，混在一起两边都坏。按项目开分支意味着每个项目只读自己的分支。按日期开分支让每日日志不互相渗透。混合工作一周后我看分支列表，命名干净到可以直接导航。`mem/web-checkout`、`mem/billing-service`、`mem/2026-08-19`。没有一条串线。

- 归档和恢复不丢数据。任何记忆系统不管它，都会无限膨胀。阈值归档在分支变得难以驾驭前轮换它，历史保留在带名字的归档分支里。恢复就是一次 git checkout。我临时调低阈值测过轮换路径，孤儿重置如 README 所说。工作分支保持小，历史保持可达。对声称是长期记忆的工具来说，这是必备功能，而且用的是最简单可行的工具。

- 技能自我进化是受控的，不是全自动的。这是让进化功能安全的细节。插件数重复的问题签名，到阈值就提议技能草稿等批准。没有你的确认，skills 目录里一个字都不会写。我亲眼看过它在一个会话里第三种同类修复出现后提议草稿，内容是对已发生事情合理的概括。批准闸门意味着这个功能不可能悄悄塞满自信的废话。在自动化通常是卖点的插件生态里，这份克制很少见。

- 整个存储就是纯 Markdown 加 git。我反复回到这一点，因为它是大多数其他长处的来源。记忆可读、可手改、有版本。记忆错了，我改文件。想知道插件相信什么，我读文件。没有要查询的数据库，没有要打的导出格式。调试回路很短，README 的树和我磁盘上看到的一致。

- 日常使用配置很小。完整配置块看着长，但最简安装就一个 JSON 字段，根路径。其他都有对交互使用合理的默认值。我用最简配置跑了一周才开始调，默认值不丢人。这对采用很重要，二十个字段的记忆插件根本没人会配。

- 失败优雅降级。记忆根目录写不了时，插件打警告并回退到内存存储。会话继续工作，用户通过日志行而不是崩溃得知情况。对一个本职工作就是持久化的插件，持久化失败时不拖垮会话是正确的优先级。我在新机器上见过一次回退触发，权限问题，会话照常跑完。唯一代价是记忆没留下，这是可以接受的取舍。

- token 预算明确可调。记忆每轮都前置，成本会叠加。`maxTokens` 上限和 `headOnly` 行为给了"记忆要花多少钱"一个具体答案。我在一个繁忙会话上量过 headOnly 开和关的差别，节省是真实的，长对话里上千 token。明确的预算是"留着的记忆插件"和"第一笔大账单后就卸载"之间的分界线。

- 好的教学锚点。插件的简单让它成为本站记忆教程轨道的天然参考。每个机制都能用一个文件、一条 git 命令演示。没有需要信仰的魔法层。对靠例子教学的站点，这价值很大，这也是它在本分类里受关注的原因。

不是每一点都是加分项，只夸会亏待这篇评测。

- 每日日志在并发会话下会交错。两个会话同时往同一个文件追加，可能产生交替的行。读起来怪，需要手动清理。单用户交互式使用从没碰到，但并行工作流下是真实的边界。

- 分类刻意保守。提取模式严格，插件会漏掉本可以记住的事实。我就这样漏过几条想记的。这个取舍是有意的，我宁可漏事实也不要垃圾事实，但期望完美之前得知道。

- 即使有上限，token 成本也是真的。长项目里注入块涨向上限，每一轮都在付钱。上限保证有界，但"有界"不是"免费"。预算紧张的团队应该量一量实际花费。

- 分支名带项目名，两个仓库同名会撞。sanitize 步骤保证了路径安全，但不同目录下两个都叫 `main` 的仓库会产生同名分支，共享记忆。显式命名项目能避开这个意外。

## 分维度打分

本站按六个维度给插件打分。这个插件每一项的落点，以及理由。

- 连续性：9/10。决策跨会话持久，五轨拆分让它们可找。扣分是保守分类器会漏掉一些事实。
- 隔离性：9/10。按项目、按日期开分支，实践里分离干净。扣分是两个仓库同名会撞的边界情况。
- 进化性：7/10。自我进化功能扎实且安全受控，但停在后台。插件提议，你批准，产出的技能就是简单文本。没有评估回路去量一个技能是否真的改善了结果。机制诚实，收益未证明。
- 可检视性：10/10。这是整套里最高分，也是它能当好教学工具的原因。记忆的每个字节都是 git 下的可读 Markdown 文件。没有需要信仰的东西。
- 效率：7/10。token 预算明确可调，这是好的。长会话里每轮成本仍会涨，并发写会交错。单人用很好，共享重度用平庸。
- 配置简洁：8/10。一个字段起步，默认值合理，需要时才调。扣分是完整选项面在你意识到大部分有默认值、根本不用碰之前，看着吓人。

总评是它目标场景里的顶级记忆插件，而且计分卡把边界显出来而不是藏起来。

## 恢复流程实操

归档是记忆插件证明自己认真的地方。项目记忆被轮换后，需要旧分支里的东西时，具体流程如下。

先列出存在什么：

```
git -C ~/.dsh/memory branch --list "mem/web-checkout*"
```

这显示工作分支和旁边的归档分支。轮换触发时，归档分支带时间戳命名，所以输出类似 `mem/web-checkout` 和 `mem/web-checkout-archive-1724...`。要检查归档记忆，在记忆仓库里 checkout 归档分支再读文件：

```
git -C ~/.dsh/memory checkout mem/web-checkout-archive-1724...
cat ~/.dsh/memory/projects/log.md
```

拿到要的东西后，切回工作分支。我倾向于先把需要的行复制出来再切回，因为切换分支会改变插件注入的内容，我不想要一次乱 checkout 改了线上记忆。这是个很小的习惯，它恰好救过我一次：我留了个归档分支 checkout 过夜，第二天会话注入了旧日志。

## 一个月的使用教会我什么

写这篇拆解前，我把这个插件用在了个人和项目混合的工作上，大约一个月，有几个观察印象深刻。

技能目录撞到过一次上限，40 个文件。意外的不是增长，是其中有多少真正有用。大多数字技能是小的、一段话的、关于某个反复出现修复的笔记，注入成一小块，省下真实的重复解释时间。撞上限时的清理反正也该做了，所以上限更多是维护信号，不是限制。

归档轮换在最忙的项目上，在几周的高强度每日工作后触发。轮换本身不可见，这是正确的行为。项目继续跑，旧历史离一个 checkout 的距离。

每日日志是我在 token 受限时会最先关的轨道。它每 token 携带的可复用信号最少，关掉对连续性几乎零损失。其他都配得上自己的位置。

总体维护开销接近零。升级前一次备份，觉得不对时扫一眼分支列表，偶尔清理技能。对一个托着你跨周上下文的插件，这是非常轻的成本。

底线：这个插件不炫，最好的特性都是无聊的。可靠的持久化、干净的隔离、有界的成本、优雅的失败。按本评分体系，这些加起来是单人和小团队场景的顶级记忆插件，前提是它不是为高并发共享部署设计的。这个边界合理，说出来也诚实。
