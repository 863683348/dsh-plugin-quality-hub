# Build a Cross-Session Long-Term Memory Plugin for dsh

A Monday morning, a real project. You open a fresh dsh session to continue the API migration you started the previous Thursday. The assistant has no idea what you decided on Thursday. It does not know the endpoint contract you agreed on. It does not know the database that got ruled out. It does not know the naming convention you argued about for twenty minutes. You restate all of it. On Tuesday you do it again. On Wednesday a third time. This is not a defect in dsh. This is the default contract of every LLM agent: a session is a clean room, and nothing leaves that room unless something writes it down.

I wrote this tutorial because I spent four days living in that loop before I fixed it. The fix is not a clever model setting. It is a plugin that treats the disk as the only thing that outlives a conversation. By the end of this article you will have a working cross-session memory plugin for dsh: it will remember facts you ask it to remember, inject them into the next session so the model actually starts with them, and keep the whole store archived in git branches so you can roll back a bad week. The code is complete. Copy it, run it, and then read the section on dsh-memory-evolve to see where the serious version of this idea went.

## Why your agent is stateless by default

The core model in dsh is a large language model. A large language model has a context window and nothing else. It does not have a hard drive. It does not have long-term storage. Every token it sees arrives inside the current context window, and when that window closes, the tokens are gone. What you call memory in a human is, for the model, just whatever text happened to be sitting in the context when you sent your message.

dsh inherits this property and makes it explicit. Each session starts from an empty conversation. The model has no idea who you are, what project you are on, or what you decided yesterday, unless something in the context tells it. This is not an oversight. Statelessness is a deliberate design point. It keeps sessions isolated, so a mistake in one project cannot leak into another. It keeps your data private, because nothing is written anywhere unless a plugin writes it. It keeps behavior reproducible, because the same input produces the same output instead of being colored by stale assumptions.

The consequence is a simple rule you need to internalize before writing any plugin: persistence is never automatic. If you want the model to know something tomorrow, you must make something write it today. That something is a plugin.

To understand where a memory plugin lives, you need to understand how dsh organizes things. dsh keeps everything under a home directory that defaults to ~/.dsh. Inside it, plugins are isolated per profile, under ~/.dsh/profiles/. Each profile has its own set of plugin bundles. A profile is roughly one agent configuration: you might have a profile called web for your content site and a profile called dev for coding. Plugins loaded into the web profile are invisible to the dev profile. That isolation is your friend when you build memory, because it means the memory file for one profile will not pollute another.

A plugin in dsh is a JavaScript or TypeScript module that exports a function named apply. The signature is apply(ctx, config). dsh calls apply once, before the model sees any user input in a session. That timing is the whole trick of cross-session memory, and you should keep it in mind for the rest of this article: apply runs at the start, so anything you read in apply can be placed into the context the model starts with, and anything you write in apply will still be there next session.

There is one packaging detail that trips people up, including me. A plugin package is only recognized as an active profile layer if its package.json declares a specific key. Without it, dsh loads the package as a regular dependency and never calls apply. Here is the declaration, and it must be exactly this shape:

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

The dsh key with bundle and patch is what turns this directory into a profile layer. The patch array lists the files that get patched into the session. You will forget this key. I did, and I lost an evening to a plugin that loaded silently and did nothing. When you debug a memory plugin that is not working, check this key first, before you touch any logic.

## What a memory plugin should actually store

The hardest part of building memory is not the code. It is deciding what deserves to be remembered. Store everything and you flood the context window with trivia, then the model misses the one fact that matters. Store nothing and you are back to the Monday morning loop. The solution that worked for me, and that the reference plugin dsh-memory-evolve also uses, is a set of named tracks, each with a clear scope and a clear owner. I call it the five-track model.

Track one is the user profile. This holds stable facts about you: your name, your timezone, your default branch strategy, your preferred stack, the way you like error messages explained. These facts change rarely, so they are cheap to store and high value to inject. One line of profile can prevent the model from asking you the same setup question in every single session.

Track two is global facts. These are statements that are true across all of your projects. Your team names the main branch main, not master. Your deploys must pass a linter script called check. Your project tracker lives at a specific URL. Global facts are the shared ground truth of your working life. They are the things you find yourself repeating to every new tool and every new model.

Track three is project key facts. This is where the Monday morning pain actually lives. Each project gets its own list: the agreed endpoint contract, the database that was ruled out and why, the naming convention you settled on, the person responsible for the legacy service. These are decisions. Decisions are expensive to re-derive, and they are exactly what a fresh session cannot reconstruct. Project facts are the highest value track in the whole system.

Track four is the daily log. One line per session, tagged with a date and a project. The daily log is not for the current session. It is for the future session that asks what did we do last week. Without a daily log, the model can only answer that from project facts, which record decisions, not activity.

Track five is the one most tutorials skip: skill self-evolution. A memory plugin can learn about its own usage and adapt. For example, it can count how often you use the remember command, notice that you always prefix project facts with a certain format, and start suggesting that format back to you. In dsh-memory-evolve this becomes real self-modification: the plugin writes new commands into its own bundle when it learns a repeatable pattern. I kept this track minimal in the version below, but you should know it exists, because it is the difference between a static note-taker and a system that improves.

Equally important is what you do not store. Do not store secrets. A memory store is a plain JSON file on disk. If you put an API key in it, you have put an API key in a plain JSON file on disk, and one git push later it is in a repository you may not fully control. Keep credentials in your secret manager, and keep memory for decisions, preferences, and logs. Do not store the entire conversation. Raw transcripts are huge, they push out useful facts from the context window, and most of what people say in a session is throwaway. Store the distilled conclusion, not the twenty-minute argument that led to it.

### The memory file, concretely

It helps to see the store before the code. After a few sessions, memory.json looks like this:

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

This is a plain file, and that is the point. You can open it in an editor, fix a typo, delete a bad fact, and the plugin reads the corrected version next session. The five tracks show up as four keys here, with skills as a fifth key holding what the plugin has learned about your patterns. Nothing about this file requires a database, a service, or a network connection. It is the entire memory, and it lives where the plugin can reach it every time apply runs.

Two conventions keep this file easy to maintain. Keys stay stable across sessions, so the plugin never has to migrate data because you changed a field name. Values are short sentences, not paragraphs. A fact that needs three sentences is usually two facts, and two facts are harder to inject and harder to reason about.

## A minimal memory plugin, end to end

Time to build. Create a directory called dsh-memory-mini, put the package.json from the previous section in it, and create index.ts with the code below. The plugin has two responsibilities. The read side loads the stored facts in apply and injects them into the system prompt, so the model starts the session already knowing them. The write side listens for a command named remember, saves the fact to the right track, and writes the store back to disk. That is the entire loop. Cross-session memory is really just that loop: write on command, read on startup, repeat.

```ts
// dsh-memory-mini: a cross-session memory plugin for dsh.
// It does two things and nothing else:
//   1. persists facts into profile storage when you tell it to remember
//   2. injects the stored facts into the system prompt of the next session
//
// The whole trick of cross-session memory is timing. apply() runs before
// the model sees any user input, so whatever we place into the context here
// is what the model starts with.

import { join } from "path";

interface MemoryStore {
  user: Record<string, string>;          // track one: who you are
  global: string[];                     // track two: facts true everywhere
  projects: Record<string, string[]>;   // track three: facts per project slug
  daily: string[];                      // track four: one line per session
}

const MEMO_HEADER = "## Persistent memory (managed by dsh-memory-mini)";

export function apply(ctx: any, config: Record<string, unknown> = {}) {
  const maxEntries = (config.maxEntries as number) || 50;

  // ctx.storage is the profile-scoped persistence handle. Anything written
  // through it lands under ~/.dsh/profiles/<profile>/ and survives restarts.
  const store: MemoryStore =
    ctx.storage.readJson<MemoryStore>("memory.json") || emptyStore();

  // ---- write path: the remember command -------------------------------
  //   remember <fact> for project <slug>   -> project track
  //   remember <fact>                      -> global track
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

  // ---- read path: inject into the system prompt -----------------------
  // This is the moment the memory becomes visible to the model. If we do
  // not patch the prompt here, the facts exist on disk but the model never
  // sees them, which is the most common "my plugin does nothing" bug.
  const block = buildBlock(store, maxEntries);
  if (block) {
    ctx.patchSystemPrompt(
      (prompt: string) => `${MEMO_HEADER}\n${block}\n\n${prompt}`
    );
  }

  // ---- daily log --------------------------------------------------------
  // One line per session gives a future session enough to answer
  // "what did we work on last week?" from facts it never saw live.
  const today = new Date().toISOString().slice(0, 10);
  const project = ctx.project || "unspecified";
  store.daily.push(`${today} ${project}: session opened`);
  if (store.daily.length > 365) store.daily = store.daily.slice(-365);
  ctx.storage.writeJson("memory.json", store);

  return { commands: ["remember"], injected: Boolean(block) };
}

// Everything below is plain code. No dsh API in sight.

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

Read the code in this order. First the apply function signature, because that is the contract dsh expects. Then ctx.storage.readJson, because that is the read at the start of the session. Then the remember command, because that is the write. Then patchSystemPrompt, because that is the moment the memory actually reaches the model. The daily log at the bottom is a nice-to-have, but it is the cheapest way to make last week questions answerable, so I kept it in.

One design detail you can adjust without touching code is the config object. apply receives it as the second argument, and dsh reads it from the plugin's declared options. That is how you change maxEntries or disable the daily log from a config file instead of editing index.ts. The defaults in the code are chosen to be safe on a 128k window, and you should only raise them after you measure what the injected block actually costs, which the token section covers.

A few details worth calling out. The remember command only acts on an explicit command. I made that choice on purpose. An implicit hook that saves everything the model says would fill the store with noise in an afternoon. Explicit remember keeps the store curated, and a curated store is a store worth injecting.

The buildBlock function caps every track. The global track is sliced to the most recent maxEntries, project tracks to the last ten facts, and the daily log to the last seven days. These caps exist because the injected block consumes tokens from the context window. On a 128k window you can afford a lot, but a lot is not unlimited, and an unbounded block will eventually push out the actual conversation. I will come back to this in the token section.

### Commands beyond remember: recall, forget, and a weekly summary

A dsh memory plugin that only writes and injects is half a plugin. It can store facts, but it cannot answer questions about its own store, and it cannot clean itself up. Two more commands close that gap. The recall command reads the store and returns matching facts directly, so the model does not have to guess what it half-remembers. The forget command removes a fact by content, which is how you fix a wrong entry without opening the file in an editor.

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

The recall command uses the same keyword filter from the retrieval section. That is not a coincidence, it is the same idea showing up twice: memory is only useful when the model can find the right fact at the moment it needs it. The forget command is a safety valve. A wrong fact is worse than no fact, because a confident answer built on a stale memory entry is harder to spot than an honest "I do not know".

I use a weekly summary as a scheduled command, not a plugin feature. Once a week I ask the model to compress the daily log into one paragraph and save that paragraph as a global fact. The raw daily log stays as the source of truth, and the summary gives a cheap answer to "what happened recently". That is the aging idea from the token section, applied at the human level instead of in code.

Now wire it up and test it. dsh can add a plugin from a local path for development, and from a GitHub repo for real use. Both forms look like this:

```bash
# add the published reference plugin to the web profile
dsh plugin --profile web add github:csyangwen/dsh-memory-evolve

# add your local plugin for development (same shape, different source)
dsh plugin --profile web add ./dsh-memory-mini
```

The flag --profile web tells dsh which profile to install into, and the profile name becomes part of the storage path. Before you run a single session, confirm the plugin actually registered as a layer:

```bash
# verify the plugin is an active layer, not just a dependency
dsh plugin --profile web list
```

The list command prints every installed plugin and its layer status. If your plugin shows up as a dependency but not as a patch layer, the package.json declaration is wrong, and no amount of session testing will fix it.

Once the layer looks right, run a session and exercise the loop. First session teaches one fact, second session verifies the model remembers it, and a plain file read confirms the plugin wrote what it claims.

```bash
# session one: give the plugin a fact
dsh run --profile web
> remember the billing service talks to Postgres 16, not MySQL

# session two: a brand new session, same profile
dsh run --profile web
> which database does billing use?

# inspect what the plugin actually persisted
cat ~/.dsh/profiles/web/memory/memory.json
```

On the first run, the memory.json file does not exist yet. apply creates the store, injects nothing, and writes the first daily log line. On the second run, the injected block includes the billing fact, and the model answers Postgres 16. That is the whole feature. If you see the file at ~/.dsh/profiles/web/memory/memory.json with the fact in it but the model still answers wrong, the injection did not happen, and the debugging section at the end covers exactly that case.

## Git branches as your archive layer

A single memory.json file works, and it works for a long time. Then one day you delete a fact by accident, or a project gets cancelled and you want its decisions preserved but out of sight, or you want to answer what did we think about this last quarter. A flat file gives you none of that. Git gives you all of it, and git is already installed on every machine where you run dsh.

The idea is simple. The memory directory is itself a git repository. Each time a session ends with changes, a backup script commits them. Branches carry the structure: one branch per project, one branch per day, plus a stable main branch that holds the current state. To archive a project, you keep its branch but stop merging it into main. To restore last week, you check out the day branch for that date. To answer a historical question, you read the facts from an old branch without touching the present.

Here is the backup script I run after every memory write. Put it at ~/.dsh/scripts/memory-backup.sh and make it executable.

```bash
#!/usr/bin/env bash
# memory-backup.sh: archive the memory store in git, one branch per
# project or per day. Run it after a session, or from a cron line.
set -euo pipefail

# resolve the memory dir the same way the plugin does
MEM_DIR="${DSH_HOME:-$HOME/.dsh}/profiles/web/memory"
cd "$MEM_DIR"

# first run needs a repo and a git identity. Without the identity, every
# commit fails with "Please tell me who you are" and the archive silently
# stops doing its job.
if [ ! -d .git ]; then
  git init -q
  git config user.name "dsh-memory-mini"
  git config user.email "memory@local"
fi

# branch by project when one is given, otherwise by date
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

The script reads DSH_HOME if it is set, and falls back to ~/.dsh otherwise, which matches what the plugin does, so both sides agree on where the store lives. The branch name is either project/slug when you pass one, or day/date when you do not. I run it with the project slug after finishing work on that project, and the plain date form from a cron line at midnight.

The restore flow is where this earns its keep. Say last Tuesday you tried switching billing to ClickHouse, gave up, and switched back. The decision is buried in the daily log under the day branch. To rebuild the context around it you run git log --all --oneline to find the commit, check out the branch, and cat the memory.json from that point. The current working memory stays untouched, because you read the old branch without merging it into main.

```bash
# find the day you want
cd ~/.dsh/profiles/web/memory
git log --all --oneline | head -20

# read the store exactly as it was that day
git show day/2026-08-11:memory.json | grep -i clickhouse

# restore the current state to the last known good commit
git checkout -B main day/2026-08-11
```

The git identity line is the part everyone hits. On a fresh machine git refuses to commit without user.name and user.email configured, and the script fails with Please tell me who you are. I had that error run for a week before I noticed the backup had never made a single commit. The script above bakes in a local identity so the first run just works.

The first backup of an existing store deserves one extra step. If you already have a memory.json with weeks of history, do not let the first commit be the whole file with no past. Make one initial commit on main first, then start the per-project and per-day branches from there. That gives you a clean baseline, and the restore flow has a known good point to fall back to. I also keep a second clone in a separate directory when I want to read history while a session is actively writing, because a locked git index and a live session can step on each other.

Two failure modes to plan for. First, do not store large binaries in this repo. A memory store is text and stays small. The moment you start dropping screenshots or audio into it, the repo bloats and every clone hurts. Keep archives for text, and keep heavy assets in a separate store. Second, the script commits everything in the directory with git add -A. If you put a secret file in the same directory, the next commit pushes it into git history, and history does not forget. Keep the directory for memory.json only, and keep secrets elsewhere. This is the same rule from the storage section, now with a git-flavored consequence.

## When plain JSON is not enough

The plugin above is honest about its limit. It injects the most recent facts from each track, capped by maxEntries, and it does no searching. That works when your store is a few dozen facts. It starts to break when your store is a few thousand facts, because two things happen at once. The injected block grows until it eats the context window. And the cap means the model sees only the newest facts, so the one fact you needed from three months ago is silently missing.

The math is blunt. A fact in your store averages maybe 150 tokens. Injecting fifty facts is 7,500 tokens. Injecting five hundred facts is 75,000 tokens, which is a real slice of even a large window, and it is all wasted if the model only needs five of those facts. The moment your injected block regularly exceeds what you are comfortable spending, you have crossed the threshold where retrieval beats injection.

Before you reach for a vector database, try the cheapest filter that works: keyword matching. Filter the store to facts that share a word with the current question, then inject only those. For most personal stores this is 80 percent of the value at zero infrastructure cost.

```ts
// keyword retrieval: the cheapest filter that beats "inject everything".
const query = "which database did we rule out for billing";
const words = query.toLowerCase().split(/\W+/).filter(Boolean);
const hits = facts
  .filter((f) => words.some((w) => f.toLowerCase().includes(w)))
  .slice(0, 5);
```

When keyword matching starts missing facts that a human would clearly rank as relevant, the next step is a small embedding-based ranker. You do not need a vector database for this. You need a term-frequency encoding and a cosine similarity, both of which fit in a few dozen lines.

```ts
// Vector-ish retrieval without a vector database. Encode each fact as a
// term-frequency map, then rank by cosine similarity against the query.
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

That ranker is not a real embedding. It does not understand synonyms, and Postgres versus PostgreSQL will score zero. It is a bridge, and it is the right bridge for most stores. You only graduate to a real vector store or a RAG setup when one of three signals shows up. The team knowledge base is shared across many people, so the store grows past what a single injected block can hold. Your retrieval needs semantic matching, not just keyword overlap, because your facts use words that differ from your questions. Or you need sub-second search over tens of thousands of facts, where the linear scan above stops being fast enough.

One more lever before you reach for infrastructure: age the data. The daily log is the fastest-growing track, and most of it stops mattering after a month. Instead of storing every line forever, fold old daily logs into a monthly summary and drop the raw lines past ninety days. The summary keeps the answer to "what happened in July" available, and the raw detail stays cheap because most of it is gone. Aging is the cheap cousin of retrieval, and it is almost always worth doing before you add a vector store.

Here is the honest recommendation. Stay on the flat file plus keyword filter for as long as it works, which for a solo developer is a long time. Move to embeddings when the keyword filter misses. Move to a real vector store when you hit scale or team sharing. Every step up adds infrastructure and debugging surface, and the model cannot tell the difference between a perfect RAG pipeline and a well-curated 200-entry store.

## What dsh-memory-evolve does differently

You do not have to build all of this from scratch. The reference implementation in this space is dsh-memory-evolve by csyangwen. It sits at roughly 126 stars, it is actively maintained, and it is the plugin I pointed the memory at after my minimal version outgrew itself. Install it the same way you installed the local plugin, with the repo source instead of a path.

```bash
dsh plugin --profile web add github:csyangwen/dsh-memory-evolve
```

The published plugin shares the same five-track backbone that this tutorial uses: user profile, global facts, project key memory, and daily logs, plus the fifth track that my minimal version only sketches, skill self-evolution. The difference is that dsh-memory-evolve takes that fifth track seriously. When the plugin notices you keep using the same pattern, it writes new commands into its own bundle, so the plugin grows capabilities over time instead of staying frozen at whatever version you installed. That is genuinely different from a note-taker, and it is the direction this whole category is moving.

It also uses git branch isolation the way the previous section described, so its archive and restore story is the same shape as ours. That should be reassuring. The hard-won design decisions in this tutorial are not my invention; they are the decisions the established plugin already made, and I arrived at the same ones independently after hitting the same walls.

What I would copy from it. The self-evolution track, once your store is stable enough that the plugin has real usage patterns to learn from. The way it separates project-scoped memory from global memory, which keeps a shared profile from leaking one project's decisions into another. What I would skip at first. The full semantic layer. Start with the flat file and the keyword filter, and only add the fancy retrieval when the store actually demands it.

When you evaluate a memory plugin, do not just look at the feature list. Open the store it produces and ask three questions. Does it keep facts short and decision-shaped, or does it hoard transcripts? Can you fix a wrong entry without deleting the whole file? On the hundredth session, when the store has grown, does the injection stay bounded? dsh-memory-evolve scores well on all three, which is part of why it has held roughly 126 stars instead of fading. The other part is that it is a real repository you can read, with a license and a commit history, and that matters when you plan to depend on it.

## Common pitfalls and debugging

The plugin is simple, but simple plugins fail in predictable ways. Here are the ones I hit, in the order they cost me time.

The plugin is installed but does nothing. Check package.json. The dsh key with the bundle patch declaration is the difference between a loaded plugin and an active profile layer. I spent an evening on this exact bug, and the fix was adding three lines to a file I was convinced was correct. Symptom: dsh starts fine, the plugin never fires, no error anywhere.

The file is written but the model answers wrong. That is the injection timing bug. The memory.json file proves the write path works, but patchSystemPrompt is what puts the facts in front of the model. If you skipped the patch, the facts live on disk and nowhere else. Symptom: cat the file, the fact is there, the model still has no idea. Fix: verify the injected block appears in the system prompt, and check that your patch function returns a string that actually contains the block.

The store is in the wrong directory. This one is subtle. The plugin resolves the memory path from DSH_HOME or the home directory, and the profile name comes from ctx.profile. If your shell sets DSH_HOME to one value and your script or cron sets it to another, you get two memory stores and they silently disagree. The morning session saves to one, the cron backup reads the other, and facts disappear randomly. Fix: print the resolved path in apply once during development, and confirm every tool in the loop resolves the same path.

DSH_HOME is set but wrong. The plugin and the backup script both read DSH_HOME, so a typo in the variable breaks them in the same silent way. I once set DSH_HOME to ~/.dsh/ with a trailing slash in a shell config, the memory directory resolved to a path with a double separator, and most tools tolerated it while one tool in the chain did not. Facts started landing in a directory nothing else was reading. During setup, have the plugin and the script both print the resolved path, and make sure they print the same string.

Permission errors. On a fresh machine, the directory ~/.dsh/profiles/web/memory may not exist, and the first write fails with ENOENT unless the plugin creates it. The code above creates it with mkdir recursive, but if you hand-rolled a version that assumes the directory exists, you will see this. Less common but real: on a shared machine the profile directory can be owned by another user, and the write fails with EACCES even though the path is correct.

Corrupt JSON. A crash in the middle of a write can leave memory.json truncated or malformed, and then readJson throws on the next startup, which can take down the whole session. My load function handles this by renaming the bad file to a timestamped backup and starting fresh. Losing a session of writes is better than losing every session because the plugin refuses to start. If your version does not guard this, add it before you trust the plugin in production.

Token limits. The injected block counts against the context window, and an unbounded store will eventually push the conversation out. Watch for two symptoms. The model starts truncating its own responses, which is the window running out. Or older memory stops appearing even though you added it, which is the slice cap silently dropping facts. The fix is the caps in buildBlock plus honest monitoring of how many tokens the block actually costs.

Concurrent writes. Two sessions on the same profile at the same time both read the store, both modify it, and the last write wins. The loser's facts are lost. For personal use this is rare. For a shared profile it is a real problem, and the fix is a lock file around read-modify-write, or simply telling your team not to run two sessions on one profile at once.

Git identity not configured. The backup script bakes in a local identity, so this bites you only if you modified the script. Without user.name and user.email, every commit fails with Please tell me who you are, and the backup looks alive while doing nothing. Check git log --all once in a while, not just the exit code of the script.

You installed into the wrong profile. The command dsh plugin --profile web add ... puts the plugin into the web profile, but if you run dsh run without --profile web, you are on the default profile and the plugin never loads. The storage path also changes with the profile, so even a working plugin shows an empty memory when you inspect the wrong profile's directory. Check the profile on the install command, the run command, and the path you are reading. All three must name the same profile.

The pattern behind most of these is the same. A plugin that works in my demo breaks the moment the environment changes, because the environment is the least-tested part. When you debug, verify the two ends separately. Confirm the file contains the fact, then confirm the prompt contains the block. If both are true and the model still gets it wrong, the problem moved upstream into the model, and you can now have a precise conversation about it instead of guessing.

## Related instances

If this tutorial got you interested, the two implementations worth reading next are dsh-memory-evolve and openviking. The first is the reference for everything in this article, and the second is a sibling project that explores where else persistent memory can live in an agent harness. For a maintained, review-backed version of the five-track idea, the plugin to evaluate is csyangwen/dsh-memory-evolve, which I referenced throughout. Install it, compare its self-evolution behavior with the minimal plugin here, and you will see in one session what a year of iteration adds on top of a working loop.
