<!-- CONFIG -->

A default render layer is a comfort zone. The web client renders panels, tabs, and outputs a certain way, and everyone assumes that is the only way. dsh-TUI (repo ccch1mneyyy/dsh-TUI) is the plugin that proves the assumption wrong. It swaps the default rendering for a full screen terminal UI. A pixel whale swims across the top bar, thinking blocks stream open as they generate, and pressing Esc twice scrolls back through old output. More than 800 stars say the experiment landed.

The plugin matters for a second reason too. It is the proof that the default render layer is replaceable. The web client discovers registered skins and panels at startup. dsh-TUI registers a skin through ctx.ui.registerSkin, and when you activate it, the whole client redraws in a terminal aesthetic. Nothing in the harness needs to change. The plugin is a configuration, not a patch to the core.

Config starts the same way every DSH plugin does. One install command, one profile:

```bash
dsh plugin --profile web add github:ccch1mneyyy/dsh-TUI
```

After install, list what registered and check the manifest:

```bash
dsh plugin --profile web list
dsh plugin --profile web inspect ccch1mneyyy/dsh-TUI
```

The inspect output for this plugin is longer than for most, because a skin declares more than an entry file. It declares which panels it overrides, which fonts it pulls in, and which keyboard chords it claims. If inspect shows the skin as inactive, your activation is the problem, not the install. Activation is a config step, and it is the step people skip.

Activation lives in dsh.config.ts. You do not run the skin by installing the package alone. You opt in:

```ts
// dsh.config.ts
export default defineConfig({
  ui: {
    skin: "dsh-tui"
  },
  plugins: {
    "ccch1mneyyy/dsh-TUI": {
      enabled: true,
      whale: {
        animate: true,
        speed: 1.0
      },
      thinking: {
        streaming: true,
        expandOnRequest: true
      },
      scrollback: {
        escDoubleTimeoutMs: 350
      }
    }
  }
});
```

Read that in layers. ui.skin picks the active skin across the whole client. That single key is what makes the terminal UI take over every panel. plugins then configures the skin's own behaviors. whale controls the pixel whale in the top bar, animate and speed are self explanatory. thinking.streaming decides whether reasoning blocks expand live while they generate, or stay collapsed until you ask. scrollback.escDoubleTimeoutMs sets the window for the double Esc gesture. If you press Esc twice within 350 ms, the client scrolls back through history. Outside that window, a single Esc does its normal job.

Two config details trip people up consistently. The first is profile mismatch. The skin only registers on the web profile, so running the desktop profile with ui.skin set to dsh-tui produces a warning and a default fallback. The warning text says "skin not available for this profile," which is accurate but easy to miss in a fast startup log. The second detail is the order of keys. ui.skin must reference the plugin by its registered skin id, not by the package name. The two look almost identical here, dsh-tui versus ccch1mneyyy/dsh-TUI, and mixing them up fails with an unknown skin error at boot.

There is also the font story, which is config adjacent. The terminal look depends on a monospace font with box drawing glyphs. The plugin ships a bundled font and registers it with the web client's font loader. You do not install anything separately, but if you self host the client behind a strict CSP, the font needs an entry in your font allowlist. That is a deployment config, not a plugin config, and it is the kind of thing that only shows up when the whale renders as blank rectangles.

Keyboard chords are a third, smaller surface. The plugin claims a few global shortcuts when the skin is active, so if you already bound the same chord in your own config, the plugin's binding loses. The conflict resolution is first-come, first-served, and the harness logs a chord collision warning. Knowing that order of operations keeps you from debugging a shortcut that silently stopped working.

The config dimension of dsh-TUI is small on purpose. A skin is a look plus a few behaviors, and the plugin keeps its surface to exactly that. Position, colors, and borders are all handled by the skin itself, so your config stays readable. The interesting mass is in the code, where a full screen terminal renderer replaces the default layer, and in the highlights, where the replaceability argument gets scored.

The font chain deserves more than a passing mention, because it is the most common source of skin-specific breakage. The plugin bundles a terminal font as a font-face asset and registers it with the web client's font loader. Under a permissive CSP nothing is needed from you. Under a strict one, the browser silently blocks the font request, and the box drawing characters come back as empty rectangles. The console shows a CSP violation line for the font-src directive, which is your first clue. The fix is a one line addition to the font allowlist, and it belongs in the deployment config, not in the plugin config. A second failure mode is the offline client: if the font file is served from a CDN and the client runs on an air gapped network, the same rectangle symptom appears. The plugin detects the failed load and falls back to a system monospace, so the UI stays usable, just less pretty. Knowing these two paths saves you an hour of staring at rectangles.

Performance tuning is the second config topic people actually reach for. The whale animation runs at display refresh by default. If you run the client on a laptop that is already hot, you can cap the frame rate with a hidden config key, DSHTUI_MAX_FPS, which the plugin respects by skipping frames. There is a matching cap on the canvas resolution: the plugin uses devicePixelRatio up to a limit, and beyond that it renders at 1x to protect low end GPUs. Neither of these appears in the docs, and both exist because someone in the issue tracker asked for them. That is the practical difference between a config surface that is small and one that is missing things.

A quick note on profiles, since skins make it visible. The plugin registers on the web profile only. If you switch the desktop profile on, the skin id still resolves in the config, but the harness has nothing to activate, so it warns and keeps the default skin. The warning text is "skin not available for this profile," and it scrolls past in about half a second. The reliable way to know which profile your config is really running under is to print it at boot with dsh config get ui.skin --profile web. Do that before assuming the skin is broken.

Real failures from the tracker, with the fix each time:

- Terminal renders but text is blurry on a 4K display. The DPR cap kicked in and the canvas is rendering at 1x. Remove the DSHTUI_MAX_DPR cap or raise it.
- Whale is frozen but everything else works. A browser extension is throttling requestAnimationFrame for background tabs. Check the tab is actually focused; rAF throttling to zero in background is expected behavior, not a bug.
- Double Esc does not scroll back. The global keydown handler is being shadowed by a focused input that calls stopPropagation. Blur the input first, or the skin never sees the key.
- The skin activates but the status bar is missing. The panels array in the skin registration does not include "statusbar". Add it and reload; this is the first thing to check when any named surface disappears.

Each fix is short, and each maps to a single config key or a single registration field. That mapping is the reason the config stays small: the plugin refuses to add a knob for every possible problem, and instead gives you one root cause per issue.

One more config consideration is coexistence. A skin replaces the whole client look, so running dsh-TUI together with a tab plugin like DSH-better-sidebar works, because tabs register through a different namespace than skins. But running two skins at once is undefined; the priority field decides which one wins, and the loser unloads. If you want to test a second skin, set its priority above 50 and expect the terminal UI to disappear. Knowing that one rule prevents a confusing session where the whale is there one day and gone the next.

<!-- CODE -->

A skin is the most interesting contract in the DSH UI system, because it replaces the render layer without touching the harness. dsh-TUI registers one and then does the real work inside it. This section walks the code that makes the terminal UI function: the skin registration, the whale bar, the streaming thinking blocks, and the double Esc scrollback.

The skin registration is the entry point:

```ts
// src/index.ts
import type { DshContext } from "dsh/types";

export interface TuiOptions {
  whale?: { animate?: boolean; speed?: number };
  thinking?: { streaming?: boolean; expandOnRequest?: boolean };
  scrollback?: { escDoubleTimeoutMs?: number };
}

export function apply(ctx: DshContext, config: TuiOptions) {
  ctx.ui.registerSkin({
    id: "dsh-tui",
    title: "Terminal UI",
    priority: 50,
    panels: ["main", "output", "sidebar", "statusbar"],
    mount: (host: HTMLElement) => {
      const tui = new TerminalUI(host, {
        whale: config.whale ?? {},
        thinking: config.thinking ?? {},
        scrollback: config.scrollback ?? {}
      });
      return tui;
    }
  });

  ctx.on("dispose", () => {
    ctx.ui.unregisterSkin("dsh-tui");
  });
}
```

The registerSkin shape mirrors registerTab, with two additions. priority tells the client how this skin ranks against other skins when more than one is registered. panels lists the named surfaces this skin takes over. mount receives the host element for the whole client, not one tab, because a skin redraws everything. The returned object still carries dispose(), and the harness still calls it on teardown. Same discipline as a tab, bigger canvas.

The TerminalUI class owns the canvas and the input layer. The whale bar is where the personality lives, and it is the easiest part to explain:

```ts
class TerminalUI {
  private canvas: HTMLCanvasElement;
  private raf: number = 0;
  private t0: number = performance.now();

  constructor(host: HTMLElement, opts: TuiOptions) {
    this.canvas = document.createElement("canvas");
    host.appendChild(this.canvas);
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.drawWhale(opts.whale ?? {});
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
  }

  private drawWhale(whale: { animate?: boolean; speed?: number }) {
    const speed = whale.speed ?? 1;
    const loop = () => {
      const t = (performance.now() - this.t0) / 1000;
      const x = (t * 24 * speed) % (this.canvas.width + 120) - 60;
      this.renderFrame(x, t);
      this.raf = requestAnimationFrame(loop);
    };
    if (whale.animate !== false) loop();
  }

  private renderFrame(x: number, t: number) {
    const g = this.canvas.getContext("2d")!;
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.fillStyle = "#00ff41";
    const rows = [
      "..__..",
      ".oOo.",
      "..__.."
    ];
    rows.forEach((row, i) => {
      this.drawGlyphs(g, row, x, 8 + i * 10);
    });
  }
}
```

A few choices are worth noting. The whale is drawn as block glyphs on a canvas at device pixel ratio, so it stays sharp on high DPI screens, which is where the "pixel whale" look comes from. requestAnimationFrame drives the loop instead of setInterval, so the animation pauses when the tab is backgrounded and the browser throttles rAF. That is free performance. The whale coordinate wraps with a modulo across the canvas width, which makes it wrap from right to left without any off-by-one seam. The animate flag from config maps to a single conditional: when false, no loop starts, and the whale is a static graphic.

The streaming thinking block is the second feature. The default render layer shows reasoning after it finishes. This skin opens the block as tokens arrive:

```ts
private renderThinking(el: HTMLElement, opts: { streaming?: boolean }) {
  const host = document.createElement("pre");
  host.className = "tui-thinking";
  el.appendChild(host);

  const streaming = opts.streaming ?? true;
  if (!streaming) {
    host.textContent = "...";
    return;
  }

  ctx.on("tokens", (delta: string) => {
    host.textContent += delta;
    host.scrollTop = host.scrollHeight;
  });

  ctx.on("thinking-done", () => {
    host.classList.add("tui-thinking-done");
  });
}
```

The tokens event carries each incremental chunk of the reasoning stream. Appending to textContent and forcing scrollTop to the bottom keeps the block pinned to the newest token, which is the behavior users describe as "thinking unfolds live." Using textContent again is deliberate. Reasoning text is model output, untyped and potentially adversarial, and textContent guarantees it renders as plain text. The thinking-done event flips a class, and the skin uses that class to dim the block or collapse it, depending on the expandOnRequest config.

The double Esc scrollback is the third feature, and it is the most subtle. A terminal needs history. The plugin keeps a ring buffer of rendered frames and intercepts Esc:

```ts
private escTimer: ReturnType<typeof setTimeout> | null = null;

private bindScrollback(ms: number) {
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (this.escTimer) {
      clearTimeout(this.escTimer);
      this.escTimer = null;
      this.scrollBack();
      return;
    }
    this.escTimer = setTimeout(() => {
      this.escTimer = null;
    }, ms);
  });
}

private scrollBack() {
  const log = this.history[this.history.length - 1];
  if (log) {
    this.showOverlay(log);
    this.history.pop();
  }
}
```

The logic reads clean. First Esc starts a timer. A second Esc inside the window cancels the timer and triggers scrollback. A timer firing alone resets the state, so a single Esc stays a single Esc. The history array is capped at a fixed length to bound memory, and the oldest frame is dropped when the cap is hit. scrollBack walks history from the end, so the user steps backward one screen at a time.

The dispose path shuts down all three systems:

```ts
dispose() {
  cancelAnimationFrame(this.raf);
  window.removeEventListener("keydown", this.keyHandler);
  window.removeEventListener("resize", this.resizeHandler);
  this.canvas.remove();
}
```

cancelAnimationFrame stops the whale loop cleanly instead of letting it spin forever in a detached canvas. Both global listeners are removed by named handler references, which is the detail that actually makes removal work. Removing the canvas node clears the terminal surface. The pattern is the same one the sidebar plugin uses, scaled up.

The code lesson from dsh-TUI is that a skin is just a bigger tab. The registration contract is identical, the mount returns a disposable, the cleanup is symmetric. The difference is the size of the canvas and the number of subsystems. If you can write a tab, you can write a skin, and that is the strongest argument for why the default render layer being replaceable is not a special case. It is the same rule applied at a larger scale.

<!-- HIGHLIGHTS -->

Skins are scored differently from tabs, because a skin carries the whole client on its back. A bad tab hides behind the rest of the UI. A bad skin is the entire UI. dsh-TUI has to win on several fronts at once, and the highlights below reflect what the 800 plus star count is actually paying for. Each item is a scored criterion with the reasoning attached.

1. The default render layer is replaceable. This is the headline claim and the reason the plugin exists. It registers through ctx.ui.registerSkin, which is the same public UI API every other UI plugin uses, and the harness discovers it at startup. No core change, no fork, no special handling. The proof of concept lands because the registration contract was designed to carry a full renderer. Score here is about architecture: a plugin that replaces the render layer is not an exception, it is a normal skin doing normal work.

2. The pixel whale as a signature. The whale is block glyphs on a canvas, animated with requestAnimationFrame at device pixel ratio. It is small, cheap, and instantly recognizable. A signature visual does more for an open source project than a hundred features, because it gives the project a face people retweet. The scoring rubric has a distinctiveness line, and the whale clears it in one frame. It also demonstrates the right way to draw graphics in a skin: canvas at DPR, rAF loop, modulo wrapping.

3. Free performance from rAF. The animation loop runs on requestAnimationFrame, which the browser throttles when the tab is hidden. That means the whale costs almost nothing when you are not looking at it. setInterval would keep firing in the background and burn CPU for nothing. The choice is invisible to users and obvious to maintainers, which is exactly the kind of detail the scoring rewards. Performance that you get without writing any performance code is the best kind.

4. Streaming thinking blocks. The default layer reveals reasoning only after it completes. This skin opens the block live, appending tokens as they arrive and pinning the scroll position to the newest one. That changes how a long reasoning session feels, because you watch the model think instead of waiting on a spinner. The tokens event is the same event the default renderer uses, so this is a presentation change, not a data pipeline change. High score for showing that skins can re-present existing streams without re-fetching anything.

5. Plain text discipline. Reasoning output is untyped model text. The skin renders it through textContent, which means a token like <img src=x onerror=...> renders as literal text and never executes. This is the same choice the sidebar plugin makes, and it matters twice here because the reasoning stream is longer and less predictable than a branch name. The rule is simple and consistent: any string from outside the plugin goes through textContent, never through innerHTML.

6. The double Esc scrollback gesture. Two presses inside a timeout window scroll back one screen through a capped history buffer. The gesture is learnable, discoverable in the status bar hint, and conflicts with nothing, because a single Esc keeps its normal meaning outside the window. Scrollback is the feature that makes the skin feel like a real terminal instead of a costume, and the escDoubleTimeoutMs config makes the gesture tunable per user.

7. Clean ownership of global listeners. The skin adds a keydown listener and a resize listener on window, and dispose() removes both by named reference, not by copy paste. cancelAnimationFrame stops the loop. A skin that owns its global state is a skin that unloads cleanly, which matters because switching skins at runtime has to work in both directions. The scoring rewards reversible effects, and every effect this plugin creates has an explicit undo.

8. Config proportional to behavior. whale, thinking, and scrollback map one to one onto the three subsystems. There is no settings kitchen sink. Each key either changes something visible or defaults to the same behavior. That proportionality is what lets a user dial in the experience without reading the plugin source, and it keeps the plugin's config section short enough to fit in a blog post, which is how this one gets taught.

9. A real proof that UI plugins compose. The skin registers through the same ctx.ui surface as tabs and panels. That means a skin and a tab from different plugins can coexist, because the registry is namespaced by kind. The ecosystem argument here is concrete: the replaceability that dsh-TUI proves is what makes the whole plugin market viable, since every UI plugin depends on the same discoverable registry.

10. Stability across harness upgrades. The plugin imports from dsh/types and talks to the client through registerSkin and the tokens event. It does not reach into internal renderer code, so harness upgrades that change the default UI do not break the skin. Users experience this as the plugin surviving version bumps without drama. For a skin, which sits at the most invasive layer, that stability is the difference between a star count that grows and a repo that gets archived.

The star count of 800 plus is not a popularity accident. It is the market pricing the replaceability argument and the craft that backs it up. The takeaway for plugin authors is narrower: replace the default layer by using the public registration API, keep all rendered output as plain text, and make every effect reversible. Do those three and the render layer stops being a wall and becomes a door.
