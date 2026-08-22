<!-- CONFIG -->

The sidebar is the first thing most people change in a harness. Out of the box the left strip shows four tabs: files, terminal, git, and subagents. That layout works, but it is fixed. DSH-better-sidebar (repo omdsh-dev/DSH-better-sidebar) turns that fixed strip into an extension point. Any third party plugin can register its own tab next to the built-in ones. This writeup covers the config half of that trick. The code half and the scoring highlights are separate sections.

Start with what a DSH plugin actually is. A plugin is a JS or TS module that exports one function, apply(ctx, config). That is the whole contract. The harness calls your apply once during startup, hands you a context object and your config, and you either mount UI or return. No magic. The config dimension is where you declare that this module is a plugin, where you choose a profile, and where you tune the options object your own apply() will receive.

Installing is one command. For a web profile it looks like this:

```bash
dsh plugin --profile web add github:omdsh-dev/DSH-better-sidebar
```

The harness clones the repo, reads package.json, looks for the dsh bundle section, and wires the entry file into the web build. A couple of seconds later you can confirm it took:

```bash
dsh plugin --profile web list
dsh plugin --profile web inspect omdsh-dev/DSH-better-sidebar
```

inspect is worth running once. It prints the resolved entry file, the declared hooks, and the config schema the plugin declares. If the entry file shows as missing, you skipped the patch field. That is the single most common failure, and it fails silently, so inspect is your friend.

The reason a plugin exists at all is the package.json declaration. This is the minimum that makes the module loadable:

```json
{
  "name": "dsh-better-sidebar",
  "version": "0.4.2",
  "type": "module",
  "main": "dist/index.js",
  "dsh": {
    "bundle": {
      "patch": ["src/index.ts"]
    }
  }
}
```

Two things matter here. First, the dsh.bundle.patch array. Without it the harness never treats the package as a plugin, no matter how clean your apply() is. Second, the entry file is a TypeScript source in patch. The harness compiles it into the web client bundle at startup. That is why UI plugins work without a separate build step on your side. You ship source, the harness patches it in.

Now the config object. DSH-better-sidebar reads a small options block from your dsh.config.ts. The plugin declares a schema, and the harness validates your config against it when the web client boots. A realistic setup looks like this:

```ts
// dsh.config.ts
export default defineConfig({
  plugins: {
    "omdsh-dev/DSH-better-sidebar": {
      enabled: true,
      position: "left",
      tabs: {
        files: { order: 0, show: true },
        terminal: { order: 1, show: true },
        git: { order: 2, show: true },
        subagents: { order: 3, show: true },
        metrics: { order: 4, show: true, icon: "gauge" }
      },
      collapseAfterMs: 5000,
      defaultCollapsed: false,
      customTabsPath: "./sidecar-tabs.ts"
    }
  }
});
```

Read that block top to bottom. enabled toggles the plugin without uninstalling. position pins the whole sidebar to the left or right. tabs lets you reorder or hide the built-in tabs. metrics is a tab the plugin itself ships, and customTabsPath points at a file where you can define your own tab outside the plugin repo. That last one is the quiet killer feature. You never touch the plugin source, you only extend it.

Three config values tend to bite people. collapseAfterMs auto-folds the sidebar after idle time; if you work in a narrow window, set it to 0. defaultCollapsed matters on small screens because a six-tab sidebar eats width. customTabsPath, if wrong, throws at boot and the sidebar falls back to defaults, so keep the path relative to the project root and verify it with ls before you restart.

There is one more config surface, the profile. The web profile controls the browser client. There are other profiles for desktop and headless workflows, and a plugin that is only declared for the web profile simply will not load in others. If your team runs the same config across machines, keep plugin installs per profile and check dsh plugin --profile web list after every machine change.

The usual mistake chain goes like this. Someone clones the repo, edits dsh.config.ts, restarts, and the new tab is missing. They blame the plugin. In reality either the package.json patch array was empty, or the profile flag pointed at the wrong profile, or the config key was misspelled. All three produce the same symptom: nothing renders. So the config debugging order is package.json first, profile second, key spelling third. This plugin is popular partly because when you get the config right, the result is immediate and visible, a new tab appears in the strip within one reload.

That visibility is also why the sidebar is the best teaching ground for DSH UI plugins. Config is only the wrapper. What makes the tab appear is code, covered in the next section, and what makes it score well is the highlights section at the end.

There is a second install path worth knowing for teams that mirror repos. If your network cannot reach github.com, you can point the add command at a local mirror or a private registry reference in the same spot where github:owner/repo normally goes. The plugin itself does not care where it came from; only the package.json patch entry matters once it is on disk. Teams that pin versions do this: install once, then record the resolved commit in their runbook so a later plugin update cannot silently change the sidebar under them. The command to read back the resolved reference is the same inspect command, which prints the commit it installed from.

The config object has a merge rule you should understand before you fight it. Per-profile settings win over global ones, and the plugin's own defaults fill the gaps that are left empty. If you set collapseAfterMs to 0 globally but a teammate sets 20000 in their desktop profile, the desktop value wins. If you leave a key out entirely, the plugin default applies. This is the same inheritance model every DSH plugin uses, and it explains why a config that works for one person can look broken for another: the other person is carrying a different profile layer on top. When someone reports a behavior you cannot reproduce, the first question is not about the plugin, it is about which profile they are actually running.

Environment variables are the second input surface. The plugin reads a few at boot, and they exist for cases where a config file is not convenient, like a CI container that boots the web client headless. DSHSIDEBAR_COLLAPSE maps to collapseAfterMs, and DSHSIDEBAR_POSITION maps to position. These take precedence over the config file, which is a trap if you forget you exported them earlier in the same shell session. A quick env | grep DSHSIDEBAR clears that up in seconds, and it is the kind of ghost in the machine that produces a confused issue thread every few months.

Version pinning deserves its own paragraph. dsh plugin add pulls the latest tag by default, and a breaking change in a minor release is exactly the kind of surprise that produces a Monday morning bug report. The recommended flow is to inspect the resolved version after install, then record it. Upgrade deliberately, not automatically. Most teams that adopted this plugin treat the version in package.json like a lockfile entry, and they review the diff before bumping. For a UI plugin, a breaking change rarely shows up as an error; it shows up as a missing tab or a shifted layout, which is far harder to grep for.

The last config distinction is show: false versus a reorder. show: false hides the tab but keeps it registered, so a keyboard shortcut bound to that tab still works. order moves a tab without hiding it. New users often set order to -1 expecting it to hide the tab, then complain the tab is still there. The two are orthogonal. If you want a tab gone, hide it; if you want it moved, reorder it. Knowing this one distinction removes a whole category of "it did not do what I expected" issues, and it is the kind of small semantic that separates docs that help from docs that just repeat the field names.

Real failures, real fixes. These come from issue threads and are worth memorizing:

- Boot error "Unknown plugin key omdsh-dev/DSH-better-sidebar". Your dsh.config.ts uses the repo slug, but the harness wants the package name as declared in package.json. Use the name field, not the slug.
- Tab registers but the strip is empty. The plugin registered after the first paint. This happens when your patch file imports a module that takes longer than the frame budget. Move heavy imports inside mount so the tab shows immediately and content fills in later.
- Custom tab renders twice after hot reload. The sidecar file is loaded both by your plugin and by the harness's own watcher. Guard with a module-level flag or a WeakSet of already loaded ids.
- collapseAfterMs stops working after a skin change. The mousemove listener sits on the root node, and a new skin may replace that node. Re-run bindCollapse after the skin swap via ctx.on("skin-changed").

Each of these has a one-line fix once you know where to look, and they are the reason the debugging order from earlier holds up in practice. When the symptom is a missing tab, the config layer is where you start and usually where you stop.

One more note about the metrics tab the plugin ships. It reads your session stats: token usage, message count, and the active model. There is no per-tab config for it beyond the icon and order keys, which keeps the surface small. If you want a different stat shown, you write a sidecar tab instead of asking the plugin to grow a new option. That is the same extension point pattern applied to your own needs, and it is a good way to tell whether a feature request belongs in the plugin or in your sidecar file.

The sidecar file itself follows a tiny contract. It exports an object with a tabs array, and each entry mirrors the registerTab fields: id, title, icon, order, mount. The plugin does not compile it specially; it reads it with the same resolver it uses for config. The practical consequence is that your sidecar runs with full access to ctx, including the log and notify helpers, so a badly written sidecar tab can crash only itself if it wraps its mount in a try/catch. Keep that in mind if you hand the sidecar file to teammates, and keep a copy in version control so the config and the tabs it loads stay in sync.

<!-- CODE -->

The config section showed where a tab comes from declaratively. Now the real work: the apply() function and the registerTab call. The whole plugin is one exported function plus a handful of DOM helpers. That is the entire surface area, and that smallness is intentional.

Here is the core, trimmed to what matters:

```ts
// src/index.ts
import type { DshContext, DshConfig } from "dsh/types";

export interface BetterSidebarOptions {
  position?: "left" | "right";
  collapseAfterMs?: number;
  defaultCollapsed?: boolean;
  customTabsPath?: string;
}

export function apply(ctx: DshContext, config: BetterSidebarOptions) {
  const position = config.position ?? "left";
  const collapsed = config.defaultCollapsed ?? false;

  ctx.ui.registerTab({
    id: "dsh-sidebar",
    title: "Sidebar",
    icon: "panel-left",
    order: -10,
    mount: (host: HTMLElement) => {
      const sidebar = new Sidebar(host, {
        position,
        collapseAfterMs: config.collapseAfterMs ?? 5000
      });
      return sidebar;
    }
  });

  if (config.customTabsPath) {
    const extra = ctx.resolveConfigPath(config.customTabsPath);
    for (const tab of extra.tabs ?? []) {
      ctx.ui.registerTab({
        id: tab.id,
        title: tab.title,
        icon: tab.icon,
        order: tab.order ?? 50,
        mount: tab.mount
      });
    }
  }

  ctx.on("dispose", () => {
    ctx.ui.unregisterTab("dsh-sidebar");
  });
}
```

Walk through it line by line. The import pulls two types from the dsh package. That import path, dsh/types, is stable across recent harness versions, which means the plugin does not chase internal names. apply() destructures nothing; it reads from the ctx and config objects directly, so a partial config object does not crash the plugin.

The registerTab call is the heart. Four fields matter. id must be unique across all plugins, because the harness keys its internal tab registry by id. title is what shows in the strip. icon names a bundled icon set; "panel-left" is a real entry, and you can pass a raw SVG string instead if you want a custom glyph. order controls placement relative to the built-in tabs, and negative values push the tab toward the front. mount is the contract. The harness gives you a host element, you build your UI inside it, and you return an object with a dispose() method.

That return object matters more than it looks. The harness keeps whatever mount returns, and it calls dispose() on it during teardown or tab close. If you forget to return a dispose, the harness warns and detaches the host element, which usually still works, but event listeners leak. The pattern of return-an-object-with-dispose is the one DSH convention you should never skip.

The customTabsPath branch is where this plugin stops being a tab and starts being a framework. ctx.resolveConfigPath() turns your relative path into an absolute one against the project root. Then the plugin reads a tabs array and registers each entry through the same registerTab contract. That means a user's sidecar file can define a tab with the exact same mount signature as the plugin's own tab. Extension of an extension. No fork needed.

The dispose registration at the end uses ctx.on("dispose", ...). The harness fires this once before the plugin is unloaded, and it is the correct place to unregister tabs and remove global listeners. Doing cleanup in both places, here and in the returned object, is defensive but harmless.

The Sidebar class is where the real DOM work lives. This is a condensed version:

```ts
class Sidebar {
  private root: HTMLDivElement;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(host: HTMLElement, opts: { position: string; collapseAfterMs: number }) {
    this.root = document.createElement("div");
    this.root.className = "dsh-sidebar-root";
    this.root.dataset.position = opts.position;
    this.renderTabs(host);
    host.appendChild(this.root);
    this.bindCollapse(opts.collapseAfterMs);
  }

  private renderTabs(host: HTMLElement) {
    const ids = ["files", "terminal", "git", "subagents"];
    const strip = document.createElement("nav");
    strip.setAttribute("role", "tablist");
    for (const id of ids) {
      const btn = document.createElement("button");
      btn.setAttribute("role", "tab");
      btn.dataset.tab = id;
      btn.textContent = id;
      strip.appendChild(btn);
    }
    this.root.appendChild(strip);
  }

  private bindCollapse(ms: number) {
    if (ms <= 0) return;
    this.root.addEventListener("mousemove", () => {
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.root.classList.add("dsh-collapsed");
      }, ms);
    });
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer);
    this.root.remove();
  }
}
```

renderTabs uses document.createElement instead of innerHTML. That is a deliberate choice, because innerHTML with any interpolated string is an injection vector, and DSH tabs render user controlled labels like repo names and branch names. createElement keeps every label as textContent, which cannot execute markup. For a plugin that displays arbitrary branch and file names, that one decision is a large part of why it passes review.

The tablist role and tab role attributes are accessibility glue. They cost three lines and they make the strip navigable by keyboard. Most UI plugins skip this. This one does not, and it shows up in the scoring.

bindCollapse wires the auto fold. The mousemove listener resets a timer, and when the user stops moving the pointer the sidebar collapses. The data-position attribute on the root lets the skin layer apply left or right specific CSS without any inline styles. Inline styles would beat CSS variables in the cascade, and that would fight the theming system. By keeping all visual decisions in classes, the plugin stays theme agnostic.

dispose() is minimal and correct. Clear the timer, remove the node. The harness already removed listeners tied to removed nodes in modern browsers, so the only leak this plugin owns is the timer, and it kills it.

Error handling lives at the apply boundary. The plugin wraps the sidecar load in a try/catch and logs via ctx.log.warn instead of throwing:

```ts
if (config.customTabsPath) {
  try {
    const extra = await ctx.resolveConfigPath(config.customTabsPath);
    ...
  } catch (err) {
    ctx.log.warn(`sidebar: could not load ${config.customTabsPath}: ${err.message}`);
    ctx.ui.notify("Sidebar: custom tabs skipped", "warning");
  }
}
```

That try/catch converts a hard boot failure into a visible warning. The harness continues, the built-in tabs still render, and the user sees a toast instead of a blank client. For an open source plugin with thousands of installs, that is the difference between a one star review and a patch request.

The pattern to copy from this plugin is: register through ctx.ui.registerTab with a mount that returns a disposable object, build DOM with createElement, keep styling out of inline attributes, and fail soft on optional inputs. Every UI plugin in the ecosystem follows this shape, and the good ones follow this exact order.

Two behaviors the trimmed version left out are worth restoring here: the active tab state and the click handling. Both use a single delegated listener instead of one listener per button:

```ts
private selection: string = "files";

private bindNav(strip: HTMLElement) {
  strip.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-tab]");
    if (!btn) return;
    this.select(btn.dataset.tab!);
  });
}

private select(id: string) {
  this.selection = id;
  this.root
    .querySelectorAll("[data-tab]")
    .forEach((b) => b.classList.toggle("dsh-active", b.dataset.tab === id));
  ctx.ui.emit("tab-selected", id);
}
```

One listener on the strip handles every button, because click events bubble. That is delegation, and it means adding a sixth tab later costs zero new listeners. The closest() call walks up from the click target until it finds an element with data-tab, which lets a nested icon or label inside the button still work. select() flips a class on the matching button and emits an event the rest of the plugin can react to. The emit is optional, but it is how a sidebar stays decoupled: the tab that owns the file list does not have to know the tab that owns the git view.

The metrics tab shows what a real content tab looks like. It reads session stats from ctx and renders them into a list:

```ts
function metricsTab() {
  return {
    id: "metrics",
    title: "Metrics",
    icon: "gauge",
    mount: (host: HTMLElement) => {
      const stats = ctx.session.stats();
      const ul = document.createElement("ul");
      for (const [label, value] of [
        ["tokens", stats.tokens],
        ["messages", stats.messages],
        ["model", ctx.session.model]
      ]) {
        const li = document.createElement("li");
        const k = document.createElement("span");
        k.className = "dsh-metric-label";
        k.textContent = label;
        const v = document.createElement("span");
        v.className = "dsh-metric-value";
        v.textContent = String(value);
        li.append(k, v);
        ul.appendChild(li);
      }
      host.appendChild(ul);
      return { dispose: () => ul.remove() };
    }
  };
}
```

Note what is not here: innerHTML, template strings building markup, or a framework import. Every row is a pair of spans built with createElement. The dispose closes over ul and removes exactly the node it owns. If ctx.session.stats() throws, mount fails and the harness shows the fallback, so even a broken data source does not take down the strip. This tab is the clearest example of the plugin's own rule, because it is short enough to read in one pass and correct in every way that matters.

Mount timing deserves a dedicated note. The harness calls mount lazily in most cases: the tab is created in the registry at startup, but mount only runs when the tab first becomes visible. For a sidebar that means mount fires when the user clicks the tab or when the client opens the sidebar by default. The practical effect is that the file list you see is built on demand, not at boot. This is why the plugin can register six tabs without a visible startup cost. If you write your own tab, keep heavy work inside mount and you inherit the same laziness for free. The one exception is the first paint of the default tab, which the harness mounts eagerly so the sidebar is not empty.

The plugin ships a small test that pins the dispose contract. It mounts the sidebar into a detached div, asserts the nav exists, calls dispose, and asserts the root is gone from the DOM. That test would fail if anyone replaced createElement with innerHTML or dropped the returned object. It is the kind of test that costs twenty minutes to write and saves a support thread every release. The lesson: if your plugin's core promise is "it cleans up after itself," test exactly that.

Error message design is a small craft that this plugin does well. The warn text always includes the config key that failed, like customTabsPath, and the underlying error message from the resolver. A user who sees "could not load ./sidecar-tabs.ts: ENOENT" knows the file is missing without opening the plugin source. A generic "something went wrong" would send the same user to the issue tracker with no details. Prefixing the plugin name in the log line, "sidebar:" in this case, also helps when several plugins log in the same session, because you can filter the log stream by that prefix.

Styling notes round out the code section. The plugin ships a small CSS file injected when the tab mounts, and every selector is namespaced under .dsh-sidebar-root to avoid colliding with the client's own classes. Colors are not hardcoded; they reference CSS variables the skin defines, so the sidebar follows whichever theme is active. The data-position attribute feeds a single ruleset that flips the layout, and the collapse transition is a 150 ms width animation on a CSS class, not a JS-driven style write. Keeping style in CSS and behavior in JS is the boundary this plugin never crosses.

Hot reload symmetry closes the loop. In development you edit index.ts and the harness patches the new module in place. The old tab's dispose runs, then the new mount runs, and because both are keyed by the same id, dsh-sidebar, the registry slot is reused. That symmetry is why the plugin can be developed with a running client instead of restarting it after every change. It is also why the unregisterTab call in the dispose handler is not optional bookkeeping; it is what frees the slot for the next reload.

<!-- HIGHLIGHTS -->

Scoring a UI plugin is different from scoring a logic plugin. Logic plugins either produce the right output or they do not. UI plugins have to be judged on how they feel, how they degrade, and how much they respect the host. DSH-better-sidebar scores high on most of those axes, so the highlights below are grouped by what a reviewer or a maintainer would actually weigh. Each item is a scored criterion with the reasoning.

1. Extension point design, not hardcoded tabs. The plugin could have just drawn five tabs and stopped. Instead it registers one tab through the official ctx.ui.registerTab contract, then re-registers everything else through the same door, including user supplied tabs from a sidecar file. That design decision earns the top score. An extension point beats a fork every time, because users can extend the plugin without maintaining a copy of it. The cost of this choice is a few extra lines in apply(), and the payoff is a plugin that never needs to chase the harness's own tab list.

2. Contract compliance with mount and dispose. Every tab mount returns an object with dispose(). The harness relies on that shape to tear down cleanly. Many plugins in the registry return undefined from mount and leak listeners until the browser tab closes. This plugin follows the convention on every path, including the sidecar branch, where a user defined tab that forgets dispose gets a warning instead of silent behavior. Score reflects that discipline: it does not fight the platform, it works with it.

3. DOM safety with createElement. Branch names, file names, and repo slugs all end up as tab text. Those strings come from outside the plugin. Interpolating them into innerHTML would be a stored XSS vector, one click away from running scripts in the client. The plugin builds every node with createElement and assigns textContent. That is not a style preference, it is the difference between safe and exploitable. Reviewers weight this heavily, and so should you when you copy the pattern.

4. Theme agnostic styling. The root element carries data-position and the skin decides the look. No inline styles, no hardcoded colors. That means the plugin renders correctly under any registered skin, including dark themes and high contrast modes, without a single conditional in the code. Maintainers love this because it removes an entire class of support tickets titled "colors look wrong after I switch skin."

5. Accessibility as a default. The nav uses role="tablist" and each button uses role="tab". Keyboard users can move between tabs with arrow keys and activate with Enter. The collapsed state is announced via the toggle button's aria-expanded. These are three small attributes that the majority of sidebar plugins omit. The scoreboard lists accessibility as a separate line, and this plugin clears it.

6. Graceful degradation on bad input. customTabsPath pointing at a missing file used to be a boot crash in earlier versions. The current code wraps the load in try/catch, logs through ctx.log.warn, and shows a UI notification through ctx.ui.notify. The client boots, the built-in tabs render, and the user sees why. Graceful failure like this is what separates plugins that survive installs at scale from plugins that get uninstalled after the first bad config.

7. Small, readable surface. The entire runtime is one class and one apply function. A new contributor can read the whole plugin in under ten minutes. That readability is itself a feature, because maintainers review smaller diffs faster and users trust code they can follow. Score favors minimalism here, and the plugin does not pad itself with abstractions it does not use.

8. Config that reads like prose. The options object mirrors the mental model: position, collapseAfterMs, defaultCollapsed, customTabsPath. Each key maps to one behavior, and each behavior is visible in the UI within one reload. Config complexity and runtime complexity stay proportional. When a config key exists, it does something obvious; when it is absent, defaults take over. That is the right balance for a plugin whose audience includes first-time DSH users.

9. Explicit ordering control. order as a negative number lets the plugin place itself anywhere in the strip without fighting the harness's internal ordering. Sidecar tabs default to 50, so user extensions sort after the built-in group by default but can still be forced to the front. Small but real control, and it prevents the most common complaint about sidebar plugins, which is "my tab landed in the wrong spot."

10. Stable public types. Importing from dsh/types instead of digging into internal paths means the plugin survives harness upgrades without a churn release. Users notice this as "it keeps working," which is the highest form of praise a UI plugin can get. The scoring rubric has a compatibility line, and this plugin scores it on stability rather than on how often it releases.

Taken together these points explain the star range of roughly 371 to 735. The plugin does not reinvent the sidebar, it opens it. For someone evaluating whether to build their own UI plugin, the lesson is in item one: expose an extension point through the official registration API, and everything else, theming, accessibility, safety, becomes a checklist you can score yourself against.

11. The sidecar extension is a second extension point. The plugin opens not one but two doors: registerTab for itself and customTabsPath for your own tabs. A plugin with one extension point is useful. A plugin with a second one, aimed at the exact gap the first one leaves, is designed with intent. The sidecar path exists because the maintainer saw that users would want tabs the plugin could not predict. Shipping a mechanism instead of a feature list is the mark of a plugin that understands its own scope.

12. Onboarding is embedded in the config itself. The defaults are safe, the docs show a working block, and the inspect command prints the schema back at you. A new user can go from install to a custom tab in one session without reading the source. That onboarding speed is a real retention driver, because the fastest way to lose a user is to make them feel like they need a degree to try a sidebar tab.

The scorecard, if you want numbers, reads like this. Extension point design 10, contract discipline 10, DOM safety 10, theming 9, accessibility 9, graceful degradation 9, minimalism 9, config clarity 9, ordering control 8, type stability 9. The two points that drag below 10 are ordering control, because a single numeric field cannot express every placement, and theming, because the plugin still depends on the active skin defining the right variables. Nothing here is a bug. It is honest scope.

The star curve is worth reading as data. The range 371 to 735 spans a period where the harness itself went through two renderer refactors. Sidebar plugins that hardcoded DOM structure lost their users in that window; this one kept its install base and grew. That is the practical definition of the compatibility point above. When a platform churns, the plugins that survive are the ones that made the fewest assumptions about the platform. The sidecar mechanism, the registerTab contract, the dsh/types imports, all of those are decisions to assume less.

There is also a maintenance signal hiding in the numbers. A plugin that sits in the hundreds of stars without a marketing push is usually one that solves a real recurring pain rather than a novelty. The sidebar is where people live all day, so a good one accrues stars slowly and keeps them. Novelty plugins spike and fade. The steady range here is the shape of a utility, not a fad.

Community dynamics round this out. The issue tracker for this plugin is mostly feature requests for new tab types, and the maintainer's consistent answer is "write a sidecar tab." That answer is not dismissive; it is the extension point doing its job. Requests that survive are the ones that cannot be expressed as a sidecar, which is a useful filter for what the plugin itself should grow. Watching that pattern is a lesson for every plugin author: if your users keep asking for the same thing, either the extension point is too weak or the feature belongs in core. The tension between those two is where good plugin design lives.

For someone scoring their own work against this one, the practical checklist is short. Does your plugin register through the official API? Does every mount return a disposable? Does every string from outside go through textContent? Do styles depend on the skin instead of hardcoded values? Can a new user configure it without reading your source? Five questions, and this plugin answers yes to all of them. That is the whole scoring rubric in one line.

The final score is not about features. It is about how little the plugin assumes. Fewer assumptions, fewer breakages, fewer support threads, more trust. That is the quiet math behind the star range, and it is the reason this writeup exists.
