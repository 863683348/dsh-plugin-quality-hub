<!-- CONFIG -->

## Installing and configuring dsh-memory-evolve

I installed this plugin on my daily-driver profile, not in a throwaway workspace. That choice matters, because a memory plugin stores state somewhere. Before you run the install command, decide where that state should live.

The install command is short:

```
dsh plugin --profile web add github:csyangwen/dsh-memory-evolve
```

The `--profile web` flag targets the profile you actually launch with `dsh web`. If you mostly use the TUI, point it at that profile instead. I have both profiles, and I install the memory plugin into each one separately. The plugin has no way to sync across profiles, so decide up front which profile carries your memory.

You can also pin to a release tag if the repo publishes them. A pinned install looks like this:

```
dsh plugin --profile web add github:csyangwen/dsh-memory-evolve#v0.2.1
```

That `#v0.2.1` is a branch or tag reference. The dsh CLI resolves it against the remote before writing the entry into the profile. If the tag does not exist, the command fails with a resolution error, and nothing gets written. I hit this once with a typo. The fix was to run `dsh plugin ls`, confirm nothing had changed, then retry with the correct tag.

Why pin at all? Memory plugins write files on every conversation. If a new version changes the on-disk schema mid-week, you can end up with a memory directory that the older binary refuses to read. Pinning is cheap insurance. The tradeoff is that you miss bug fixes until you bump the version yourself.

## What the plugin writes on disk

After the first session, look inside the workspace. The plugin creates a memory directory. A typical layout looks like this:

```
.memory/
  user-profile.md
  global-facts/
    001-rust-version.md
    002-timezone.md
  projects/
    <current-repo-name>/
      key-memories.md
      project-log.md
      daily-log/
        2026-08-17.md
        2026-08-18.md
  skills/
    tailwind-patch-pitfall.md
```

Your actual paths may differ. The plugin version you installed decides the exact layout, and the README shows the tree for that version. Do not assume the layout above matches a future release. This is the most common source of confusion in user issues, so I keep a copy of the README section that shows the tree.

## Profile-level state vs project-level state

One config decision matters more than any other: where the memory root lives. The plugin offers two placements, and they serve different use cases.

A per-project memory root keeps everything inside the repo you are working on. The memory directory travels with the codebase, which helps when you clone the repo on a new machine. The downside is that your user profile and global facts get duplicated across every project you touch.

A global memory root keeps user profile, global facts, and skills in one place, and only project-specific logs live in the project. This is the setup I run. My global facts are not scattered across fifteen repos, and my user profile follows me no matter which directory I open.

## The config block

The plugin reads its options from the profile config. In dsh, plugin configuration lives under the plugins key in your profile JSON. Here is the block I use, trimmed to the fields that matter:

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

Every field has a default. If you omit the whole block, the plugin falls back to sane defaults, which is how it behaves right after a bare install. The block above only overrides what I care about.

The `root` field points at the memory store. `~/.dsh/memory` expands to the home directory, which keeps it out of any single project. `projectScope: local` tells the plugin to keep project memories inside the project directory, even when the global root lives elsewhere. If you want everything in one tree, set it to `global` instead.

The `tracks` object toggles each of the five memory tracks. I keep all five on. If you find the injected context too heavy, start by disabling `dailyLog` before touching the others, because the daily log is the most verbose track.

## Git branch isolation

The `gitIsolation` block is where this plugin differs from most memory tools I have tried. The memory store is a git repository itself. It opens a branch per project or per date, and only that branch's memory gets injected into the current session.

With `branchPrefix: "mem"`, a session in the `web-checkout` project reads from a branch called `mem/web-checkout`. When the date changes, the daily log moves to `mem/2026-08-19`. This is how the plugin avoids mixing memories from different projects and different days.

The `archiveThreshold: 200` value sets the point where the plugin stops growing a log and archives it. When a branch's commit count crosses 200, the plugin opens an archive branch and resets the working one. The archived branch is still there, and `git log` on the memory repo shows the full history. Restoring an archive is a matter of checking that branch out again.

`autoCommit: true` makes the plugin commit after each write. Without it, branch isolation still works, but your history is gappy and rollback is messy. I keep auto-commit on.

## Injection budget

The `inject` block controls how much memory reaches the model. `maxTokens: 2400` is roughly the ceiling for the whole memory block in my case. Do not raise it casually. Memory is prepended to every turn, not just the first one, so the cost compounds over a long conversation.

`headOnly: true` injects only the most recent entries from each track. Old entries stay on disk but stay out of the context. This is a deliberate tradeoff between freshness and token spend. A long-running project where nothing is ever forgotten is not the goal here. The goal is that the recent state is always present.

## Skill self-evolution

The `skills` block controls the background evolution feature. With `selfEvolve: true`, the plugin watches for patterns in how the session solves repeated problems. When the same kind of fix appears more than a few times, the plugin drafts a skill file under `skills/` and proposes it in the session. You approve it, and it becomes part of the injected memory on later runs.

`maxFiles: 40` caps the skill directory. Beyond that, the plugin refuses to create new skills until you prune old ones. I hit this cap twice, and both times it forced a useful cleanup rather than being a real problem.

## Verifying the install

After configuration, run this to check the plugin actually loaded:

```
dsh plugin ls
```

Look for the plugin name in the output. Then open one session, ask about anything, and check that the memory directory was created. If the directory does not appear, the usual culprits are a wrong profile flag, a config key that does not match the plugin's expected name, or a permission issue on the target directory. The plugin logs a warning when it cannot write, and the log line names the path it tried.

One more note on profiles. If you add the plugin to `web` but launch with the default profile, the plugin simply does not load. There is no error, because nothing references it. This silent behavior trips people up, so I now run `dsh plugin ls` in the exact profile I plan to use.

## A minimal starting config

If you are trying this for the first time, do not copy my full block. Start smaller:

```json
{
  "plugins": {
    "memory-evolve": {
      "root": "~/.dsh/memory"
    }
  }
}
```

That is enough to enable all five tracks with defaults, git isolation on, and a default injection budget. Run it for a week. Read the memory files that appear. Only then add tuning. Most of the tuning fields exist to solve problems you will not have until the plugin has been running for a while, like memory that has grown too large to inject, or skill files accumulating faster than you prune them.

## What each track actually injects

It helps to know what lands in the prompt before you tune the token budget.

The user profile track injects preferences: timezone, language, editor, the way you like commit messages written. It is short, usually a paragraph.

The global facts track injects things that are true across projects, like the team using pnpm instead of npm, or deploys happening on Friday afternoons. Each fact is one small file, and the plugin injects the heads of the most recent ones.

The project key memory track holds decisions that are expensive to rediscover: the reason a service is behind a feature flag, the port that staging uses, the naming convention for migrations. This is the track I rely on most when I come back to a repo after a week away.

The project log records what happened in the project over time, in reverse chronological order. It gives the session a sense of recent work without re-reading the full history.

The daily log is the most granular track. One file per day, appended to as the session works. It is also the most token-hungry, which is why I suggested turning it off first if the budget runs tight.

## Common config mistakes

Three mistakes come up again and again in the issue tracker.

The first is a typo in the plugin key. The config key must match the name the plugin registers. If the package registers as `memory-evolve` and you write `memory`, your block is ignored and defaults apply silently. Check the `dsh plugin ls` output, which shows the registered name.

The second is pointing `root` at a path that does not exist and that dsh cannot create. On Windows, an absolute path like `C:\dsh\memory` needs to point at a directory you can write to. If the plugin cannot create the directory, it logs a warning and falls back to an in-memory store that survives only for the session. That fallback is easy to miss, because nothing visibly breaks.

The third is forgetting that branch isolation only helps when the memory repo is actually a git repo. If you run the plugin in a directory that is not under git, the plugin initializes its own repo inside the memory root. That is fine. But then `git branch` inside your project does not show the memory branches. They live in the memory repo, at the `root` you configured. Check there first when you go looking for the branches.

## Updating and rolling back

When a new release comes out, the update command is:

```
dsh plugin --profile web update memory-evolve
```

Before updating a memory plugin, I back up the memory root. A memory store is not a database with migrations in the traditional sense, and a version bump can change file naming. Backing up is one tar command away. Rollback is the same command with the old tag pinned:

```
dsh plugin --profile web add github:csyangwen/dsh-memory-evolve#v0.2.1
```

Because the memory files are plain Markdown and the repo is git, the data itself is rarely lost. The risk is the reader side changing shape. So my rule is simple: back up before the update, verify after, and keep the previous tag handy.

<!-- CODE -->

## Tracing the code path

The plugin's core is not glamorous. It is a thin layer over two things: a directory of Markdown files, and a git repo that wraps that directory. Everything else is scheduling and token budgeting. That simplicity is why I find it easy to trust, and easy to modify when a project needs something custom.

Before reading the code, one caveat. dsh plugins evolve fast, and the exact hook names differ between versions. I installed a recent build, so the names below match what I ran. If yours differ, the README of your version is the source of truth. The structure is what matters here, not the exact string of each hook.

## The entry point

The package.json is the first thing dsh checks. Without the `dsh` bundle declaration, the plugin is just a Node module that never gets loaded. Here is what that file looks like:

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

The `patch` array tells the harness which files are part of the plugin bundle. When you run `dsh plugin add`, the harness reads this declaration and wires the plugin into the session lifecycle. If this block is missing or malformed, `dsh plugin ls` may still list the package, but the apply function never runs. That silent failure is worth remembering when a plugin "installs" but does nothing.

## Reading config and opening the store

The apply function receives the resolved config from the profile. The harness merges your JSON block with defaults before calling apply, so the config you get inside is already complete. The plugin's job is to validate it, not to invent defaults.

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

Two things happen here before any session logic. First, the memory root is created if missing. Second, the root is made into a git repo if it is not already one. That `ensureGitRepo` call is what makes branch isolation possible, so it runs once at load time, not per message.

The hook registration is worth pausing on. `session:create` fires when a new session starts, which is where the read path lives. `message:complete` fires after each finished message, which is where the write path lives. Keeping the two paths separate makes each one easier to test in isolation.

## The write path

Writing memory is the part that touches disk most often, so it needs to be cheap and idempotent. The plugin does not rewrite whole files. It appends lines and renames files when structure changes.

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

The `extractFacts` function is the part that is not a thin layer. Deciding what counts as a fact worth persisting is a language-model judgment, and the plugin runs a small classification over the message. In the simplest form it looks for statement patterns: a preference, a decision, a constraint. The implementation I ran keeps this conservative, so false positives are rare. You get a few missed facts, not a flood of junk entries.

`writeProjectFact` appends to the project's key-memories file. `writeGlobalFact` writes a new small file per fact under global-facts, because global facts are few and each deserves its own file for easy editing. The daily log append is unconditional, one summarized line per completed message.

## Branch isolation

The commit step is where git does the heavy lifting. The plugin ensures the current project branch exists, checks it out, stages the memory files, and commits.

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

The `checkout -B` form creates the branch if it does not exist and resets it if it does. The branch name is derived from the project, so sessions in the same project land on the same branch. Sessions in different projects never see each other's memory, which is the whole point of isolation.

The `git diff --cached --quiet` check avoids empty commits. Running a commit when nothing changed pollutes the history and triggers the archive logic unnecessarily. This guard is a small detail, and it matters more than it looks.

Daily-log branches work the same way, with the date in the branch name instead of the project. When the date flips, a new branch appears, and the previous day's file stays untouched on its own branch.

## The read path

At session start the plugin reads the branches that apply to the current session, then builds the memory block under the token budget.

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

The `readHead` calls read only the top of each file, which is the `headOnly` behavior. The daily log reader opens the current date's file specifically, not the whole branch. These reads are parallel, because there is no dependency between them, and each read has its own token cap so no single track can crowd out the others.

`composeMemoryBlock` assembles the five tracks into one ordered Markdown block. The order is deliberate. User profile first, global facts second, then project memory, then logs. The user profile is the most stable signal, so it goes first. The daily log is the noisiest, so it goes last, where it adds detail without drowning the signal.

## Skill self-evolution

The evolution feature is a counter plus a proposal. The plugin watches for repeated solution patterns and drafts a skill file when a pattern crosses a threshold.

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

The counter lives in memory, not on disk. That means it resets when the harness restarts, which is fine, because the threshold is three occurrences, and three occurrences usually happen inside one session anyway. The `ctx.proposeSkill` call surfaces a draft for the user to accept. Nothing gets written to the skills directory without that approval, so the feature cannot silently bloat the memory with half-baked skills.

This design answers the question of who decides what becomes a skill. The plugin decides when a pattern repeats, the user decides whether it is worth keeping. I find that division sensible. A fully automatic writer would produce confident nonsense.

## Archive logic

When a branch crosses the archive threshold, the plugin rotates it. The rotation keeps the working branch small while preserving history.

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

The rotation creates a snapshot branch from the current one, then resets the working branch to an orphan with no parents. History is preserved on the archive branch, and the working branch starts fresh. This is the mechanism behind the `archiveThreshold` config value.

The orphan reset is the kind of operation that makes a reviewer nervous, because it looks destructive. It is not, as long as the archive branch was created first. The order matters, and the code does not reorder itself, so the guard is structural.

## Error handling and the fallback store

The plugin's error handling is deliberately boring. Each write is wrapped so that a failure in one track does not kill the session.

```ts
async function safeWrite(fn: () => Promise<void>, ctx: Ctx, label: string) {
  try {
    await fn();
  } catch (err) {
    ctx.log.warn(`memory write failed (${label}): ${err.message}`);
  }
}
```

When the memory root cannot be written, the plugin falls back to an in-memory store. The fallback means the session still works, it just forgets everything when it ends. The warning line is the only sign, and it names the label, which makes diagnosis fast when you see a session that "worked but remembered nothing."

I have a rule about memory plugins after running this one for a while: never let the persistence layer take down the session. Losing a memory write is cheap. Losing the whole conversation because a file append threw is not. This plugin gets that tradeoff right.

## Two sessions at once

Memory plugins invite a natural question: what happens if I run two sessions against the same project at the same time? I tried it, and the answer is mostly fine, with one caveat.

Each session appends to the same daily log file and commits to the same branch. Git handles the commit side through its normal mechanisms, and the plugin does not attempt a lock. In practice the writes are small and fast, so collisions are rare. The caveat is the daily log. Two sessions appending concurrently can interleave their lines, because append is a read-modify-write at the file level, not an atomic operation. The result is a daily log with alternating lines from both sessions. It reads oddly, but nothing is lost.

If you run many parallel sessions, consider giving each one its own project name, or use the `projectScope` global option, which pushes project memory into a single shared tree. That does not fix interleaving either, but it centralizes where you go to clean up. For one person driving dsh interactively, this has never been a practical problem.

## Why Markdown and git instead of JSON

The choice of plain Markdown as the storage format looks unambitious, and that is its strength. A JSON database would give the plugin strict structure and fast queries. It would also make every old memory file unreadable after a schema change, and it would hide the data behind a query API that you cannot open in an editor.

Markdown files are inspectable. When I want to know what the plugin thinks my global facts are, I open the file. When a memory looks wrong, I edit it by hand, and the next session reads my edit. There is no round trip through a migration tool. The git layer then provides history, rollback, and the branch isolation that makes multi-project use sane. Two simple technologies, each boring on its own, compose into a system that is easy to trust and easy to fix.

That combination is the reason this plugin works as a teaching anchor. The data is never hidden, so the behavior is never mysterious.

## Testing the behavior

Because the store is plain Markdown and git, you can test the plugin without a model at all. Create a session, send one message with a clear project decision, and then inspect the memory repo with plain git commands:

```
git -C ~/.dsh/memory branch --list
git -C ~/.dsh/memory log --oneline -5
```

The branch list shows whether isolation produced the expected branch. The log shows whether commits happened on the right branch and whether the empty-commit guard worked. Reading the generated Markdown files tells you whether the classification wrote what you expected. This is a far nicer debugging experience than most plugin code, and it is a direct result of choosing files and git over a binary database.

<!-- HIGHLIGHTS -->

## Where this plugin earns its score

I rate memory plugins on how they behave after a month, not on the first install. A plugin that impresses on day one and annoys on day thirty is not a good plugin. Measured that way, dsh-memory-evolve earns a high score, and it earns it for reasons that are mostly architectural.

- Cross-session continuity that actually works. This is the headline feature, and the reason the plugin exists at all. Open a session on Monday, tell the agent the staging port is 8080. Open a new session on Wednesday and ask about deployment. The answer comes back without you repeating the background. I have verified this exact flow, and the memory file for the fact appears under project key-memories the moment it is confirmed. Most "long memory" tools I have tried get this wrong by being too clever, either summarizing aggressively or storing raw transcripts. This plugin stores decisions, which is what you actually need later.

- The five-track split beats a single blob. Many memory plugins keep one file and append everything to it. The result is a file that starts useful and becomes noise. Here, user profile, global facts, project key memories, project log, and daily log are separate, and they inject in a fixed order with separate token caps. A fact about your timezone does not compete with a project decision for the same budget. When I tuned the injection budget, the per-track caps let me shrink the noisy daily log without touching the project key memories. That granularity is not a cosmetic feature. It is the difference between a memory that helps and a memory that just takes tokens.

- Git branch isolation is the right isolation model. Memory is inherently multi-context. Your work on the web checkout is not your work on the billing service, and mixing them poisons both. The branch-per-project design means each project reads only its own branch. The branch-per-date behavior keeps daily logs from bleeding into each other. I looked at the branch list after a week of mixed work, and the naming was clean enough to navigate. `mem/web-checkout`, `mem/billing-service`, `mem/2026-08-19`. Nothing crossed.

- Archive and restore without data loss. Any memory system grows without bound if you let it. The threshold-based archive rotates a branch before it gets unwieldy, preserving history in a named archive branch. Restore is a git checkout. I tested the rotation path by lowering the threshold temporarily, and the orphan reset did what the README promised. The working branch stayed small and the history stayed reachable. For a tool that claims to be a long-term memory, this is a necessary feature, and it is implemented with the simplest tool that could possibly work.

- Skill self-evolution is gated, not automatic. This is the detail that makes the evolution feature safe. The plugin counts repeated problem signatures and proposes a skill draft for approval. Nothing writes to the skills directory without you accepting it. I watched it propose a draft after a third occurrence of the same fix pattern in one session, and it was a reasonable summary of what had happened. The approval gate means the feature cannot quietly fill the memory with confident nonsense. That restraint is rare in this corner of the plugin ecosystem, where automation is usually the selling point.

- The whole store is plain Markdown plus git. I keep coming back to this, because it is the source of most other strengths. The memory is human-readable, editable by hand, and versioned. When a memory is wrong, I edit the file. When I want to know what the plugin believes, I read the file. There is no database to query and no export format to fight. The debugging loop is short, and the README's tree matches what I see on disk.

- Configuration stays small for normal use. The full config block looks long, but the minimal install is one JSON field, the root path. Everything else has a default that is sensible for interactive use. I ran the minimal config for a week before tuning anything, and the defaults were not embarrassing. That matters for adoption, because a memory plugin with a twenty-field setup would never get configured at all.

- Failure degrades gracefully. When the memory root cannot be written, the plugin logs a warning and falls back to an in-memory store. The session keeps working, and the user finds out through a log line rather than a crash. For a plugin whose whole job is persistence, refusing to take the session down when persistence fails is the correct priority order. I have seen the fallback trigger once, a permissions problem on a new machine, and the session completed fine. The only cost was that the memory did not survive, which was the acceptable tradeoff.

- The token budget is explicit and tunable. Memory is prepended to every turn, so its cost compounds. The `maxTokens` ceiling and the `headOnly` behavior give a concrete answer to the question of how much memory costs. I measured the difference between headOnly on and off on a busy session, and the savings were real, in the thousands of tokens over a long conversation. Explicit budgeting is the difference between a memory plugin you keep and one you uninstall after the first expensive bill.

- A good teaching anchor. The plugin's simplicity makes it the natural reference for the memory tutorial track on this site. Every mechanism can be demonstrated with a file and a git command. There is no magic layer that has to be taken on faith. For a site that teaches by example, that is worth a lot, and it is why this instance gets the attention it does in the category listing.

Not every property is a win, and I would be underselling the review if I only praised.

- The daily log interleaves under concurrent sessions. Two sessions appending to the same file at the same time can produce alternating lines. It reads oddly and needs manual cleanup. Single-user interactive use never hit this, but it is a real edge for parallel workflows.

- The classification is conservative by design. The plugin misses facts it could have kept, because the extraction pattern is strict. I missed a few intended memories this way. The tradeoff is intentional, and I prefer missed facts to junk facts, but it is worth knowing before you expect perfection.

- Token cost is real, even with the caps. On long projects the injected block grows toward the ceiling, and every turn pays for it. The caps keep it bounded, but "bounded" is not "free." Budget-conscious teams should measure their actual spend.

- Branch names carry project names, which can collide if two repos share a name. The sanitize step handles path safety, but two different `main` repos in different folders produce the same branch name and share memory. Naming projects explicitly avoids the surprise.

## Scorecard by dimension

The site rates plugins across six dimensions. Here is how this one lands on each, with the reasoning behind the numbers.

- Continuity: 9 of 10. Decisions persist across sessions, and the five-track split keeps them findable. The deduction is the conservative classifier, which lets some facts slip.
- Isolation: 9 of 10. Branch-per-project and branch-per-date give clean separation in practice. The deduction is the name-collision edge where two repos share a name.
- Evolution: 7 of 10. The self-evolution feature is sound and safely gated, but it stays in the background. The plugin proposes, you approve, and the resulting skills are simple text. There is no evaluation loop to measure whether a skill actually improves outcomes. The mechanism is honest, the payoff is unproven.
- Inspectability: 10 of 10. This is the highest score in the set, and it is the reason the plugin works so well as a teaching tool. Every byte of memory is a readable Markdown file under git. There is nothing to take on faith.
- Efficiency: 7 of 10. Token budgeting is explicit and tunable, which is good. The per-turn cost still grows on long sessions, and concurrent writes can interleave. Fine for one person, mediocre for shared heavy use.
- Config simplicity: 8 of 10. One field to get started, sensible defaults, and tuning only when needed. The deduction is that the full option surface looks intimidating before you realize most of it has defaults you will never touch.

The total is a top-tier memory plugin for the use case it targets, and the scorecard makes the boundaries visible instead of hiding them.

## The restore workflow in practice

Archives are where a memory plugin proves it is serious. Here is the concrete workflow when a project's memory gets rotated and you need something from the old branch.

First, list what exists:

```
git -C ~/.dsh/memory branch --list "mem/web-checkout*"
```

That shows the working branch and any archive branches next to it. When the rotation triggered, the archive branch was named with a timestamp, so the output looks like `mem/web-checkout` and `mem/web-checkout-archive-1724...`. To inspect the archived memory, check out the archive branch in the memory repo and read the files:

```
git -C ~/.dsh/memory checkout mem/web-checkout-archive-1724...
cat ~/.dsh/memory/projects/log.md
```

Once you have what you need, check the working branch back. I prefer to copy the needed lines out before switching back, because switching branches changes what the plugin injects, and I do not want a stray checkout to alter the live memory. This is a small habit, and it has saved me from confusing myself exactly once, when I left an archive branch checked out overnight and the next session injected an old log.

## What a month of use taught me

I ran this plugin on a mix of personal and project work for about a month before writing this breakdown, and a few observations stuck.

The skills directory grew to the cap once, at 40 files. The surprise was not the growth, it was how much of it was genuinely useful. Most skills were small, one-paragraph notes about a recurring fix, and they injected as a short block that saved real re-explanation time. The cleanup when I hit the cap was overdue anyway, so the cap functioned as a maintenance signal rather than a limit.

The archive rotation fired on the busiest project after a few weeks of heavy daily work. The rotation itself was invisible, which is the right behavior. The project kept running, and the old history stayed one checkout away.

The daily log is the track I would disable first if I were token-constrained. It carries the least reusable signal per token, and turning it off costs almost nothing in continuity. Everything else earned its place.

The overall maintenance overhead is close to zero. One backup before upgrades, a glance at the branch list when something seems off, and occasional pruning of skills. For a plugin that carries your context across weeks, that is a very light cost.

The bottom line: this plugin is not flashy, and its best features are boring ones. Reliable persistence, clean isolation, bounded cost, and graceful failure. On the rating scale used across this site, those add up to a top-tier memory plugin for solo and small-team use, with the caveat that it is not built for high-concurrency shared deployments. That is a reasonable boundary, and it is an honest one to state.
