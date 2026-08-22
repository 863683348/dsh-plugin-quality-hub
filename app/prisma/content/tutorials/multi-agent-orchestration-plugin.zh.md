# 多 Agent 编排插件：从单兵到小队

周五下午，任务看起来很简单。为某个有六家竞品的品类上线一张对比页。真实的定价、真实的特性列表、真实的评测口碑，每家竞品再配一页简短的草稿。我开了五个终端标签页。标签页一停在竞品 A 的定价页上。标签页二是竞品 B 的搜索结果页。我复制一段文字到草稿文件，切换标签页，再复制一段。四十分钟后，草稿文件变成一堆碎片，我已经分不清哪一行属于哪家公司。会话的上下文窗口里塞满了问了一半的提示词和过期的搜索结果。每次新提问都会收到接近上限的警告。我关掉所有东西，一家一家重新做了一遍。就是那天，我不再把单个会话当成处理并行任务的正解。

一个 DSH 会话能力很强，但它只是一个工人。它读文件、调工具、写答案，并且只持有一份对话上下文。当工作是若干彼此独立的任务时，单人会话只能被迫串行。你等一个答案，再开始下一个。那个能同时跑五路调研的并行能力，在单会话里不存在。多 Agent 编排插件把它补了回来。本文是完整拆解：你需要的三个概念、真正能跑起来的最小编排循环、用 DAG 建模任务依赖、按空闲度派活、可持久化团队与 Web UI 实时状态、断点续跑快照，以及一个从 0 到 1 的竞品并行调研插件。我也会讲什么时候应该拒绝用小队，因为成本是真实的。

## 单会话的天花板

在谈团队之前，先说清楚单会话做不到什么。三个限制最重要，它们也是所有编排插件存在的原因。

第一，上下文窗口有限。每一次搜索结果、每一个读过的文件、每一次工具返回，都会留在对话里，直到被压缩或丢弃。六家竞品的对比任务意味着六套定价数据、六张特性矩阵、六批评测引用。这些 token 会和你一直想记住的指令抢空间。实际表现就是会话开始激进地做摘要，你还需要的关键细节悄悄消失。我就是这样丢过一个价格档位的具体数字，重新问了一次，然后看着同一个数字再次被摘要掉。

第二，会话是串行的。一个回合里可以并行调工具，但产生答案的推理过程是串行的。会话读竞品 A，思考 A，写 A，然后才开始 B。如果任务真正独立，等待就是纯粹的浪费。五家竞品等于五倍墙钟时间，而墙钟时间是永远找不回来的东西。

第三，重启之后没有持久状态。关掉会话，计划就蒸发了。做到一半的调研只留给你一页草稿笔记，和对"还剩什么没查"的模糊记忆。当一个任务要跑一小时，第五十分钟崩溃的代价很高。你没法指着一个文件说"从这里继续"，因为根本没有这个文件。

这里有一个浓缩版的上下文丢失事故。我让一个单会话先记住十二个条目的价格表，同时我去写一个跟进问题。等我按下回车，会话已经把价格表摘要成六行，好给我的新问题腾地方。它保留下来的六行，恰恰不是我还需要的六行。这不是会话的 bug，是有限窗口在做它该做的事。而编排插件正是靠给每块工作一个独立的小窗口，绕开了这种物理限制。

编排插件同时攻击这三个限制。它把目标拆成小任务，让每个子 Agent 只持有很小一块上下文。它并行跑独立任务，因为子 Agent 是独立进程。它把计划、任务状态和结果持久化，崩溃不会让一切归零。后面几节讲具体机制，从你必须内化的三个名词开始。

## 三个核心概念：captain、sub-agent、scheduler

我在 DSH 生态里见过的每个多 Agent 设计，归根结底都是三个角色。学会这三个，剩下的都是管道。

captain 就是当前会话被升级之后的角色。当你运行一个调用 ctx.agent.spawn 的插件，你的会话就不再是普通工人，而是那个拥有完整计划的人。captain 负责拆解目标、决定每个子 Agent 干什么、最后收集结果。它不是比子 Agent 更聪明，而是唯一看到全局的人。参考插件 dsh-agent-teams 就是这样工作的：插件把会话升级成 captain，再交给它一支可以指挥的团队。

sub-agent 是由 captain 派生出来的工人。每个子 Agent 有一个角色和一条提示词。角色只是一个带期望的标签，比如"researcher"（收集事实、返回来源）、"writer"（把事实变成文章）或"reviewer"（检查错误）。子 Agent 看不到整个计划，它只看到自己的任务，跑完就回报。这是故意的。让子 Agent 的上下文保持小，才能让整次操作保持便宜。

scheduler 是共享调度器。它持有任务列表，知道哪些任务被哪些任务阻塞，决定下一个任务派给哪个子 Agent。最简设计里 captain 兼任 scheduler，因为循环足够短，一个进程就能跑完。重一点的设计，比如 dsh_workflow，会把调度状态写进文件，这样它能在崩溃后存活、能被事后检查。从"captain 兼任调度器"起步，需要续跑时再升级成文件化调度器。

角色还有一个用途：它是调度的键。调度器可以把任务派给角色匹配的成员，所以每个任务都带一个 role 字段。调研任务派给 researcher 成员，评审任务派给 reviewer 成员。如果你不给任务标角色，调度器就得猜，而猜的结果往往是 reviewer 比你希望的多干了很多调研活。

三者关系一句话就能记住：captain 拥有目标，sub-agent 拥有工作，scheduler 拥有分派。只要你能在插件里清楚画出这三条线，剩下的都是细节。

## 最小编排循环：拆解、派发、汇总

下面是最短的真实插件，把会话升级成 captain。它注册一个命令、派生一支持久化团队、打印团队 id。放到文件夹里，声明为 patch 层，DSH 就会把它当成激活的 profile 插件加载。

```ts
// index.ts
import type { DshContext } from "dsh";

export type SquadConfig = {
  roles: string[];
};

export function apply(ctx: DshContext, config: SquadConfig) {
  ctx.command("squad")
    .description("promote this session to captain and spawn a team")
    .option("--roles <roles>", "comma separated roles, e.g. researcher,writer,reviewer")
    .action(async ({ roles }) => {
      const roleList = roles.split(",").map((r) => r.trim());
      const team = await ctx.agent.spawn({
        roles: roleList,
        persistent: true,
      });
      ctx.ui.status(`you are the captain of team ${team.id} (${roleList.length} members)`);
      return team;
    });
}
```

插件契约永远是同一个形状。模块导出 apply(ctx, config)。ctx 给你命令、agent 工厂和 UI 工具。config 携带用户选项。要让这个模块被当成激活的 profile 层加载，package.json 必须声明 bundle patch。没有它，DSH 永远不会加载这个文件，你的命令根本不存在。

```json
{
  "name": "squad-starter",
  "version": "0.1.0",
  "dsh": {
    "bundle": {
      "patch": ["index.ts"]
    }
  }
}
```

按来源安装，然后在需要的 profile 里运行。

```sh
dsh plugin --profile web add github:owner/repo
```

在 DSH 里运行这个命令，你的会话就变成带团队 id 的 captain。这就是完整的升级步骤。有趣的部分是让团队装满工作的循环，它有三个阶段。

拆解。把目标变成一张扁平的任务表。每个任务带 id、角色、提示词、依赖列表。这个阶段没有任何任务跑起来，你只是在写计划。

派发。反复找"依赖全部满足"的任务，找一个空闲的子 Agent，交任务，标记为 running。没有空闲 Agent 就等。没有可运行任务就结束循环。

汇总。从每个已完成任务收集结果，按计划顺序重排，拼成最终答案。在对比页例子里，汇总就是六个 writer 任务写出六页文件。

循环跑在 captain 的进程里，这意味着团队干活时 captain 是忙的。短跑没问题。长跑你需要断点那节讲的文件化调度器，因为 captain 一旦崩溃，内存里的循环会跟着一起没掉。

循环还需要一条错误路径。子 Agent 返回失败时，任务状态变成 failed，所有依赖它的任务都以最坏的方式被解锁：它们永远不会就绪。跑之前先决定这意味着什么。最简版本里，一个失败任务取消它整棵子树，循环带着一份失败摘要退出。后面实战里，一份调研失败只取消那家竞品的 writer，其余页面照常写出。两种行为出自同一个循环，区别只是 nextRunnable 和最终汇总里怎么对待 failed。

这个循环小到能装进脑子。后面几节把每个阶段做实，先从大家最容易搞错的部分开始：依赖。

## 用 DAG 建模任务依赖

独立任务很容易。难点在于真实计划大多不是扁平的。调研必须赶在写作之前，写作必须赶在评审之前。这样建模出来的是一个有向无环图，DAG。节点是任务，边是"必须先完成"。一个任务只有在它指向的所有任务都完成之后才可运行。

插件用每个任务上的 dependencies 数组表达这一点。DSH 的 spawn 与调度层原生理解这个字段，所以参考设计直接使用它。

```ts
type TaskStatus = "pending" | "running" | "done" | "failed";

type Task = {
  id: string;
  role: string;
  prompt: string;
  dependencies: string[];
  status: TaskStatus;
  result?: string;
};

const tasks: Task[] = [
  { id: "research-a", role: "researcher", prompt: "collect pricing and features for competitor A", dependencies: [], status: "pending" },
  { id: "research-b", role: "researcher", prompt: "collect pricing and features for competitor B", dependencies: [], status: "pending" },
  { id: "write-a",   role: "writer",     prompt: "write the A section from the research",       dependencies: ["research-a"], status: "pending" },
  { id: "write-b",   role: "writer",     prompt: "write the B section from the research",       dependencies: ["research-b"], status: "pending" },
  { id: "review",    role: "reviewer",   prompt: "check both sections for errors and gaps",      dependencies: ["write-a", "write-b"], status: "pending" },
];

function isReady(task: Task): boolean {
  if (task.status !== "pending") return false;
  return task.dependencies.every((id) => {
    const dep = tasks.find((t) => t.id === id);
    return dep !== undefined && dep.status === "done";
  });
}

function nextRunnable(): Task | undefined {
  return tasks.find((t) => isReady(t));
}
```

DAG 有两个性质在实践中很重要。其一，它允许两个 researcher 同时跑，尽管它们后面的 writer 必须等待。上面的例子里，research-a 和 research-b 在第一个 tick 都是可运行的，调度器可以立刻同时派发。其二，图能逼你面对死锁。如果你写出了环，比如 write-a 依赖 review、review 又依赖 write-a，那么没有任何任务就绪，循环永远空转。我在小队插件里见过最常见的 bug 就是这个：手敲的依赖自己绕回自己。调试它非常痛苦，所以在拆解阶段就校验图。遍历每条边，跟踪每个 id，在派生任何一个子 Agent 之前遇到环就立刻失败。

## 按空闲度派活

有了可运行任务，还需要一个规则决定哪个子 Agent 接哪个任务。朴素规则"先到先得"感觉还行，直到某个成员成为瓶颈。参考实现真正用的规则是空闲优先：把下一个任务派给空闲时间最长的成员。

DSH 通过 team.idleMember() 暴露这个方法。它返回一个当前没有任何任务的成员，或者当所有人都在忙时返回 undefined。调度器循环长这样。

```ts
async function runUntilIdle(team: Team, tasks: Task[]) {
  while (true) {
    const task = nextRunnable();
    if (!task) {
      const failed = tasks.some((t) => t.status === "failed");
      const done = tasks.every((t) => t.status === "done");
      if (failed || done) break;
      await sleep(250); // everything is blocked, wait and re-check
      continue;
    }

    const member = team.idleMember();
    if (!member) {
      await sleep(250); // everyone is busy, wait for a free slot
      continue;
    }

    member.assign(task);
    task.status = "running";
  }
}
```

两个细节值得保留。四分之一秒的 sleep 防止 captain 在等待时空转 CPU，而它几乎不花成本，因为子 Agent 完成一个任务通常远不止 250 毫秒。另外，nextRunnable 每轮都重新求值，所以当一个成员还在干活时新解锁的任务，一旦出现就会被接走。这正是循环每次重新读图、而不是一次走完预排计划的原因。

为什么空闲优先而不是轮询？因为成员速度并不均匀。一个 reviewer 接了三个长评审任务，而旁边一个 writer 闲着，这就是调度失败。空闲优先把工作推给真正闲着的人，自动抹平了这种不均匀。在六家竞品的例子里，六个 researcher 同时开工，六个 writer 在各自调研落地后开工，没有成员空手看着别人排队。

paused 状态是取消的落点。一个任务失败时，调度器沿依赖图向前走，把所有传递依赖它的任务标记为 paused。被暂停的成员停止干活，但还留在团队里，所以你能在 UI 里看到计划被剪掉了哪一枝、哪些成员因此熄灯。我发过一版直接跳过失败任务、让后续任务照跑。writer 产出了引用不存在调研的页面，直到 reviewer 标记缺失来源我才发现。即便在最简循环里，传播取消也只有两行：标记失败任务，再遍历它的依赖者并标记为 paused。

## 可持久化团队与实时 Web UI

派生出来就忘掉的团队，会话一结束就丢了。persistent 标志改变了这一点。设为 persistent: true 之后，团队、成员及其状态都存储在会话之外。重新打开 DSH，团队还在，成员 id 不变，已完成任务的结果也都还在。captain 可以重新挂接，而不是重新派生一支新队伍把上下文全丢了。

持久化正是 Web UI 有意义的前提。DSH 会在界面里渲染正在运行的团队，每个成员显示三种状态之一：working、idle、paused。working 表示有任务在派发中。idle 表示成员就绪、等待派单。paused 表示成员被要求停下，通常是因为 captain 暂停了运行，或某个依赖失败连带取消了后续任务。

你在 UI 里看一次对比页运行就能看到：六个 researcher 同时亮起 working，随后一个个回到 idle，然后六个 writer 亮起，最后是一个 reviewer。你亲眼看见并行，而不是只信日志。这种可见性不是装饰。卡住的时候，状态会告诉你卡在哪：一个成员 working 超过十分钟是失控提示词的信号，一个成员在有待派任务时长期 idle，说明你的派发规则有 bug。

状态名还给了你一套调试词汇。你会用这些词写自己的日志，并且它们会和 UI 显示一致。保持一致。如果你的插件写 "busy" 而 UI 写 "working"，凌晨三点你会把自己搞晕。

## 断点续跑与不可变快照

持久化让团队在重启后存活，但它本身不保护你在一次长跑中途崩溃。参考插件 dsh_workflow 把调度层做得可检查、可恢复。这是你的运行变长时应该抄的设计。

核心思想是：对运行状态的所有修改都是一个事件，事件只追加、从不改写。dsh_workflow 每次运行维护两个文件：run.json 保存当前计划、任务列表和每个任务的最新状态。events.jsonl 是每次事件的追加式日志，每行一个 JSON 对象。因为事件只追加，你可以回放。因为 run.json 是快照，你总能看到运行在某个时刻站在哪里。

快照在特定意义上是不可变的：你绝不在原地修改旧快照。运行前进时，你写一份取代旧快照的新快照。旧文件原样留在磁盘上，可以和新文件做 diff，看到两次检查点之间到底改了什么。这让 workflow 可查看：工具能渲染任意索引处的快照，你看到的就是那个瞬间的真实状态，而不是经过插值的重建。

断点续跑几乎白捡地从这个设计里长出来。启动时，插件读最新快照，走一遍事件日志确认没有更新的东西，然后把每个 running 任务标记为 failed，理由是"interrupted by restart"。依赖这些 running 任务的 pending 任务保持 pending。captain 重新启动循环。崩溃前已完成的任务保留结果，不会重做。唯一的花费是崩溃时正在半途的任务，这比丢掉整次运行便宜多了。

这个失败模式我撞过一次。一个十二步工作流在第九步因为机器休眠崩了。没有快照的话，我会把十二步全部重跑、为整件事付两次钱。有了文件化调度器，九步已经不可变，只有正在跑的那步需要重做。那一次之后，任何超过五分钟的小队我都要求背后放一个文件。

events.jsonl 里的一行事件刻意做得很朴素。它带一个序号、一个时间戳、一个任务 id 和一次状态迁移，比如 {"seq": 41, "at": "2026-08-19T03:12:04Z", "task": "write-alpha", "from": "running", "to": "done"}。朴素是重点。朴素的格式容易回放、容易 grep、容易喂进两个快照之间的 diff。我想知道检查点十和检查点十一之间改了什么时，什么都不用记。读最新快照，读旧快照，diff 出的正是中间落地的那些事件。追加式日志和不可变快照是同一个故事的两种视图，两个都留，运行才在事后说得清。

## 实战：并行调研 N 家竞品、各写一页

把上面的拼起来。目标：一个插件，读一个竞品名的 JSON 文件，并行调研全部竞品，为每家写一页 markdown，落到输出目录。这正是开头的对比页任务，只是少了我的五终端噩梦。

先看输入规格。

```json
[
  { "slug": "alpha", "competitor": "Alpha Corp", "angle": "pricing tiers" },
  { "slug": "beta",  "competitor": "Beta Labs",  "angle": "feature matrix" },
  { "slug": "gamma", "competitor": "Gamma Soft", "angle": "review sentiment" }
]
```

然后是插件。它为每个规格项派生 researcher 和 writer，接好依赖，跑循环，写文件。

```ts
// research-squad/index.ts
import type { DshContext } from "dsh";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

type PageSpec = { slug: string; competitor: string; angle: string };

export function apply(ctx: DshContext, config: { outputDir?: string } = {}) {
  const out = config.outputDir ?? "squad-output";

  ctx.command("squad-research")
    .description("research N competitors in parallel, write one page each")
    .argument("<specPath>", "path to a JSON file listing the competitors")
    .action(async (specPath: string) => {
      const spec = JSON.parse(await readFile(specPath, "utf-8")) as PageSpec[];

      const team = await ctx.agent.spawn({
        roles: ["researcher", "writer"],
        persistent: true,
      });

      const tasks: Task[] = [];
      for (const item of spec) {
        tasks.push({
          id: `research-${item.slug}`,
          role: "researcher",
          prompt: `Find current, verifiable facts about ${item.competitor}, focused on ${item.angle}. Return bullet points with sources.`,
          dependencies: [],
          status: "pending",
        });
      }
      for (const item of spec) {
        tasks.push({
          id: `write-${item.slug}`,
          role: "writer",
          prompt: `Write a 400 word page for the slug "${item.slug}" about ${item.competitor}. Use only the linked research result. Practical tone, no filler.`,
          dependencies: [`research-${item.slug}`],
          status: "pending",
        });
      }

      await runUntilIdle(team, tasks);

      await mkdir(out, { recursive: true });
      for (const task of tasks) {
        if (task.role === "writer" && task.status === "done") {
          const slug = task.id.slice("write-".length);
          await writeFile(join(out, `${slug}.md`), task.result ?? "", "utf-8");
        }
      }
      ctx.ui.status(`wrote ${spec.length} pages to ${out}`);
    });
}
```

在 profile 里运行，然后对比周五那天的差别。

```sh
dsh plugin --profile web add github:owner/repo
dsh
> squad-research competitors.json
```

屏幕上一步步发生什么。三个 researcher 任务在第一个 tick 全部可运行，三个成员同时开工。每份调研落地，它对应的 writer 任务就变成可运行，被下一个空闲成员接走。writer 之间互不等待。三个写作任务全部完成，循环退出，输出目录出现，三份 markdown 躺在里面。总墙钟时间大约等于一次调研加一次写作，而不是三份之和。这就是全部意义。

roles 数组里有个微妙之处值得注意。我只声明了两个角色，researcher 和 writer。调度器把三个调研任务分给 researcher 成员，把三个写作任务分给 writer 成员。团队不会超过两名成员，所以如果第三个 researcher 任务出现时两个都忙，它就得等空位。对这个任务来说这个行为没问题。如果你需要真正的扇出，就按你想要的槽位数量派生成员，让 idleMember 在它们之间挑。

如果某家竞品的调研失败了呢？前面那节的循环来做决定。在 nextRunnable 里，失败的调研任务永远不会就绪，所以它的 writer 永远不会被派发。writer 保持 pending，循环等其余全部完成后退，汇总步骤只写到达 done 的 writer。失败的竞品没有页面，这很诚实：建立在坏调研上的页面比没有页面更糟。如果你想知道是哪家失败了，汇总循环应该同时收集失败任务并打印出来。我这个插件的第二版就加了这条，它把输出目录里的一个沉默缺口，变成了状态消息里一行看得见的文字。

## 什么时候别用多 Agent

每个编排插件都在宣传并行，没人宣传成本。对它诚实一点，因为选错很贵。

开销是第一笔成本。每个子 Agent 都是独立进程，有自己的上下文窗口、自己的工具访问、自己的启动时间。一个五成员的团队，即使任务再琐碎，大约也消耗单会话五倍的计算量。如果总工作量很小，比如一页内容或十分钟的调研，小队比直接做还慢。并行挣不回来派生的开销。我保留一条粗略规则：如果目标在一个会话里五分钟内能完成，就不要派生任何东西。

上下文是第二笔成本，而且反直觉。团队把上下文拆到成员身上，让每个成员保持小，但这个拆分不免费。captain 仍然要持有计划、任务列表和它汇总的所有结果。小队很大时，光是汇总结果就能填满 captain 的窗口，然后你又回到一开始想逃开的摘要问题。如果最终输出巨大，考虑把结果写进文件，让 captain 读摘要而不是在内存里全 holding。

确定性是第三笔成本。小队不是可复现的函数。子 Agent 以不确定的顺序运行，结果到达时间不同，同样的目标两次运行可能产出不同结果。探索性工作这样没问题，甚至更好。但需要逐字节一致的工作，比如进入构建流程的生成代码、必须原样过审的文案，小队就是错误的工具。要确定性就顺序执行、用固定提示词，或者让每个子 Agent 走同一个模板。

还有协作陷阱。团队让调试变难，因为故障可能藏在任何一个成员、调度器或 captain 里。单会话只在一个地方失败，你能在一份完整对话里读完全部来龙去脉。小队失败会把故事摊到多个进程和一个日志文件上。给流水线加小队之前，先问一句：并行的收益是否值得丢掉一条可读的完整轨迹。

盈亏平衡点可以量，不用猜。同一个任务单独跑一次、当小队跑一次，对比墙钟时间和 token 用量。数字会随任务和模型变化，但量过两三次之后，你就知道自己的阈值，比从文章里抄一条经验法则强。

## 常见坑与调试

下面这些是我真正撞过的模式，按撞到的顺序排列。

依赖成环。任务依赖自己，或依赖一个绕回来的任务。症状：循环永不结束，所有成员保持 idle，UI 显示一支小队无所事事地空转。修法：派发前校验图。遍历每条边，标记已访问任务，遇到重访就抛错。

不检查 idleMember。我写循环时用 team.idleMember() 并假设它总会返回一个人。当所有成员都在忙时它返回 undefined，对 undefined 调 .assign 会抛出 TypeError，而且这个错落在某个随机子 Agent 里。修法：检查 undefined，睡了再重试，就是上面派发循环的做法。

忘了 persistent。你派生团队、运行很长、之后想查看。没有 persistent: true，团队随会话一起没了，无法重新挂接。修法：把标志做成插件的默认值，而不是让用户记得的选项。你会忘掉这个标志的，我忘过。

captain 上下文膨胀。你把每个结果都以完整字符串汇总，captain 的窗口被填满。症状：captain 开始做摘要，后续任务引用到的结果已经被压缩。修法：把每个结果写文件，任务里只存路径，按需读取。

崩溃后的中断任务。你重启一次运行，所有在崩溃瞬间处于 running 的任务永远卡在 running，因为没有任何东西把它们标记为 done 或 failed。修法：启动时走一遍事件日志，把所有仍为 running 的任务标记为 failed，理由是 "interrupted by restart"，和 dsh_workflow 一样。

无超时的死成员。子 Agent 卡在某个坏工具调用上，调度器永远等一个空闲槽。症状：某个成员 working 的时间远超合理范围。修法：给任务设超时，超时触发时调度器收回该成员。

成员过多。每个竞品派生一个成员，听起来又并行又现代，直到你看账单。十个成员就是十个上下文窗口、十套工具栈、十份启动成本，而汇总结果还是全部落进一个 captain。即使墙钟没涨，算力账单也随小队一起涨。我把小队控制在工作需要的规模，通常每个繁忙阶段一个成员，剩下的交给 idleMember。再往上的扇出，就是上一节那些开销从理论变成现实的地方。

角色和提示词不匹配。一个返回整段文章而不是来源的 researcher，或一个不去读依赖、反而自己重新调研的 writer，症状都是提示词没写清楚输出契约。修法是在提示词里写明输出形状，比如实战里的 "return bullet points with sources"，结果不符就拒绝。我在这上面花的时间比任何调度器 bug 都多。

对我有效的调试顺序：先看 UI 状态，它告诉你谁在 working、谁在 idle。然后读事件日志（如果有），它按顺序告诉你实际发生了什么。再看失败任务的提示词，因为大多数小队 bug 是穿了一身调度外衣的提示词 bug。小队做的是你要求的事。问题在于你要求了什么。

## 相关实例与插件

如果你想研究真实实现而不是我的玩具示例，两个仓库值得读。

dsh-agent-teams 是 captain 模式的参考。作者把当前会话升级成 captain，用命名角色派生持久化子 Agent，通过共享调度器驱动它们，并在 Web UI 里渲染每个成员的 working/idle/paused 状态。它是本文这条循环最干净的演示，也是任何想写小队插件的人的自然起点。你可以在 NanmiCoder/dsh-agent-teams 里评测它。

dsh_workflow 往上走了一级。它把多 Agent 调度包装成一层可保存、可查看、可恢复的 Workflow。run.json 快照加追加式 events.jsonl 就是我讲断点那节的两个文件，不可变快照正是让断点续跑可信的东西。如果你的运行很长，或者老板要看进度，这个设计值得借鉴。它位于 icetomoyo/dsh_workflow。

从评测视角看，两个值得并排比较。dsh-agent-teams 展示了一支能干活的小队需要多么少的代码，dsh_workflow 展示了一旦需要恢复，你要加多少仪式感。两者之间你能看到从"升级一个会话"到"像流水线一样调度"的完整光谱。

这篇文章最诚实的总结是一句话。多 Agent 编排插件不会让 Agent 更聪明，它只是让它们并行、持久、可恢复。这已经足够把"五个终端的周五"变成一条命令。
