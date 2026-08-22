## One sentence: everything is a plugin

DeepSeek Harness, which everyone shortens to dsh, is built around a single idea. The CLI, the web UI, tools, commands, skills, MCP servers, LLM adapters and cron jobs are all plugins. A plugin is just a JS or TS module that exports `apply(ctx, config)`. That sentence is the whole mental model. Once you internalise it, every extension point in dsh becomes the same skill with a different registration call, and the difference between a beginner and an advanced dsh user is mostly how many of those registration calls they have memorised.

Let me slow down and make that concrete, because the phrase "everything is a plugin" gets repeated a lot and repeated phrases stop meaning anything. When you run `dsh web`, the screen you see is itself produced by a plugin. When the model calls a tool, the tool you see in the trace is a registered plugin capability. When you type a slash command, a plugin command handler answers. The agent loop that decides which tool to call next is a plugin too. There is no hidden core that is off limits. There is `apply(ctx, config)` and there is the context object that hands you the capabilities.

This matters for a practical reason. In most tools you learn one SDK for the UI, another for the CLI, a third for automation. In dsh you learn one contract and reuse it everywhere. The same module that registers a slash command can also register a cron job, because both are just registrations on the same `ctx`. That compression is what makes dsh worth learning in the first place, and it is the reason this tutorial exists.

## The plugin contract: apply(ctx, config)

Every dsh plugin, without exception, exports a function called `apply`. The signature has two parameters. The first is `ctx`, which is your handle to the whole harness. The second is `config`, which is whatever the user supplied when they installed your plugin. Here is the smallest plugin that does anything at all:

```ts
export function apply(ctx, config) {
  ctx.log('my-first-plugin activated');
  ctx.commands.register('hello', {
    description: 'Say hello from your first plugin',
    action: () => `Hello from ${config.name ?? 'my-first-plugin'}`,
  });
}
```

Read that file top to bottom. The export statement makes `apply` discoverable. The first line inside writes to the dsh log, which is how you confirm your plugin actually loaded. The second line registers a slash command called `hello`. When a user types `/hello` in the web UI, the `action` function runs and returns the greeting string.

There are no other lifecycle hooks you are required to implement. No `init`, no `mount`, no `destroy`. If dsh can find `apply`, it calls it once when the profile starts, and everything your plugin is comes from what you register during that single call. The lack of ceremony is the point. A plugin that does nothing except log a line is a valid plugin, and it is a useful diagnostic to have in your toolbox, because it tells you immediately whether the install pipeline worked.

What can you register on `ctx`? The short answer is almost everything the harness can do. Tools, commands, skills, MCP servers, lifecycle hooks, model adapters, cron jobs, UI panels, and session storage access all hang off `ctx`. You do not need to learn all of them at once. Start with commands, because they are the easiest to see working.

## The manifest: package.json declares dsh.bundle

Here is the first trap for beginners. You can write a perfect plugin file, install it, and nothing happens, because dsh does not treat every package it installs as a plugin. A package becomes an active profile layer only when it declares a `dsh` field in its package.json, specifically `dsh.bundle.patch`. Without that declaration, the package installs fine and sits there inert.

```json
{
  "name": "my-first-plugin",
  "version": "0.1.0",
  "type": "module",
  "main": "index.ts",
  "dsh": {
    "bundle": {
      "patch": ["index.ts"]
    }
  }
}
```

The `patch` array is the list of entry files that form the profile layer. The array matters because it is an array, not a single string. A more complex plugin can patch multiple files, and each one is loaded and applied in order. For your first plugin, one entry is enough.

The `type: "module"` line matters on modern setups. dsh bundles are ES modules, so your package should declare itself as one. If you omit it, Node falls back to CommonJS semantics and your `export function apply` becomes a syntax error at load time. The error you get is not always obvious, so setting `type: "module"` up front removes a whole class of confusion.

A common question is whether the entry must be TypeScript or plain JavaScript. Both work. dsh compiles the bundle before loading it, so a `.ts` entry is fine and is what most plugins use. If you are writing plain JS, name the file `index.js` and put that name in the patch array. The rest of this tutorial uses TypeScript, because that is what the ecosystem mostly ships.

## Set up the project directory

Create a folder for the plugin and step into it.

```bash
mkdir my-first-plugin
cd my-first-plugin
```

Inside, you need two files to start: `package.json` with the manifest shown above, and the plugin entry. With npm available, the fastest way to get a valid manifest is to run `npm init -y` and then edit the result. The editing matters more than the command, because you are adding the `dsh` block by hand.

```bash
npm init -y
```

Open the generated package.json and add the `type` and `dsh` fields. Then create the entry file with your editor, or with a heredoc if you are on a Unix-like shell:

```bash
mkdir src
cat > src/index.ts <<'EOF'
export function apply(ctx, config) {
  ctx.log('my-first-plugin activated');
  ctx.commands.register('hello', {
    description: 'Say hello from your first plugin',
    action: () => `Hello from ${config.name ?? 'my-first-plugin'}`,
  });
}
EOF
```

The `src` directory is a convention, not a requirement. dsh only cares that the path in `dsh.bundle.patch` matches a real file. If you put the entry at `src/index.ts`, the manifest must say `"patch": ["src/index.ts"]`. If you put it at the root, the manifest says `"patch": ["index.ts"]`. Mismatch between the two is the second most common silent failure, right after the missing `dsh` block, so keep them in lockstep.

## A closer look at the hello command

The `ctx.commands.register` call deserves a closer look, because it is the template for every capability you will register later. The first argument is the command name, typed by the user as `/hello`. Keep it lowercase and hyphen-free for now, because the UI and the parser both treat the name literally.

The second argument is an options object. The `description` string shows up in the command palette and in tooltips. Write it for a person who has never seen your plugin, because that is exactly who will read it. The `action` function is what runs when the command fires. It can be synchronous or async, and its return value is what gets shown to the user.

The action in this example reads `config.name`. That is the second parameter of `apply` leaking through into the command body, and it demonstrates the config flow in miniature. Whatever the user supplied at install time is available inside your action. The `??` fallback means an install with no config still produces a sensible greeting. Always give config a default, because most users will install your plugin without ever opening the config file.

## Install into your web profile

dsh keeps plugin bundles isolated per profile. Profiles live under `$DSH_HOME/profiles/`, and the default home is `~/.dsh`. The web UI runs the `web` profile, which is the one you want for this tutorial.

```bash
dsh plugin --profile web add ./
npx @deepseek-ai/dsh web
```

The first command installs the current directory as a plugin into the web profile. The second starts the web GUI. Wait for the server to report ready, then open `http://127.0.0.1:3080` in your browser.

Two things can go wrong at this point, and both are worth naming. If the install command complains about a missing `dsh` declaration, the manifest is wrong and nothing was installed. If the install succeeds but the GUI shows no sign of your plugin, check that `DSH_HOME` points where you think it does. The `web` profile is resolved from `$DSH_HOME/profiles/web`, so if your shell and your GUI process see different values for `DSH_HOME`, the plugin installs into one tree and the GUI reads another. This is the single most confusing environment bug in the whole workflow, and it is not your plugin's fault. Make `DSH_HOME` explicit before anything else:

```bash
export DSH_HOME="$HOME/.dsh"
```

Then run the install and the GUI from the same shell. If your `~/.dsh` is not where you expect, point `DSH_HOME` at the real location and repeat. The rule is boring but absolute: one value for `DSH_HOME`, one shell, one run.

## What you should see

When the GUI is up, open a session and type `/hello` in the input box. The command palette should list it under the description you wrote. Select it, and the response shows your greeting. If `config.name` was never set, it falls back to `my-first-plugin`, which is proof that the default kicked in.

The other confirmation is in the log. On the CLI side, run the plugin list and you should see your plugin reported as active:

```bash
dsh plugin --profile web list
```

The output shows your plugin name, version, and the source you installed from. For a local install the source is the path you passed, typically `./` resolved to an absolute path. If the entry is missing from the list, the manifest or the patch path is wrong.

There is a subtlety worth understanding about when the plugin loads. Bundles load at profile start, not at the moment you press Enter in a shell. If you install the plugin while the GUI is already running, the plugin does not appear until you restart the GUI. The classic symptom is installing, seeing nothing, and assuming the plugin is broken. It is not broken. Restart `npx @deepseek-ai/dsh web` and refresh the browser, and the command appears. This restart requirement trips up almost every first-time user, including me the first time, so budget it into your workflow.

## Expand the plugin with more capabilities

The hello command is enough to prove the pipeline, but a plugin that only says hello is not useful. Let me show the same `apply` shape growing into something you might actually keep. Add a command that inspects the workspace, and give it a config option.

```ts
export function apply(ctx, config) {
  ctx.log('workspace-tools activated');

  ctx.commands.register('hello', {
    description: 'Say hello to the workspace',
    action: () => `Hello from ${config.name ?? 'dsh'} at ${process.cwd()}`,
  });

  ctx.commands.register('note', {
    description: 'Append a line to NOTES.md',
    async action(args) {
      const fs = await import('node:fs/promises');
      await fs.appendFile('NOTES.md', `- ${args.text}\n`);
      return 'Note saved';
    },
  });
}
```

Two details in this version are worth your attention. The first is the async action. Reading and writing files takes time, and the command system handles async actions natively, so returning a promise is fine. The second is the dynamic import of `node:fs/promises`. Loading the filesystem module lazily inside the action keeps the plugin's startup path fast, and it is a habit that pays off as plugins grow.

The `note` command has an `args.text` reference. Command arguments come from the parser, and a plugin can declare what arguments a command accepts. When the argument shape grows beyond one string, you define parameters and the UI renders a form for them. For now, note that the pattern exists: the action receives `args`, and `args` holds whatever the user typed after the command name.

This command runs with your user's permissions. The `appendFile` call writes wherever the current working directory points, and that is a real power. A command plugin is not sandboxed, which is exactly why the security tutorial in this series exists. For your own plugins this is fine. For third-party plugins, review what their commands write and where.

## Understand what "patch" means

The word `patch` in `dsh.bundle.patch` is worth unpacking, because it explains the mental model of how plugins compose. A profile is a stack of layers. Each installed plugin patches that stack with its entry file. When dsh boots a profile, it applies the patched layers in order, and each layer's `apply` runs and registers its capabilities.

This model has consequences. Two plugins can both register a command named `hello`, and the last one to load wins the name, or the harness rejects the duplicate depending on the registration API. Capability names are a shared namespace, so unique naming matters as soon as you install more than one plugin. Prefix your command names with your plugin name, like `note` becoming `ws-note`, to stay collision-free.

The patch model also means uninstall is clean. Removing a plugin removes its layer, and everything it registered goes away with it. There is no orphaned state to clean up by hand, assuming your plugin does not write files outside its own responsibilities. The `note` command above writes `NOTES.md`, which is not managed by the harness, so uninstalling the plugin leaves the file behind. That is your data, and the plugin correctly does not delete it.

## Configure your plugin

Config is the second parameter of `apply`, and it deserves a section of its own because it is where your plugin becomes reusable. When a user installs your plugin, they can pass a config object. The exact mechanism differs slightly by install source, but the shape is always a JSON object that ends up as `config` in your `apply`.

```bash
dsh plugin --profile web add ./ --config '{"name":"alice","volume":3}'
```

Inside your plugin, `config` is that object, or `undefined` if nothing was passed. The pattern that keeps plugins robust is to merge config over a set of defaults immediately at the top of `apply`:

```ts
export function apply(ctx, config) {
  const opts = { name: 'dsh', volume: 1, ...(config ?? {}) };
  ctx.log(`configured with name=${opts.name}`);
}
```

The spread gives you typed-ish fallbacks in plain JS, and `?? {}` protects against `config` being undefined. Once you have `opts`, pass values from it into your registrations instead of hard-coding. The hello command already does this with `config.name`. The benefit is that the same plugin file can serve many users with different names and settings, which is the entire point of making config a first-class parameter.

One rule about config: keep secrets out of it. A config object is stored in a file on disk and is not an encrypted vault. If your plugin needs an API key, read it from an environment variable or a local credential file, and treat the config value as a non-secret hint. This is a line I wish more plugin authors drew early.

## Verify, then compare against the Hub

If nothing happened after a restart, work the checklist in order. First, confirm `dsh plugin --profile web list` shows your plugin. If it does not, the manifest is wrong, and the fix is in package.json. Second, confirm the patch path matches the real file. Third, confirm the entry exports `apply` as a named export, not a default export. dsh looks for the named export specifically, and a default export compiles cleanly but never activates.

Once the command runs, the loop is closed. You have built, installed, and verified a dsh plugin. The next step is to look at plugins that do more. Browse the Top Rated list on this site, open a plugin you admire, and read its code. Every one of them is the same shape you just built: a module exporting `apply(ctx, config)`. The only difference is what they register on `ctx`. A plugin that renders a dashboard registers panels. A plugin that queries a database registers tools. A plugin that sends notifications registers hooks. Same contract, different registrations.

The fastest way to grow from here is to take one of the tutorials in this series and build along with it. The MCP tutorial shows how to wrap an existing server into a tool set. The slash command tutorial goes deeper on commands and arguments. The tool tutorial covers the JSON Schema contract that the model uses to choose and call your tool. Each one layers one new registration on top of the `apply` skeleton you have now working.

## Where your plugin shows up in the web GUI

A new user often asks where their plugin is on screen. The honest answer is that it depends on what the plugin registers, and a command plugin is mostly invisible until you use it. The places to look are the command palette, the settings plugin list, and the log.

Open a session and type `/`. The palette lists every registered command. Yours appears with the description you wrote, which is why a good description matters more than it seems. The settings page has a plugin section that lists what is active in the current profile, with your plugin name, version, and source. The log is the least glamorous and the most useful. On the CLI, plugin activation lines are printed during startup. If your `ctx.log` call fired, its text is there.

None of these surfaces is a dashboard for your plugin. They are observability points. The command palette is how users find your commands. The settings list is how they confirm installs. The log is how you debug. Learn to check all three in that order, because each one answers a different question about whether your plugin is alive.

## The default export trap

The checklist mentioned named exports in passing. The trap deserves its own section, because it produces the most confusing no-op in the whole ecosystem. Consider this file:

```ts
export default function apply(ctx, config) {
  ctx.log('this never fires');
}
```

This compiles. It installs. The plugin appears in the list. Nothing happens. dsh looks for a named export called `apply`, and a default export does not satisfy that lookup. The bundler does not throw, because a default export is legal JavaScript. Your plugin is silently skipped.

The fix is mechanical. Change `export default` to `export function apply`. If your editor autocompletes `apply` from a template, check which export keyword it used. I have burned an afternoon on this exact mistake, and I now write the export keyword first as a habit.

The related trap is exporting a renamed function:

```ts
function init(ctx, config) { ... }
export { init };  // wrong name
```

The harness does not scan for "the function that looks like apply". It imports the exact name. If you rename it, you must export it as `apply`:

```ts
export function apply(ctx, config) { ... }
```

Two sentences to remember. Named export, exact name `apply`. Everything else in the file is your business.

## A real debugging session, start to finish

Let me walk through a real failure so the checklist has context. This is the sequence I actually hit the first time I wrote a plugin, and it is the canonical version of the experience.

I created my plugin, installed it, started the GUI, and typed `/hello`. The palette showed nothing. My first assumption was that the plugin had not installed, so I ran `dsh plugin --profile web list`. The plugin was there, version and all. That ruled out the install step.

Next I checked the log. The activation line from `ctx.log` was missing, which told me `apply` had never run. A loaded plugin whose `apply` never fires points at the export shape. I opened my entry file and found `export default function apply`. There it was, the exact trap from the previous section. I changed it to a named export, restarted the GUI, and `/hello` appeared.

The second time I hit a failure, the plugin was not in the list at all. That narrowed it to the manifest. I opened package.json and found the `dsh` block pointed at `src/index.ts`, but I had created the file at the project root. The patch path and the real path disagreed. I moved the file, or changed the manifest, and the plugin listed itself.

The third failure was the environment one. The plugin was listed, the export was correct, the log fired, and the GUI still showed nothing. The cause was a `DSH_HOME` mismatch between the shell where I installed and the shell where I started the GUI. I exported `DSH_HOME` explicitly in one shell, ran both commands from it, and everything appeared.

Three failures, three causes, three fixes. None of them was a bug in my plugin logic. The fastest path through any of them is the same: check the list, check the log, check the export, check the paths. Write those four checks on a sticky note and you will never waste an hour on a plugin that will not load.

## Three install sources compared

So far you have installed a local directory with `dsh plugin --profile web add ./`. That is one of three source types, and the other two matter as soon as you share or consume plugins.

The npm source pulls a published package. The spec is a package name, optionally with a version:

```bash
dsh plugin --profile web add @scope/my-plugin
dsh plugin --profile web add @scope/my-plugin@1.2.3
```

The GitHub source pulls a repository by owner and name, and the repository can ship its own bundle without an npm release:

```bash
dsh plugin --profile web add github:owner/repo
dsh plugin --profile web add github:owner/repo#main
```

The local source is the path you already used. It is how you develop, because it points at the code you are editing, and re-running the add command after changes re-applies the layer.

The choice of source changes how a plugin updates. An npm install can be re-run to pull a newer published version. A GitHub install tracks the repository, and the `#ref` suffix pins a branch, tag, or commit. A local install is whatever is on disk right now. For your own development loop, local is the only one that makes sense. For the plugins you install from the Hub, GitHub is the common default because most dsh plugins are distributed as repositories.

## Version pinning and reproducible installs

Installing a plugin is running a small build and load step. For plugins you depend on, you want that step to be reproducible, which means pinning what you install. A floating install like `github:owner/repo` grabs the latest default branch at install time. The next install, even tomorrow, can pick up a different commit. That is fine for exploring and risky for the plugins your workflow depends on.

Pin by tag or commit when the source supports it:

```bash
dsh plugin --profile web add github:owner/repo@v1.2.0
dsh plugin --profile web add github:owner/repo@a1b2c3d4e5f67890abcdef0123456789abcdef01
```

For npm packages, pin the version:

```bash
dsh plugin --profile web add @scope/my-plugin@1.2.3
```

The reproducibility argument goes beyond version numbers. When a plugin runs its build step at install time, you are trusting the repository to do something reasonable with your machine. A pinned commit means you are trusting that specific snapshot, which you can review before installing and audit after. The security tutorial in this series goes much deeper into this, including how the Hub's Security Watch tracks recently updated repositories as an early warning.

## Update and remove

Managing a plugin is as important as installing it. Updating pulls a newer version from the same source. The exact command follows the plugin surface, and the general shape is:

```bash
dsh plugin --profile web update my-first-plugin
```

For a plugin you installed from GitHub, updating re-resolves the source, which is where pinning pays off: a pinned install updates only when you deliberately move the pin. An unpinned install updates to whatever the branch head is now, which may or may not be what you want on a given day.

Removing a plugin is the inverse of installing:

```bash
dsh plugin --profile web remove my-first-plugin
```

Removal takes the layer out of the profile stack. Everything the plugin registered goes with it. The `NOTES.md` example from earlier is the honest exception: files your plugin wrote outside the harness are yours and are not deleted. If you built a plugin that writes state, be explicit in its README about what it stores where, so users know what removing the plugin leaves behind.

After an update or remove, remember the restart rule from earlier. The profile layer applies at profile start. Restart the web GUI and refresh before judging whether the change took effect.

## The permission model in plain terms

Your plugin runs with your user's permissions, and that sentence deserves to be fully understood. When the model calls a tool your plugin registered, the tool's code runs as the user who started dsh. When a command writes a file, it writes with that user's file permissions. There is no separate sandbox, no jail, no token-limited child process.

This is a feature and a responsibility. It is a feature because it lets plugins do real work, read the workspace, touch the database, invoke external CLIs, all with your normal authority. It is a responsibility because the authority is exactly the authority of your shell. A plugin you install from the Hub is code that can do anything you can do.

The practical rules follow from that. Review the source of any plugin before it touches a machine that matters. Pin versions so a later review matches what you run. Prefer plugins that declare what they read and write. And when you build your own, treat your own plugin with the same respect, because your users will be granting it the same trust.

## Multi-entry bundles and how plugins compose

The `patch` array accepts more than one entry, and larger plugins use that. A plugin might split its entry into a main file plus a UI file, or a command set plus a background worker. Each entry is loaded and its `apply` called, in array order.

```json
{
  "dsh": {
    "bundle": {
      "patch": ["src/index.ts", "src/ui.ts"]
    }
  }
}
```

The composition story goes beyond one plugin. A profile is a stack of layers from many plugins, each patching the same harness. This is how a single dsh install can gain a UI skin, a database tool, and a notification hook, all from separate repositories, all coexisting. The shared namespace rule from earlier is what keeps the stack sane: unique capability names across plugins, and stable names within a plugin.

If your plugin grows large, split it the way dsh itself is split. Keep the entry that registers capabilities, and move the heavy logic into modules your entry imports. The patch array is for separate loadable layers, not for every file in your project. One entry per layer, one layer per responsibility.

## Command or tool: which do you build

By the time you have the hello command working, the natural question is when to build a command versus a tool. The short version is who triggers it. A command fires when a person types it or picks it from the palette. A tool fires when the model decides a capability would help with the current task.

Build a command when a human should decide. Renaming files, writing notes, running a report, these are person-driven actions. Build a tool when the model should decide. Reading a file for context, querying a database mid-task, calling an API to resolve a question, these are model-driven actions.

The registration shapes are similar, which is the point. `ctx.commands.register` and `ctx.tools.register` both take a name and an options object. The tool options add a `parameters` JSON Schema and an `execute` function instead of an `action`. Once you understand the command shape, the tool shape is a short step, and the tool tutorial in this series walks through it in detail.

## The mental model, restated

Let me close by restating the one sentence, now with the weight it carries. Everything is a plugin. The plugin is a module that exports `apply(ctx, config)`. The manifest line `dsh.bundle.patch` is what makes the module a plugin instead of a dead package. The profile is where plugins live, and `$DSH_HOME/profiles/web` is the one you installed into. The `ctx` you receive is the whole harness, and what you register on it is what your plugin becomes. Keep a copy of the hello plugin somewhere you can find it, because it is the fastest way to test that your dsh installation works, and it is the skeleton every larger plugin you write will start from.
