# Multi-Agent Orchestration Plugin: From Solo to Squad

The job looked simple on a Friday afternoon. Ship a comparison page for a category with six competitors. Real pricing, real feature lists, real review sentiment, and one short draft page per competitor. I opened five terminal tabs. Tab one pointed at competitor A's pricing page. Tab two was a search result page for competitor B. I copied a paragraph into a scratch note, switched tabs, copied another. Forty minutes later the note file was a pile of fragments and I could not tell which line belonged to which company. My session's context window was full of half-asked prompts and stale search results. Every new question came with a warning that I was close to the limit. I closed everything and did the work one competitor at a time, again. That was the day I stopped treating one session as the right tool for parallel work.

A single DSH session is a strong agent, but it is one worker. It reads files, it calls tools, it writes answers, and it holds exactly one conversation of context. When the work is a list of independent jobs, a solo session serializes them by force. You wait for one answer, then you start the next one. The part of your brain that can run five investigations at once does not exist inside one session. A multi-agent orchestration plugin adds it back. This article is the full walkthrough: the three concepts you need, the minimal loop that actually runs, task dependencies as a DAG, idle-based dispatch, persistent teams with a live Web UI, crash-resume snapshots, and a complete competitor-research example from zero to running. I also cover when you should refuse to use a squad, because the cost is real.

## The ceiling of a single session

Before we talk about teams, be precise about what a solo session cannot do. Three limits matter, and they are the reasons any orchestration plugin exists.

First, the context window is finite. Every search result, every file you read, every tool response stays in the conversation until it is summarized or dropped. A comparison task for six competitors means six sets of pricing data, six feature matrices, six batches of review quotes. That is a lot of tokens, and they compete with the instructions you are trying to keep in mind. In practice the session starts summarizing aggressively, and details you still need quietly disappear. I have lost the exact number of a pricing tier this way, then re-asked, then watched the same number get summarized away again.

Second, the session is sequential. You can run tools in parallel within one turn, but the reasoning that produces answers is serial. The session reads competitor A, thinks about A, writes about A, then starts on B. If a task is truly independent, waiting is pure waste. Five competitors means five times the wall-clock time, and wall-clock time is the thing you can never get back.

Third, there is no durable state across restarts. Close the session and the plan evaporates. A half-finished investigation leaves you with the scratch note and a vague memory of what still needed checking. When a task takes an hour, a crash at minute fifty is expensive. You cannot point at a file and say "resume from here" because there is no file.

Here is the context-loss failure in miniature. I asked a solo session to hold a price list of twelve items while I composed a follow-up question. By the time I pressed enter, the session had summarized the list down to six rows to make room for my new question. The six rows it kept were not the six I still needed. This is not a bug in the session. It is the physics of a finite window doing its job, and it is exactly the physics an orchestration plugin sidesteps by giving each piece of the work its own small window.

An orchestration plugin attacks all three at once. It splits the goal into small tasks so each sub-agent holds a small slice of context. It runs independent tasks in parallel because the sub-agents are separate processes. It persists the plan, the task states, and the results so a crash does not reset everything. The rest of this article shows the mechanics, starting with the three nouns you have to internalize.

## Three concepts: captain, sub-agent, scheduler

Every multi-agent design I have seen in the DSH ecosystem boils down to three roles. Learn these three and everything else is plumbing.

The captain is the current session, promoted. When you run a plugin that calls ctx.agent.spawn, your session stops being an ordinary worker and becomes the one who owns the plan. The captain decomposes the goal, decides what each sub-agent should do, and collects the results at the end. It is not smarter than the sub-agents. It is the only one with the full picture. The reference plugin dsh-agent-teams works exactly this way: the plugin turns the session into a captain and hands it a team to command.

The sub-agent is a worker spawned by the captain. Each one gets a role and a single prompt. A role is just a label with an expectation attached, for example "researcher" (gather facts, return sources) or "writer" (turn facts into prose) or "reviewer" (check for errors). The sub-agent does not see the whole plan. It sees its own task, runs until done, and reports back. This is deliberate. Keeping the sub-agent's context small is what keeps the whole operation cheap.

The scheduler is the shared dispatcher. It holds the list of tasks, knows which tasks are blocked on other tasks, and decides which sub-agent gets which job next. In the minimal design the captain is also the scheduler, because the loop is short enough that one process can run it. In heavier designs, like dsh_workflow, the scheduling state is pushed into files so it survives crashes and can be inspected later. Start with the captain-as-scheduler, graduate to a file-backed scheduler when you need resume.

One more thing about roles: they are also a scheduling key. The scheduler can match a task to a member whose role matches the task's role, which is why every task carries a role field. A research task goes to a researcher member, a review task goes to a reviewer member. If you leave the role off a task, the scheduler has to guess, and guessing means the reviewer ends up doing research more often than you would like.

The relation between the three is easy to remember: the captain owns the goal, the sub-agents own the work, and the scheduler owns the assignments. If you can draw a clear line between those three in your plugin, the rest is detail.

## The minimal loop: decompose, dispatch, aggregate

Here is the shortest real plugin that turns a session into a captain. It registers one command, spawns a persistent team, and prints the team id. Put it in a folder and declare it as a patch layer so DSH treats it as an active profile plugin.

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

The plugin contract is always the same shape. The module exports apply(ctx, config). The ctx object gives you commands, the agent factory, and the UI helpers. The config object carries user options. For this to load as an active profile layer, your package.json must declare the bundle patch. Without it, DSH never picks the file up and your command simply does not exist.

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

Install it by source, then run it from the profile where you need it.

```sh
dsh plugin --profile web add github:owner/repo
```

Run the command inside DSH, and your session is now a captain with a team id you can print back. That is the whole promotion step. The interesting part is the loop that fills the team with work, and it has three phases.

Decompose. You turn the goal into a flat list of tasks. Each task carries an id, a role, a prompt, and a list of dependencies. At this stage no task has run. You are only writing the plan.

Dispatch. You repeatedly find a task whose dependencies are all satisfied, find a sub-agent who is idle, hand the task over, and mark it running. When no idle agent exists, you wait. When no runnable task exists, the loop ends.

Aggregate. You collect the results from every completed task, reorder them by plan, and assemble the answer. In the comparison-page example, aggregation is writing six page files from six writer tasks.

The loop lives in the captain's process, which means the captain is busy while the team works. That is fine for short runs. For long runs you want the file-backed scheduler from the checkpoint section, because a captain that crashes takes the in-memory loop down with it.

The loop also needs an error path. When a sub-agent returns a failure, the task's status becomes failed, and every task that depends on it is unblocked in the worst way: it will never become ready. Decide what that means before you run. In the minimal version, a failed task cancels its whole subtree, and the loop exits with a summary of what failed. In the walkthrough later, one failed research cancels only that competitor's writer, and the rest of the pages still get written. Both behaviors come from the same loop. The difference is only how you treat failed in nextRunnable and in the final aggregation.

This loop is so small that you can hold it in your head. The next sections take each phase and make it real, starting with the part people get wrong first: dependencies.

## Modeling task dependencies as a DAG

Independent tasks are easy. The hard part is that most real plans are not flat. Research must finish before writing. Writing must finish before review. When you model this, you get a directed acyclic graph, a DAG. The nodes are tasks. The edges are "must finish before". A task is runnable only when every task it points to has completed.

A plugin expresses this with a dependencies array on each task. DSH's spawn and scheduling layer understands this field natively, which is why the reference design uses it directly.

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

Two properties of a DAG matter in practice. One: it lets two researchers run at the same time even though the writers behind them must wait. In the example above, research-a and research-b are both runnable on the first tick, so the scheduler can dispatch both immediately. Two: the graph keeps you honest about deadlock. If you ever write a cycle, for example write-a depends on review and review depends on write-a, no task is ever ready and the loop spins forever. The most common bug I have seen in squad plugins is exactly this, a hand-typed dependency that loops back on itself. Debugging it is miserable, so validate the graph once at decompose time. Walk every edge, follow the ids, and fail fast on a cycle before you spawn a single sub-agent.

## Dispatching by idle state

Once you have runnable tasks, you need a rule for which sub-agent gets which task. The naive rule, first-come first-served, feels fine until one member becomes a bottleneck. The rule that the reference implementations actually use is idle-first: give the next task to the member who has been idle the longest.

DSH exposes this through team.idleMember(). The method returns a member who is not currently assigned to anything, or undefined when every member is busy. The scheduler loop looks like this.

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

Two details are worth keeping. The sleep of a quarter second keeps the captain from spinning at full CPU while it waits, and it costs you nothing because a sub-agent typically needs far longer than 250ms to finish a task. And nextRunnable is re-evaluated every iteration, so a task that becomes unblocked while another member is still working gets picked up as soon as it appears. That is the whole reason the loop re-reads the graph instead of walking a pre-built schedule once.

Why idle-first instead of round-robin? Because member speed is not uniform. A reviewer who gets three long review tasks while a writer sits idle is a scheduling failure. Idle-first pushes work to whoever is actually free, which smooths out the unevenness automatically. In the six-competitor example, all six researchers start at once, all six writers start as their research lands, and no member sits with empty hands while another has a queue.

The paused state is where cancellation lives. When a task fails, the scheduler walks the dependency graph forward and marks every task that transitively depends on it as paused. Paused members stop doing work, but they stay in the team, so you can see in the UI exactly which branch of the plan was cut and which members went dark because of it. I once shipped a version that just skipped the failed task and let its dependents run anyway. The writers produced pages that referenced research that never existed, and I only noticed when a reviewer flagged the missing sources. Propagating the cancel, even in the minimal loop, is two lines: mark the failed task, then walk its dependents and mark them paused.

## Persistent teams and a live Web UI

A team you spawn and forget is a team you lose when the session ends. The persistent flag changes that. With persistent: true, the team, its members, and their state are stored outside the session. Reopen DSH and the team is still there, still with the same member ids, still holding whatever results completed tasks produced. The captain can reattach to it instead of spawning a fresh squad and losing all context.

Persistence is what makes the Web UI meaningful. DSH renders the running team in its interface, and each member shows one of three states: working, idle, or paused. Working means a task is assigned and in flight. Idle means the member is ready and waiting for an assignment. Paused means the member was told to stop, usually because the captain halted the run or a dependency failed in a way that cancels the rest.

When you watch a comparison-page run in the UI, you see six researcher members flick to working at the same time, then go idle one by one as their research lands, then six writers light up, then a reviewer. You can see the parallelism with your own eyes instead of trusting the log. That visibility is not decoration. When something is stuck, the state tells you where: a member that stays working for ten minutes is a sign of a runaway prompt, a member that stays idle while tasks are pending is a sign your dispatch rule has a bug.

The state names also give you a debugging vocabulary. You will write your own logs using these exact words, and they will match what the UI shows. Keep them consistent. If your plugin says "busy" but the UI says "working", you will confuse yourself at three in the morning.

## Checkpoint resume and immutable snapshots

Persistence keeps a team alive across restarts, but it does not by itself protect against a crash in the middle of a long run. The reference plugin dsh_workflow takes the scheduling layer and makes it inspectable and recoverable. This is the design to copy when your runs get long.

The core idea is that every mutation to the run is an event, and events are appended, never rewritten. dsh_workflow keeps two files per run: run.json holds the current plan, the task list, and the latest state of each task. events.jsonl is the append-only log of every event that happened, one JSON object per line. Because events are only appended, you can replay them. Because run.json is a snapshot, you can always see where the run stood at a given moment.

The snapshot is immutable in a specific sense: you never edit an old snapshot in place. When the run moves forward, you write a new snapshot that supersedes the old one. The old file stays on disk, byte for byte, so you can diff it against the new one and see exactly what changed between two checkpoints. This is what makes the workflow viewable: a tool can render the snapshot at any index, and what you see is literally what the state was at that instant, not a reconstruction with interpolation.

Breakpoint resume falls out of this design almost for free. On startup, the plugin reads the newest snapshot, walks the events log to confirm nothing newer exists, and then marks every running task as failed with a reason of "interrupted by restart". Pending tasks that depended on those running tasks stay pending. The captain then restarts the loop. Tasks that completed before the crash keep their results, so the work is not redone. The only cost is the tasks that were mid-flight when the crash happened, and that is a small price for not losing the entire run.

I hit the failure mode this solves directly once. A twelve-step workflow crashed at step nine because the machine went to sleep. Without snapshots I would have re-run all twelve steps and paid for the whole thing twice. With the file-backed scheduler, nine steps were already immutable, so only the running step needed a redo. That one incident is why I now put a file behind any squad that runs longer than five minutes.

An event line in events.jsonl is deliberately boring. It carries a sequence number, a timestamp, a task id, and the state transition, for example {"seq": 41, "at": "2026-08-19T03:12:04Z", "task": "write-alpha", "from": "running", "to": "done"}. Boring is the point. A boring format is easy to replay, easy to grep, and easy to feed into a diff between two snapshots. When I want to know what changed between checkpoint ten and checkpoint eleven, I do not have to remember anything. I read the newest snapshot, read the old one, and the diff is exactly the set of events that landed in between. The append-only log and the immutable snapshots are two views of the same story, and keeping both is what makes a run explainable after the fact.

## Walkthrough: research N competitors, write one page each

Time to put it together. The goal: a plugin that takes a JSON file of competitor names, researches all of them in parallel, writes one markdown page per competitor, and drops the pages into an output folder. This is the exact comparison-page job from the opening, minus my five-terminal misery.

Start with the input spec.

```json
[
  { "slug": "alpha", "competitor": "Alpha Corp", "angle": "pricing tiers" },
  { "slug": "beta",  "competitor": "Beta Labs",  "angle": "feature matrix" },
  { "slug": "gamma", "competitor": "Gamma Soft", "angle": "review sentiment" }
]
```

Now the plugin. It spawns a researcher and a writer for each spec entry, wires the dependency, runs the loop, and writes the files.

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

Run it from the profile, and watch the difference from Friday's approach.

```sh
dsh plugin --profile web add github:owner/repo
dsh
> squad-research competitors.json
```

What happens on screen, step by step. The three researcher tasks are all runnable on the first tick, so three members start working at once. As each research lands, its writer task becomes runnable and gets picked up by the next idle member. The writers do not wait for each other. When all three writes are done, the loop exits, the output folder appears, and three markdown files sit inside it. The total wall time is roughly one research plus one write, not three of each. That is the entire point.

There is a subtle thing worth noticing about the roles array. I declared exactly two roles, researcher and writer. The scheduler assigned three research tasks across the researcher members and three write tasks across the writer members. The team will not grow beyond two members, so if a third researcher task existed while both were busy, it would wait for a free slot. That behavior is fine for this job. If you need true fan-out, spawn one member per slot you want, and let idleMember pick among them.

What if one competitor's research fails? The loop from the earlier section decides. In nextRunnable, a failed research task never becomes ready, so its writer is never dispatched. The writer stays pending, the loop ends when everything else is done, and the aggregation step writes only the writers that reached done. The failing competitor gets no page, which is honest: a page built on broken research is worse than no page. If you want to know which one failed, the aggregation loop should also collect the failed tasks and print them. I added that in the second version of this plugin and it turned a silent gap in the output folder into a visible line in the status message.

## When you should not use a squad

Every orchestration plugin advertises parallelism. None of them advertise the cost. Be honest about it, because the wrong call is expensive.

Overhead is the first cost. Every sub-agent is a separate process with its own context window, its own tool access, and its own setup time. A five-member team consumes roughly five times the compute of one session, even when the tasks are trivial. If the total work is small, say a single page or a ten-minute investigation, the squad is slower than just doing it. The parallelism does not pay for the spawn cost. I keep a rough rule: if the goal can be done in one session under five minutes, do not spawn anything.

Context is the second cost, and it is counterintuitive. A team splits context across members, which keeps each member small, but the split is not free. The captain still has to hold the plan, the task list, and all the results it aggregates. With a large squad, the aggregate results alone can fill the captain's context, and then you are back to the summary problem you were trying to escape. If the final output is enormous, consider writing results to files and having the captain read summaries instead of holding everything in memory.

Determinism is the third cost. A squad is not a reproducible function. Sub-agents run in nondeterministic order, results arrive at different times, and the same goal can produce different output on two runs. For exploratory work that is fine, even desirable. For work that must be bit-identical, like generated code that goes into a build or copy that must pass review unchanged, a squad is the wrong tool. If you need determinism, do the work sequentially with pinned prompts, or route every sub-agent through the same template.

There is also the coordination trap. Teams make debugging harder because the failure can live in any member, in the scheduler, or in the captain. A solo session fails in one place and you can read the whole story in one transcript. A squad failure spreads the story across several processes and a log file. Before you add a squad to a pipeline, ask whether the parallel win is worth the loss of a single readable trace.

You can measure the break-even point instead of guessing. Run the same job solo once and as a squad once, and compare wall time and token usage. The number will differ per task and per model, but after two or three measurements you will know your own threshold, and that beats a rule of thumb from an article.

## Common pitfalls and how to debug them

The patterns below are the ones I have actually hit, in the order I hit them.

Dependency cycle. A task depends on itself or on a task that loops back. Symptom: the loop never ends, every member stays idle, and the UI shows a squad doing nothing forever. Fix: validate the graph before dispatching. Walk every edge, mark visited tasks, and throw if you revisit one.

Unchecked idleMember. I wrote the loop with team.idleMember() and assumed it always returns someone. When every member is busy it returns undefined, and calling .assign on undefined throws a TypeError that lands inside a random sub-agent. Fix: check for undefined and sleep before retrying, exactly as the dispatch loop above does.

Forgetting persistent. You spawn a team, the run is long, and you want to check on it later. Without persistent: true the team is gone with the session, and reattach is impossible. Fix: make the flag a default in your plugin, not an option the user must remember. You will forget this flag, I did.

Context ballooning in the captain. You aggregate every result as a full string and the captain's window fills. Symptom: the captain starts summarizing and later tasks reference results that are already condensed. Fix: write each result to a file and store the path in the task, then read on demand.

Interrupted task after crash. You restart a run and every task that was running at crash time is stuck in running forever, because nothing ever marked them done or failed. Fix: on startup, walk the events log and mark any task still running as failed with reason "interrupted by restart", as dsh_workflow does.

Dead member with no timeout. A sub-agent hangs on a bad tool call and the scheduler waits forever for an idle slot. Symptom: one member stays working past any reasonable duration. Fix: give tasks a timeout and have the scheduler reclaim the member when the timeout fires.

Too many members. Spawning one member per competitor sounds parallel and modern until you watch the cost. Ten members means ten context windows, ten tool stacks, ten startup costs, and the aggregate results still land in one captain. The compute bill grows with the squad even when the wall clock does not. I cap squads at what the work needs, usually one member per busy phase, and let idleMember do the rest. Fan-out beyond that is where the overhead in the previous section stops being theory.

Role and prompt mismatch. A researcher that returns prose instead of sources, or a writer that re-researches instead of reading its dependency, is a symptom of a prompt that does not say what the output contract is. The fix is to state the output shape in the prompt, like "return bullet points with sources" in the walkthrough, and to reject the result if it does not match. I have spent more time on this than on any scheduler bug.

The debugging order that works for me: check the UI states first, because they tell you who is working and who is idle. Then read the events log if you have one, because it tells you what actually happened in order. Then look at the failed task's prompt, because most squad bugs are prompt bugs wearing a scheduling costume. The squad did what you asked. The question is what you asked.

## Related instances and plugins

If you want to study real implementations rather than my toy examples, two repositories are worth reading.

dsh-agent-teams is the reference for the captain pattern. The author turned the current session into a captain, spawned persistent sub-agents with named roles, drove them through a shared scheduler, and rendered every member's working/idle/paused state in the Web UI. It is the cleanest demonstration of the exact loop in this article, and it is the natural starting point for anyone building a squad plugin. You can review it under NanmiCoder/dsh-agent-teams.

dsh_workflow goes one step up the ladder. It takes the multi-agent dispatch and wraps it in a Workflow layer that you can save, view, and resume. The run.json snapshot plus the append-only events.jsonl are the two files I described in the checkpoint section, and the immutable snapshots are what make breakpoint resume trustworthy. If your runs are long or your boss demands to see progress, this is the design to borrow. It lives at icetomoyo/dsh_workflow.

For a review perspective, the pair is worth comparing side by side. dsh-agent-teams shows how little code a working squad needs, and dsh_workflow shows how much ceremony you must add once recovery matters. Between the two of them you can see the whole spectrum from "promote a session" to "schedule like a pipeline".

The honest summary of this entire article is one line. A multi-agent orchestration plugin does not make agents smarter, it makes them parallel, persistent, and recoverable, and that is enough to turn a five-terminal Friday into a single command.
