## Tool vs command: who calls whom

Before anything else, get the two primitives straight, because the rest of this tutorial depends on the difference. A command is triggered by the user through the UI. You type `/hello` or pick it from the palette, and the command's action runs. A tool is different. The user never calls it directly. The model calls it, at the moment it decides that a function would help solve the current task.

That one difference drives every design decision that follows. If you want the agent to act on its own, read a file for context, query a database, call an API to resolve a question, you register a tool. If you want a person to decide when something happens, you register a command. The line between them is not about complexity. It is about who holds the trigger.

The registration shapes look nearly identical, which is deliberate. Both take a name and an options object. The tool options add a `parameters` JSON Schema and an `execute` function. The mental model is that every capability in dsh is the same act of registration, and the only thing that changes is which field you fill in.

This tutorial gives you both paths to real capability. Path A shows how to register a custom tool of your own. Path B shows how to take an existing MCP server and wrap it into dsh without re-implementing anything. By the end you will have a model that can act on your workspace and your services, which is the difference between a chatbot and an agent.

## What a tool actually is

A tool is a contract between you and the model, mediated by dsh. You describe the tool with a name, a description, and a parameter schema. The model reads that description, decides the tool fits its current goal, fills the parameters according to the schema, and calls `execute`. Your function runs, returns a result, and the model reasons over that result.

The contract has three parts, and each part has a job. The description tells the model when to use the tool. The parameters tell the model what to pass. The result tells the model what happened. If any of the three is weak, the whole thing misbehaves. A vague description makes the model reach for the tool at the wrong time. A loose schema makes the model invent arguments. An unstructured error makes the model guess why it failed.

This is why the phrase "the model is your user" is worth taking seriously. You are not writing for a human reading a menu. You are writing for a reasoning system that reads your description and your schema and decides, in milliseconds, whether and how to use your tool. The quality of that decision is largely determined by the quality of your contract.

## Path A: register a custom tool

The minimal registration node is short, and it is the same shape for tools of any size:

```ts
ctx.tools.register({
  name: 'read_local_file',
  description: 'Read a text file from the workspace',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Relative path' },
    },
    required: ['path'],
  },
  async execute(args) {
    try {
      return { ok: true, content: await fs.readFile(args.path, 'utf8') };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  },
});
```

Read the fields in order. The `name` is what the model sees in the trace and what other tools refer to. Keep it snake_case and stable, because changing it later breaks the model's learned association with the tool. The `description` is steering. The `parameters` is the schema. The `execute` is the implementation.

The `execute` function receives `args`, which is the object the model constructed against your schema. You do not parse anything. You trust the schema and validate at the boundary when it matters. The return value is what the model reasons over, so make it structured and informative.

## Three details that decide quality

Three details separate a tool that works from a tool that is actually good, and all three are about the contract rather than the implementation.

The first is the description, because it is the steering wheel. The model selects tools by description, so describe the tool in terms of side effects and fit. "Read a text file from the workspace" tells the model when to reach for it. "Run a read-only SQL query against the analytics DB" tells the model what kind of query is safe to send. Name the side effects. If the tool mutates state, say so. A tool described honestly is a tool the model uses correctly.

The second is a strict JSON Schema. The schema constrains what the model can invent. Every property needs a type and a description. Mark required fields explicitly. Set enums where the value is one of a few options. The tighter the schema, the fewer hallucinated arguments you have to handle, and the fewer confusing failures you have to debug. A tool with `parameters: { type: 'object' }` and nothing else invites the model to guess.

The third is structured errors. Return `{ ok: false, error }` instead of throwing. When a tool throws, the model often sees a generic failure and cannot tell why. When you return a structured error with the reason, the model can see the problem and retry with different input. This one habit turns a tool that fails mysteriously into a tool that recovers on its own.

## A closer look at the parameters schema

The JSON Schema is worth a little more time, because it is the interface the model reads. Here is a tool with a slightly richer schema:

```ts
ctx.tools.register({
  name: 'query_orders',
  description: 'Run a read-only SELECT query against the analytics database',
  parameters: {
    type: 'object',
    properties: {
      sql: {
        type: 'string',
        description: 'A SELECT query. Read-only only; no INSERT, UPDATE or DELETE.',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 500,
        default: 100,
      },
    },
    required: ['sql'],
  },
  async execute(args) {
    const rows = await db.query('SELECT ... LIMIT ?', [args.limit]);
    return { ok: true, rows };
  },
});
```

Note what the schema communicates beyond types. The `limit` field has a minimum and a maximum, which prevents the model from asking for a million rows. It has a default, which means the model can omit it entirely. The `sql` description warns that the tool is read-only, which steers the model away from sending a destructive statement. None of this is code. It is all information given to the model before it calls anything.

The boundary validation matters on the implementation side. A schema steers the model but does not protect you from a model that produces a malformed argument. The read-only promise should be enforced in `execute` as well, by checking the statement prefix and refusing anything that is not a SELECT. Trust the schema for steering, but treat `args` as untrusted input and validate at the boundary.

## A tool that calls an external service

The same shape scales to anything outside the sandbox. The database query above is one example. An HTTP call is another, and it shows the pattern in a form you will reuse often:

```ts
ctx.tools.register({
  name: 'fetch_github_release',
  description: 'Fetch the latest release info for a GitHub repository',
  parameters: {
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner' },
      repo: { type: 'string', description: 'Repository name' },
    },
    required: ['owner', 'repo'],
  },
  async execute(args) {
    const res = await fetch(`https://api.github.com/repos/${args.owner}/${args.repo}/releases/latest`);
    if (!res.ok) {
      return { ok: false, error: `GitHub returned ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, release: data.tag_name, published: data.published_at };
  },
});
```

The external call introduces a few new concerns. Timeouts matter, because a hanging HTTP call stalls the model's turn. An API key, if the service needs one, should come from an environment variable rather than the config file. The result should be trimmed to what the model needs, rather than the raw response, because a giant JSON blob burns tokens and dilutes the signal. The structured return in this example picks out `tag_name` and `published_at` and returns exactly those, which is the kind of discipline that keeps a tool cheap and precise.

## Path B: wrap an existing MCP server

Path A is for capabilities you implement. Path B is for capabilities that already exist as an MCP server. MCP, the Model Context Protocol, is a standard way for tools to be exposed to agents over stdio or HTTP. There is a large ecosystem of MCP servers, filesystem, database, web scraping, and most of them you do not want to re-implement.

The wrapper idea is simple. Instead of rewriting the server's logic, you start the server and register its tools on `ctx`. The server keeps doing its job over the protocol, and dsh sees each of its tools as a normal tool. The model never knows it is talking through a bridge.

```ts
import { startMcpClient } from '@dsh/mcp';

export async function apply(ctx) {
  const client = await startMcpClient({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', './'],
  });
  const tools = await client.listTools();
  for (const tool of tools) {
    ctx.tools.register({
      name: `mcp_${tool.name}`,
      description: tool.description,
      parameters: tool.inputSchema,
      execute: (args) => client.callTool(tool.name, args),
    });
  }
}
```

Walk through the flow. The client starts the server process via npx. `listTools` asks the server what it exposes. Each tool is then registered on `ctx` with its name, description, and schema copied from the server, and an `execute` that forwards the call. The name prefix `mcp_` is a namespace choice, so these tools are visually distinct from native ones in the trace.

For remote servers, the shape changes slightly. You pass a `url` instead of `command` and `args`:

```ts
const client = await startMcpClient({
  url: 'https://mcp.example.com',
});
```

Either way, the model now sees one more tool in its toolbox, with zero protocol work on the model side and zero protocol work on your side beyond the wrapper. The bridge is where the translation happens, and the bridge is the plugin.

## Why wrapping beats re-implementing

The honest reason to prefer Path B when a server exists is maintenance. An MCP server is maintained by its own project, with its own tests, its own fixes for protocol changes, its own feature evolution. When you wrap it, you inherit that maintenance. When you re-implement it, you own it forever.

The second reason is coverage. A mature server exposes many tools, and the loop over `listTools` registers all of them at once. Re-implementing the same surface by hand is a large, ongoing chore. The wrapper turns the whole surface into a few lines.

The third reason is compatibility with the ecosystem. If a new server tool appears, the wrapper picks it up on the next start without a code change. Your plugin does not need to know the server's internal roadmap. It forwards the current surface, whatever that is.

## Security considerations for MCP servers

Wrapping a server is convenient, and it deserves the same caution as any other code you run, plus a little more. An MCP server is a separate process with its own permissions, and `npx` will download the server package if it is not already present. That download is the supply chain moment. Review the server's source and publisher before wrapping it on a machine that matters.

The filesystem server in the example is given `./` as its root. That is a deliberate scope. A filesystem server launched with a narrow root can only reach files under that root. Launch one with `/` and it can reach everything. The scope you pass at launch time is your access control, so pass the narrowest root the task allows.

Remote servers over `url` add a network trust dimension. You are sending your prompts' tool calls to a third-party host. If the host logs requests, your data leaves the machine. Only wrap remote servers you control or that you have reviewed. For anything involving credentials, prefer a local server or a tool you implement yourself.

## Command, tool, or wrapped server: deciding

By now the decision tree is worth writing down, because it answers the recurring question of which primitive to reach for. Ask who triggers it. A person triggers commands. The model triggers tools. Then ask whether the capability already exists as an MCP server. If it does, wrap it. If it does not, implement it as a custom tool.

There is a refinement worth adding. A wrapped server gives you many tools, but each tool still needs a good description and schema, and servers vary in how well they describe themselves. If a wrapped tool's description is weak, the model will underuse it. In that case the fix is not a rewrite of the server. It is a thin re-registration with a better description, still forwarding the call to the server underneath.

The other refinement is cost. Every tool you register is visible to the model on every relevant task, and a long tool list is tokens and decision noise. Register only the tools that serve your actual workflows. A filesystem server that exposes forty operations is a lot of signal. If you only use three, consider registering those three with careful descriptions instead of the whole surface.

## Verify end to end

Start dsh, open a session, and ask the model to do something that requires the tool. For the filesystem server, ask "what is in ./package.json?". For the custom reader, ask the same question and watch which tool the model picks.

The trace tells you a lot. You will see the model read your description, choose your tool, fill the parameters, and call `execute`. Then you see the result come back and the model answer from it. If the model picks a different tool than you expected, read its description again. If the model invents parameters, tighten the schema. If the model calls the tool and misreads the result, restructure the return value.

The loop is the point. You are not just checking that code runs. You are checking that the contract you wrote is legible to a model, which is a different standard than "it compiles". A tool that runs perfectly but is never chosen by the model is a tool with a bad description. A tool that is always chosen but fails on real input is a tool with a bad schema or bad error handling. The end-to-end test is where both failures surface.

## Debugging common failures

The first class of failure is a tool that is never called. The model talks past it. The fix is almost always the description. Write it from the model's perspective, describe the side effect, and mention the kind of task that fits.

The second class is a tool that is called with wrong arguments. The fix is the schema. Add descriptions to properties, set enums where values are limited, mark required fields, and add ranges to numbers. The model fills what the schema makes unambiguous.

The third class is a tool that throws or hangs. The fix is structured errors and timeouts. Wrap the implementation so it returns `{ ok: false, error }` instead of throwing. Add a timeout to any external call. A tool that returns a clear error lets the model recover. A tool that throws leaves the model guessing.

The fourth class is the environment one. The tool works in a script but not in dsh. Check that the tool has access to the same environment the agent runs in, which usually means the same working directory, the same environment variables, and the same permissions. The tool inherits the process environment, and a missing key or a different cwd produces failures that look like logic bugs.

## A complete worked example: a todos tool

Theory is cheap. Let me build one tool end to end, from schema to verification, so the pieces land in a single picture. The tool is a simple todos tracker. The model can add a task, list tasks, and mark one done. Three capabilities, and the natural shape is three tools sharing one storage file.

```ts
import { readFile, writeFile } from 'node:fs/promises';

const FILE = './todos.json';

async function load() {
  try {
    return JSON.parse(await readFile(FILE, 'utf8'));
  } catch {
    return [];
  }
}

async function save(todos) {
  await writeFile(FILE, JSON.stringify(todos, null, 2));
}

export function apply(ctx) {
  ctx.tools.register({
    name: 'todo_add',
    description: 'Add a task to the shared todo list. Use for any new task a user asks to remember.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The task description' },
      },
      required: ['text'],
    },
    async execute(args) {
      const todos = await load();
      todos.push({ id: todos.length + 1, text: args.text, done: false });
      await save(todos);
      return { ok: true, id: todos.length, total: todos.length };
    },
  });

  ctx.tools.register({
    name: 'todo_list',
    description: 'List all tasks in the shared todo list, with their done state',
    parameters: { type: 'object', properties: {} },
    async execute() {
      return { ok: true, todos: await load() };
    },
  });

  ctx.tools.register({
    name: 'todo_done',
    description: 'Mark a task as completed by its id',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'The task id returned by todo_add or todo_list' },
      },
      required: ['id'],
    },
    async execute(args) {
      const todos = await load();
      const found = todos.find((t) => t.id === args.id);
      if (!found) {
        return { ok: false, error: `No task with id ${args.id}` };
      }
      found.done = true;
      await save(todos);
      return { ok: true, task: found };
    },
  });
}
```

Read what this bundle communicates to the model. The descriptions tell the model when each tool fits. `todo_add` says "any new task a user asks to remember", which is the signal that makes the model volunteer to track a task instead of just answering. `todo_done` explains where the id comes from, which prevents the model from inventing one. The `todo_list` tool takes no parameters, and an empty properties object is exactly right for it.

The storage is a plain JSON file, and the pattern around it is worth copying. `load` tolerates a missing file, so the first call creates the list from scratch. `save` writes atomically enough for this scale. The error in `todo_done` is structured, so the model can see that the id was wrong and retry with a real one from the list.

This is a real, useful tool set, and it took about forty lines. It also demonstrates the rule of thumb from earlier: small, single-purpose tools with honest descriptions beat one big tool with a vague one.

## The craft of writing descriptions

Descriptions are the only part of your tool the model reads before deciding to call it, so they deserve deliberate attention. The craft has a few rules I have learned by watching models misuse my own tools.

Write from the model's perspective, not from the function's. "Returns an array of order objects" describes the implementation. "Use this to check recent orders, e.g. how many orders shipped this week" describes when to reach for it. The model does not care about your return type. It cares about whether this tool moves the current task forward.

Name the side effects explicitly. If a tool mutates state, say so in the description, and say which state. A model that sees "Append a line to NOTES.md" will not call the tool when the user asked for a read. A model that sees "Update the notes" might call it anywhere. The difference is one clause in the description.

Give one concrete example of a fitting task. Models generalize well from examples, and one example in the description is worth two paragraphs of abstraction. "Use for any new task a user asks to remember" from the todos tool is exactly this. It is not a list of edge cases. It is one clear signal.

Keep the description tight. A paragraph that rambles gets summarized by the model, and the summary may lose the part that mattered. Two or three sentences that say what the tool does, what side effects it has, and when to use it is the sweet spot.

## Structured results, done properly

The return value is what the model reasons over, and a good result is a small, honest JSON object. The discipline is to return what the model needs and nothing more.

Return a shape with an `ok` field. It gives the model a fast path to decide whether the call succeeded. Then include the data the task actually needs. The GitHub release example returned `tag_name` and `published_at`, not the whole API response. The todos tools return the minimum the model needs to continue, an id, a total, or the list itself.

Trim verbose output at the source. If your tool reads a file, consider returning a slice when the file is huge. If your tool queries a database, cap the rows. A tool that dumps a megabyte of JSON forces the model to spend its context budget on your output instead of on the task. The `limit` field in the orders example is a practical instance of this.

Keep the error shape consistent across all your tools. If every tool returns `{ ok: false, error }` on failure, the model learns one recovery pattern and applies it everywhere. Mixed error shapes force the model to relearn per tool, and that is where retries start to misbehave.

## Tool names and namespaces

Tool names are a shared namespace, the same way command names are. The `todo_` prefix in the worked example is not decoration. It groups three related tools under one owner, which helps the model understand they share state, and it keeps them distinct from tools other plugins register.

Choose names that read like actions. `todo_add`, `fetch_github_release`, `read_local_file`. The verb first, the object second. This reads naturally in the trace and gives the model a consistent naming grammar to infer from.

Stability matters. The model forms associations with tool names over many turns and many sessions. Renaming a tool means the model has to relearn it, and older sessions may still reference the old name. Pick names you can live with, and when you must rename, keep a deprecated alias for a while.

## Parallel calls and tool dependencies

Real agent runs rarely call one tool. The model may list orders and then fetch a release in the same turn, and modern models issue several tool calls in parallel when the tasks do not depend on each other.

Design your tools to be safe under parallel calls. A tool that reads is naturally safe. A tool that writes to the same file from two parallel calls is a race. The todos example sidesteps most of it because the model usually adds one task at a time, but a heavy write tool should use a proper file lock or a small queue. If you build tools that mutate shared state, assume they can be called concurrently and handle it.

Dependencies between tools are expressed by the model, not by you. The model calls `todo_list`, sees the ids, then calls `todo_done` with a real id. Your job is to make each tool self-sufficient and honest about its inputs, so the model can chain them. A tool that silently depends on state another tool created, without saying so in its description, produces confusing failures.

## Testing a tool without a model

You do not need a model to test a tool, and you should not wait for one. The `execute` function is plain code with a defined input and output, so you can test it directly.

The fastest harness is a short script that imports your registration and calls `execute` with hand-written args:

```ts
import { apply } from './src/index';
import { createContext } from '@dsh/test';

const ctx = createContext();
const captures = [];
ctx.tools.register = (t) => captures.push(t);

await apply(ctx, {});
const add = captures.find((t) => t.name === 'todo_add');
console.log(await add.execute({ text: 'buy milk' }));
console.log(await captures.find((t) => t.name === 'todo_list').execute());
```

The trick is a fake `ctx` that captures registrations instead of installing them. Then you call each tool's `execute` with realistic arguments and check the returns. This catches schema typos, file path bugs, and error-shape mistakes before a model ever sees the tool.

Add the same coverage for the bad path. Call `todo_done` with a nonexistent id and confirm you get the structured error. Call the GitHub tool with a bad repo and confirm it reports the status code. The error path is where tools actually break, and it is the cheapest to test.

## Reading the trace to improve a tool

Once a tool runs with a real model, the trace becomes your best feedback channel. Every call shows the arguments the model chose and the result it received. Read it like a reviewer, not like a bystander.

If the model always fills `limit` at its maximum, the default is wrong and your schema is steering toward expensive calls. Lower the maximum or raise the default to what real tasks need. If the model consistently passes a field you never use, remove it from the schema and shrink the surface. If the model reaches for a different tool than yours, your description is losing the competition, and the fix is in the words, not the code.

The trace also shows retries. A tool that gets called twice in a row, with the second call slightly different, is a tool whose error message did not explain the fix. Improve the error to name the correction. "No task with id 12" is better than "invalid id", because the model can see that 12 was real and the list changed underneath.

## Where tools appear in real plugins

The patterns in this tutorial are not hypothetical. They are the shape of real plugins in the ecosystem. The modlens plugin registers a vision tool that returns structured JSON evidence, and the model answers from that evidence instead of from raw pixels. The dsh-data-agent plugin wraps a database and lets the model ask questions in plain language, translating the question into a query through a tool contract. Both are Path A and Path B applied to specific domains, and both are worth reading after this tutorial.

The skill tutorial shows the next step up. A skill packages a prompt fragment with the tools it needs, so that a whole procedure, not just a single call, becomes one intent. Tools are the pieces. Skills are the playbooks. This tutorial gives you the pieces. The skill tutorial shows you how to assemble them.

## A checklist before you ship a tool

Before a tool earns a place in a real workflow, run it through a short checklist. Each item catches a specific class of failure, and the list is short enough to run on every tool.

Description reads like a decision aid, not an implementation note. Does it say what the tool does, what it mutates, and when to use it? If you cannot answer all three from the text, a model cannot either.

Schema matches the implementation. Every property the schema promises is actually read in `execute`. Every field `execute` expects is described in the schema. The required list is honest. Numbers have ranges where ranges make sense.

Errors are structured and instructive. Every failure path returns `{ ok: false, error }` with a reason that names the fix. Nothing throws. External calls have timeouts.

Result is trimmed. The return value is JSON the model can reason over, not a blob dump. It has an `ok` field and the minimum data the task needs.

Name is stable and namespaced. The name is a verb-first action that will not change next week, and it is prefixed enough to avoid collisions with other plugins.

Concurrency is considered. A tool that mutates shared state is safe under parallel calls, or it handles the conflict explicitly.

Tested without a model. The `execute` function has been called directly with realistic arguments, including the error path, so the contract is proven before any model sees it.

Environment is declared. The tool's dependencies, the working directory it expects, and any environment variables it reads are documented in the plugin README, so a user who hits an environment failure can diagnose it.

The checklist is not bureaucracy. Each line is a failure I have watched happen, in my own tools and in others'. A tool that passes the list still needs end-to-end verification with a real model, but it starts that verification already legible, and that is the difference between a tool that needs three debug rounds and one that works on the first try.

## The takeaway

Two paths, one contract. Implement your own capability with `ctx.tools.register`, a description that steers, a schema that constrains, and errors the model can read. Wrap an existing capability with `startMcpClient`, register what the server exposes, and inherit its maintenance instead of owning it. Either way the model ends up with one more tool, and the agent gets one step closer to acting instead of answering. The difference between a chatbot and an agent is exactly this: tools it can call, described well enough that it calls them at the right time, and robust enough that it recovers when they fail.
