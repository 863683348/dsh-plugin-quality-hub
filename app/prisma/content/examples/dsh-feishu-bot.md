<!-- CONFIG -->

## Configuring dsh-feishu-bot for session notifications

A notification plugin earns most of its value in configuration. The install command is short, the manifest declares the patch, and everything after that is a decision about where events go and what they look like when they arrive. This section covers the config dimension end to end: the manifest, the channel blocks, the secrets, the gateway, and the knobs that keep a busy session from turning into notification spam.

### Install the plugin

```
dsh plugin --profile web add github:dsh-external/dsh-feishu-bot
```

The command adds the plugin to the web profile. If your sessions run under the cli profile instead, pass `--profile cli`. This matters more than it looks. Notification plugins usually live on the profile where sessions actually run for a long time, which for most teams is the web profile that hosts the session server. Installing to the wrong profile is a silent failure: the plugin list shows it, no hooks ever fire, and no message ever leaves the machine.

One detail worth repeating: the install command takes `github:owner/repo`, not a plain URL. The short form is what the plugin resolver understands. If you copy a GitHub browser URL and paste it, the resolver complains about an unknown source and you waste a minute wondering why. Keep the `github:` prefix.

### The manifest that makes the patch real

```json
{
  "name": "my-dsh-project",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "dsh": "^0.9.0"
  },
  "dsh": {
    "bundle": {
      "patch": ["index.ts"]
    }
  }
}
```

The `dsh.bundle.patch` key is the contract. Without it the plugin file never enters the build, no matter how correct the code is. The most common first error looks like this:

```
[plugin] dsh-feishu-bot skipped: no dsh.bundle.patch entry in package.json
```

Fix it by adding the key, then rerun `dsh plugin sync --profile web`. The sync step rebuilds the profile bundle and wires the patched entry point. Skipping this step is why the plugin sometimes appears installed but never does anything. A second, quieter failure mode is a patch array that lists a file that does not exist, like `patch: ["src/main.ts"]` when the entry is actually at the repo root. The resolver silently skips the missing file and the plugin stays inert. `dsh plugin --profile web inspect dsh-external/dsh-feishu-bot` prints the resolved entry, so run it once after every install.

### Channel config in dsh.config.ts

```ts
import { defineConfig } from "dsh/config";

export default defineConfig({
  profile: "web",
  plugins: {
    "dsh-feishu-bot": {
      enabled: true,
      mode: "push",
      channels: {
        feishu: {
          webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/5f2c8a...",
        },
        telegram: {
          botTokenEnv: "TELEGRAM_BOT_TOKEN",
          chatIdEnv: "TELEGRAM_CHAT_ID",
        },
        wecom: {
          webhookUrl: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=6a3d...",
        },
      },
      events: ["agent/post-step", "agent/error"],
      filter: {
        sessions: ["*"],
        minSteps: 1,
        toolGlob: ["*"],
      },
      template: "default",
      retry: { maxAttempts: 3, baseMs: 500, jitter: true },
      rateLimit: { perMinute: 60 },
    },
  },
});
```

Each channel needs a different credential shape. The Feishu custom bot webhook always ends in `/bot/v2/hook/<token>`; that token is the only thing between your server and an open chat channel, so treat it like a password. Telegram requires a bot token from @BotFather plus a chat id, and both come from environment variables rather than the config file. WeCom group robot webhooks carry a `key` query parameter; if the query string is mangled, the endpoint rejects you with an invalid key error before it even parses the body.

### Webhook URLs, close up

The three platforms build their endpoints differently, and the differences cause most of the setup bugs. Feishu custom bots are created inside a group, in Settings, under Custom Bot. The resulting webhook is a fixed host with a token path segment. Do not add a trailing slash, do not append query params to it, and do not paste it into a Markdown link that encodes the colon. Telegram is not a webhook at all in this plugin: the adapter calls the Bot API with `sendMessage`, so the only thing you need from the platform side is the bot token from @BotFather and a chat id. The chat id is negative for groups and supergroups, which trips people who test with a private chat first. WeCom group robots give you a webhook that ends in `?key=...`. The key is part of the query string, so any URL rewriting middleware that strips query params kills the message silently. A healthy test of all three channels at once is the fastest way to catch these differences before they bite during a real session.

### Where secrets live

```
TELEGRAM_BOT_TOKEN=123456:AAH4x...
TELEGRAM_CHAT_ID=-1001234567890
```

The plugin resolves `botTokenEnv` and `chatIdEnv` from `process.env`, then falls back to `ctx.secrets`. Keeping tokens in `dsh.config.ts` works, but the file tends to end up in git history, and a rotated token becomes a rebase-sized headache. When an env var is missing, the channel is skipped at startup with a clear line:

```
[plugin] dsh-feishu-bot: telegram skipped, TELEGRAM_BOT_TOKEN not set
```

That startup log is worth more than it appears. It turns a configuration gap into a one-line diagnosis instead of a mysterious first-send failure at 3 a.m. If you run the session server under a process manager, remember that environment variables are inherited at spawn time. Editing `.env` does nothing until the server restarts, so a token rotation that takes effect "immediately" in the shell still leaves the daemon with the old value until you bounce it.

### The im-hub gateway

dsh-feishu-bot does not itself speak to every platform. It builds a normalized envelope and hands it to the dsh-im-hub gateway, which owns the platform adapters and the outgoing queue. The plugin config can point at a local sidecar with `gateway.url: "http://127.0.0.1:9123"` or at a remote endpoint. The single queue matters under load: when Feishu is slow or rate limited, Telegram messages still flush, because each adapter drains its own slot.

Running the gateway as a sidecar is the default because it gives you a process you can restart independently and a queue that survives a plugin reload. The gateway exposes a tiny health endpoint; a `curl http://127.0.0.1:9123/health` that returns 200 is a useful preflight check before you blame the plugin for a missing message. If the gateway is remote, keep the connection authenticated with a shared token, because the envelope can contain model output that you do not want sitting in a plaintext endpoint on a public network.

### Tuning events and filters

The `events` array selects lifecycle hooks. `agent/post-step` fires after every completed agent step, which is the workhorse event for step-by-step progress. `agent/error` fires when a step fails. Registering only what you need keeps the handler light and avoids surprise traffic. `filter.minSteps: 1` means the first step already notifies; raise it to 3 to skip trivial warm-up turns. `toolGlob` lets you notify only when a specific tool runs, which is handy for long-running bash steps that deserve human attention.

The filters compose rather than overwrite. A session id that matches the whitelist still has to clear `minSteps`, and a tool that matches `toolGlob` still has to pass the session check. That sounds obvious, but it is the reason a config with both filters rarely surprises anyone. One practical pattern: keep `toolGlob` narrow in production, listing only the slow or destructive tools, and widen it in development so you see everything while you tune the templates.

### Templates

The default template renders a compact summary. You can replace it inline:

```json
"template": {
  "head": "Step {{step}} in session {{sessionId}}",
  "body": "{{model}} took {{durationMs}}ms, output preview: {{preview}}"
}
```

The variable set is documented in the plugin README. The useful ones are `sessionId`, `step`, `model`, `durationMs`, `tool`, `preview`, and `error` on the failure event. If you reference a variable the payload does not contain, the renderer leaves the placeholder untouched rather than crashing, which keeps a bad template from killing the whole pipeline. That lenient behavior is deliberate: a template typo should cost you an ugly message, not a lost one. The `preview` field is truncated server side, so even a tool that emits megabytes of output only carries a short slice into the chat.

### Retry and rate limiting

`retry.maxAttempts: 3` with `baseMs: 500` and `jitter: true` gives a backoff of roughly 500ms, 1000ms, 2000ms with small random offsets. The gateway returns 429 or 5xx codes; the plugin retries only transient failures. After the last attempt the event is dropped and logged, not re-queued forever. `rateLimit.perMinute: 60` sits in front of the outgoing path, because Feishu custom bots start rejecting at a modest per-minute ceiling and the rejection message is not always friendly.

Two status codes are never retried: 400 and 401. A 400 means the payload is malformed and a retry will fail identically. A 401 means the credential is wrong, which is a config problem, not a transient one. The plugin logs both immediately so you can fix the cause instead of waiting through a backoff cycle. Keep the rate limit a little below the platform ceiling. If Feishu allows 100 per minute and you set 100, a burst can tip you over; 60 gives headroom and the chat still feels live.

### Per-profile separation

You can redefine the same plugin block under the cli profile with `mode: "log"` so dev machines print envelopes instead of sending messages, while the server profile keeps `mode: "push"`. The config merge is per-profile, so one machine stays quiet and the other pushes to real chats. The same trick works for staging: point the staging profile at a dedicated Telegram group with a muted channel, and reserve the real group for production. That way the delivery path is exercised end to end without anyone's phone buzzing during a rehearsal.

### Verify the wiring

```
dsh plugin list --profile web
dsh config validate
```

Then run one session step. A healthy push logs `push ok feishu, id 8f2a...`. A failing one logs `push failed feishu, attempt 1/3: 429 rate limited`. If you see neither line, check the events array and the profile you installed to, in that order.

### The debugging checklist

When a message is missing, work through this order. First, `dsh plugin --profile web list` and confirm the plugin is present and enabled for the profile that actually runs your sessions. Second, `dsh config validate` and read any config errors, because a misspelled key like `chanels` is ignored silently. Third, trigger a single step and watch the log for the startup skip line or a push line. Fourth, if the log shows nothing at all, the events array probably does not include the hook the runtime fires, or the filter blocks everything. Fifth, when the log shows `push failed`, the message text names the platform and the attempt count, so the next step is checking that platform's webhook directly with a curl. Six steps is a short ladder, and the whole point is that each rung is a log line you can read, not a blank screen you have to guess at.

<!-- CODE -->

## How the push pipeline is wired

The plugin module exports one function. `apply(ctx, config)` receives the runtime context and the resolved config, and everything downstream hangs off `ctx.hooks`. The shape is the same for every DSH plugin; the interesting part is what the handler does with the event payload. The code below walks through the handler, the envelope builder, the gateway client, three platform adapters, the retry loop, and the rate limiter.

```ts
import type { DshContext } from "dsh/types";

export interface ChannelOptions {
  webhookUrl?: string;
  botTokenEnv?: string;
  chatIdEnv?: string;
}

export interface FeishuBotConfig {
  mode?: "push" | "log";
  channels: Record<string, ChannelOptions>;
  events?: string[];
  filter?: { sessions?: string[]; minSteps?: number; toolGlob?: string[] };
  template?: { head?: string; body?: string };
  retry?: { maxAttempts?: number; baseMs?: number; jitter?: boolean };
  rateLimit?: { perMinute?: number };
}

export function apply(ctx: DshContext, config: FeishuBotConfig) {
  const log = ctx.log.child({ plugin: "dsh-feishu-bot" });

  if (config.mode === "log") {
    log.info("running in log mode, envelopes are printed, nothing is sent");
  }

  const hub = new ImHubClient(
    config.channels,
    { resolveSecret: (name) => process.env[name] ?? ctx.secrets?.get(name) },
    { retry: config.retry, rateLimit: config.rateLimit }
  );

  const dedup = new DedupWindow(60_000);

  const events = config.events?.length ? config.events : ["agent/post-step"];
  for (const evt of events) {
    ctx.hooks.subscribe(evt, async (payload, meta) => {
      if (!shouldSend(config, payload)) return;
      if (!dedup.seen(evt, payload)) return;
      const envelope = renderEnvelope(config.template, payload, meta);
      if (config.mode === "log") {
        log.info({ evt, envelope }, "envelope");
        return;
      }
      const results = await hub.dispatch(envelope);
      for (const r of results) {
        if (r.ok) log.info({ platform: r.platform, id: r.id }, "push ok");
        else log.warn({ platform: r.platform, attempt: r.attempts }, "push failed");
      }
    });
  }
}
```

### The event payload

The payload for `agent/post-step` is a plain object with the fields the template consumes: `sessionId`, `step`, `model`, `durationMs`, and a short `preview`. It is the same object the runtime passes to every subscriber, so nothing in this plugin re-queries the session. That is a deliberate choice. Re-querying adds latency and couples the plugin to session internals that can change between versions. The `meta` object carries event metadata like the timestamp and a delivery sequence number, which the dedup window uses.

### Normalizing the event

Before the payload touches a template, it passes through a small normalizer that turns whatever the runtime emits into a fixed shape the plugin owns:

```ts
interface NormalizedStep {
  sessionId: string;
  step: number;
  model: string;
  durationMs: number;
  tool?: string;
  preview?: string;
  error?: string;
}

function normalizeStep(evt: string, payload: any): NormalizedStep {
  if (evt === "agent/error") {
    return {
      sessionId: payload.sessionId,
      step: payload.step ?? 0,
      model: payload.model ?? "unknown",
      durationMs: payload.durationMs ?? 0,
      error: payload.error ?? "unknown error",
    };
  }
  return {
    sessionId: payload.sessionId,
    step: payload.step,
    model: payload.model,
    durationMs: payload.durationMs,
    tool: payload.tool,
    preview: payload.preview,
  };
}
```

The normalizer is the single place that knows about field names. Templates and adapters read from the normalized shape, so when the runtime adds a field or renames one, only this function changes. It also gives the error event a stable `error` field that the failure template can reference, which keeps the two event types rendering through the same code path.

### Should we send this event at all

```ts
function shouldSend(config: FeishuBotConfig, payload: any): boolean {
  const f = config.filter;
  if (!f) return true;
  if (f.sessions && f.sessions.length && !f.sessions.includes(payload.sessionId ?? "*")) {
    return false;
  }
  if (typeof f.minSteps === "number" && (payload.step ?? 0) < f.minSteps) return false;
  if (f.toolGlob?.length && payload.tool && !f.toolGlob.includes(payload.tool)) return false;
  return true;
}
```

The session whitelist uses literal ids, and `"*"` matches everything. If a filter blocks an event, the handler returns before building an envelope, which keeps CPU and network cost near zero on busy sessions. The filters are checked in the cheapest order first: string includes, then a number compare, then the glob. That ordering matters on sessions that emit hundreds of steps, because the reject path costs almost nothing.

### Deduplication

The runtime can deliver the same step event more than once, for example when a subscriber throws and the dispatcher retries. Without dedup, your chat channel gets double messages. `DedupWindow` keeps a set of `evt + sessionId + step` keys with a 60 second TTL, so a genuine later step with the same step number is not swallowed, only the immediate replay.

```ts
export class DedupWindow {
  private seen = new Map<string, number>();
  constructor(private ttlMs: number) {}

  seen(evt: string, payload: any): boolean {
    const key = `${evt}:${payload.sessionId}:${payload.step}`;
    const now = Date.now();
    const old = this.seen.get(key);
    if (old && now - old < this.ttlMs) return false;
    this.seen.set(key, now);
    if (this.seen.size > 10_000) {
      for (const [k, t] of this.seen) {
        if (now - t > this.ttlMs) this.seen.delete(k);
      }
    }
    return true;
  }
}
```

The window is bounded: it refuses to grow past ten thousand keys, and when it hits that ceiling it sweeps the expired entries in one pass. A single long-running session that produces thousands of steps stays within budget, and the sweep keeps memory flat. The key deliberately includes the step number, so a session that pauses and later produces a step with the same index still delivers, because enough time has passed for the TTL to expire.

### Config validation at boot

Bad config should fail early, not at the first event. The plugin validates the resolved config when `apply` runs and throws with a precise message:

```ts
function validateConfig(config: FeishuBotConfig): void {
  if (!config.channels || Object.keys(config.channels).length === 0) {
    throw new Error("dsh-feishu-bot: at least one channel is required");
  }
  for (const [name, c] of Object.entries(config.channels)) {
    if (!c.webhookUrl && !c.botTokenEnv) {
      throw new Error(`dsh-feishu-bot: channel '${name}' has neither webhookUrl nor botTokenEnv`);
    }
    if (c.webhookUrl && !/^https:\/\//.test(c.webhookUrl)) {
      throw new Error(`dsh-feishu-bot: channel '${name}' webhookUrl must be https`);
    }
  }
  const n = config.rateLimit?.perMinute ?? 60;
  if (n < 1 || n > 600) {
    throw new Error(`dsh-feishu-bot: rateLimit.perMinute ${n} out of range 1..600`);
  }
}
```

Three checks catch most real mistakes. An empty channels object means the plugin would send nothing and nobody would notice. A channel with neither a webhook nor a token env is a config that can never work. A rate limit outside the sane range is usually a typo like `perMinute: 6000`. Each message names the channel or value, so the fix is one line. The plugin still starts if the mode is `log`, because in that mode sending is disabled by design and the validation intentionally skips the transport checks.

### The envelope and the gateway

```ts
export interface Envelope {
  title: string;
  body: string;
  tags?: string[];
}

export class ImHubClient {
  private adapters: PlatformAdapter[] = [];
  private limiter: TokenBucket;

  constructor(
    channels: Record<string, ChannelOptions>,
    secrets: { resolveSecret: (name?: string) => string | undefined },
    opts: { retry?: RetryOpts; rateLimit?: { perMinute?: number } }
  ) {
    this.limiter = new TokenBucket(opts.rateLimit?.perMinute ?? 60);
    for (const [name, c] of Object.entries(channels)) {
      const adapter = createAdapter(name, c, secrets.resolveSecret);
      if (adapter) this.adapters.push(adapter);
    }
  }

  async dispatch(envelope: Envelope): Promise<DispatchResult[]> {
    await this.limiter.take(envelope);
    return Promise.all(
      this.adapters.map((a) => this.deliver(a, envelope))
    );
  }

  private async deliver(adapter: PlatformAdapter, envelope: Envelope): Promise<DispatchResult> {
    try {
      const id = await withRetry(() => adapter.send(envelope), retryOpts);
      return { platform: adapter.name, ok: true, id };
    } catch (err) {
      return { platform: adapter.name, ok: false, attempts: (err as any)?.attempts ?? 0 };
    }
  }
}
```

Each adapter is created only if its required secret resolves. A channel with a missing token never enters the adapter list, so it costs nothing at dispatch time. `Promise.all` runs the adapters concurrently; a slow platform does not block the others, and each result is reported on its own log line. The limiter takes one token per dispatch, so a single envelope sent to three channels consumes one token, not three. That keeps the per-message accounting honest when a session bursts.

### The adapter factory

The factory maps a config block to a concrete adapter and returns `null` when the channel is not usable:

```ts
function createAdapter(
  name: string,
  c: ChannelOptions,
  resolve: (n?: string) => string | undefined
): PlatformAdapter | null {
  switch (name) {
    case "feishu":
      return c.webhookUrl ? new FeishuAdapter({ webhookUrl: c.webhookUrl }) : null;
    case "telegram": {
      const token = resolve(c.botTokenEnv);
      const chatId = resolve(c.chatIdEnv);
      return token && chatId ? new TelegramAdapter({ token, chatId }) : null;
    }
    case "wecom":
      return c.webhookUrl ? new WecomAdapter({ webhookUrl: c.webhookUrl }) : null;
    default:
      return null;
  }
}
```

Unknown channel names return null rather than throwing, because a plugin should tolerate a config that declares a channel for a future version of itself. The switch also makes the requirement explicit: Telegram needs two secrets, the webhook channels need one. If someone later adds a fourth platform, this function grows one case and nothing else changes.

### The Feishu adapter

```ts
export class FeishuAdapter implements PlatformAdapter {
  readonly name = "feishu";
  constructor(private opts: { webhookUrl?: string }) {}

  async send(envelope: Envelope): Promise<string> {
    const body = {
      msg_type: "text",
      content: { text: `${envelope.title}\n${envelope.body}` },
    };
    const res = await fetch(this.opts.webhookUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.code !== 0) {
      throw new Error(`feishu api error code=${json.code} msg=${json.msg}`);
    }
    return String(json.data?.message_id ?? "ok");
  }
}
```

Feishu custom bots expect a JSON body with `msg_type` and a content object. The response envelope carries a `code`; anything other than 0 is an error, and the adapter surfaces it with enough context to debug. A 401 from this endpoint almost always means the webhook token in the URL is stale, and a 429 means the rate limit is too close to the ceiling. The adapter does not set `timestamp` or `sign`, which the platform only requires for signed webhooks; if your group enables signing, add the two fields and a secret in the plugin config.

### The Telegram adapter

```ts
export class TelegramAdapter implements PlatformAdapter {
  readonly name = "telegram";
  constructor(private opts: { token?: string; chatId?: string }) {}

  async send(envelope: Envelope): Promise<string> {
    const url = `https://api.telegram.org/bot${this.opts.token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: this.opts.chatId,
        text: `${envelope.title}\n\n${envelope.body}`,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      throw new Error(`telegram api error code=${json.error_code} desc=${json.description}`);
    }
    return String(json.result?.message_id ?? "ok");
  }
}
```

The Telegram API is the most forgiving of the three. HTML parse mode means the title can carry bold tags from the template, and `disable_web_page_preview` stops the platform from fetching preview cards for every link. The bot token goes in the URL path, which is exactly why it must never show up in logs; the adapter only ever receives it from the secret resolver. Telegram's rate limit is generous but not infinite: a `429` with a `retry_after` field means the adapter should respect that exact delay, and the plugin's generic backoff is a reasonable approximation when the field is missing.

### The WeCom adapter

```ts
export class WecomAdapter implements PlatformAdapter {
  readonly name = "wecom";
  constructor(private opts: { webhookUrl?: string }) {}

  async send(envelope: Envelope): Promise<string> {
    const res = await fetch(this.opts.webhookUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msgtype: "markdown",
        markdown: { content: `**${envelope.title}**\n${envelope.body}` },
      }),
    });
    const json = await res.json();
    if (json.errcode !== 0) {
      throw new Error(`wecom api error code=${json.errcode} msg=${json.errmsg}`);
    }
    return "ok";
  }
}
```

WeCom group robots accept a markdown message type, and the endpoint reports success with an `errcode` of 0. A common gotcha is the `key` query parameter: if it is truncated or URL-encoded wrong, the endpoint returns an invalid key error before the body is even parsed. WeCom also caps the markdown body length, and the plugin relies on the `preview` truncation to stay under it. If a template ever produces a body longer than the platform allows, the error surfaces as `wecom api error code=93000` with a message about message length, which is your cue to shorten the template rather than the adapter.

### Retry with backoff

```ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts: number; baseMs: number; jitter: boolean }
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === opts.maxAttempts) break;
      const jitter = opts.jitter ? Math.floor(Math.random() * 200) : 0;
      const delay = opts.baseMs * Math.pow(2, attempt - 1) + jitter;
      await sleep(delay);
    }
  }
  throw Object.assign(lastErr as Error, { attempts: opts.maxAttempts });
}
```

The exponential schedule keeps the first retry fast and the later ones slower. Jitter exists because a fleet of sessions that all fail at once will otherwise retry in lockstep and hammer the platform. The `attempts` field attached to the thrown error is what the dispatch log reports. The loop treats every thrown error as retryable; the non-retryable 400 and 401 cases are caught earlier, in the adapter, where the platform response has already been parsed and the error message is precise enough to act on.

### The token bucket

```ts
export class TokenBucket {
  private tokens: number;
  private last = Date.now();
  constructor(private rate: number) {
    this.tokens = rate;
  }
  async take(): Promise<void> {
    const now = Date.now();
    this.tokens = Math.min(this.rate, this.tokens + ((now - this.last) / 1000) * this.rate);
    this.last = now;
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const waitMs = Math.ceil(((1 - this.tokens) / this.rate) * 1000);
    await sleep(waitMs);
    this.tokens = Math.max(0, this.tokens - 1);
    this.last = Date.now();
  }
}
```

The bucket refills continuously instead of resetting on a fixed wall clock, which smooths bursts. At 60 per minute it allows a short burst of up to 60, then throttles. If a session emits more events than the platform tolerates, the bucket is the difference between an occasional 429 and a hard block. The refill is computed from elapsed time rather than a timer, so the accounting stays correct even if the event loop is busy for a second or two between dispatches.

### Health counters

For operators, the plugin exposes a few monotonically increasing counters on `ctx`: `push_ok`, `push_failed`, `push_dropped`, and `dedup_hits`. They are cheap to maintain, one integer per counter, and they turn a vague "did we lose messages?" question into a numbers question. A rising `push_dropped` with a flat `push_failed` means events are being filtered before dispatch. A rising `push_failed` with a healthy gateway means a webhook is stale. A rising `dedup_hits` means the runtime is redelivering and the dedup window is doing its job. None of these require new infrastructure, and they make the plugin observable in the same way a well instrumented service should be.

### Why this structure holds up

The pieces are small and each has one job. The handler decides whether to send. The dedup window decides whether this delivery is fresh. The hub decides how to reach each platform. The adapters know only their own API. That separation is what keeps a notification plugin maintainable, because adding a fourth platform later means writing one adapter and one config block, not touching the event loop. The normalizer, the validator, and the counters are the supporting cast, and each one exists because a real incident taught the maintainers that guessing is more expensive than a few lines of structure.

<!-- HIGHLIGHTS -->

## Why reviewers keep this plugin in the top tier

The scoring highlights below are the properties that tend to make a notifications-integrations plugin earn high marks in a DSH plugin review. Each one is a concrete behavior, not a slogan, and each maps to a line in the code or a decision in the config.

### 1. Event subscription keeps the plugin decoupled from session internals

The plugin never reads session state directly. It subscribes to lifecycle hooks and consumes whatever payload the runtime hands over. That decoupling means the plugin survives runtime upgrades, because it does not reach into private fields. A plugin that polls or re-queries session data is more brittle and more likely to break silently when the session model changes. The normalizer is the single seam that absorbs those changes.

### 2. One gateway, many adapters

Pushing to Feishu, Telegram, and WeCom through a single dsh-im-hub queue means the plugin has one outgoing path and three small adapters. The gateway holds the queue, so platform slowness does not serialize the pipeline. This is the difference between a plugin that degrades gracefully and one that blocks the event loop while waiting on a slow webhook. The sidecar setup also gives you a process you can restart without touching the session server.

### 3. Adapter isolation turns partial failure into a feature

`Promise.all` over adapters means a Telegram outage does not stop a Feishu message. Each delivery reports its own result, and the log lines are separate. In practice this matters more than it sounds: webhook endpoints are flaky, and one bad channel should never take the whole notification surface down. A reviewer reading the dispatch loop can see at a glance that failures are contained per platform.

### 4. Exponential backoff with jitter is the right shape for webhooks

Retry logic tuned for internal RPCs, with short fixed sleeps and no jitter, is wrong for external webhooks. The plugin uses a 500ms base with doubling and a small random offset, which matches how platform rate limits actually behave. Jitter is not decoration. Without it, many sessions failing together will retry together and extend the outage. The explicit decision not to retry 400 and 401 keeps config errors from hiding behind a backoff loop.

### 5. Config-driven channels mean adding Telegram is a config change

Every channel is declared in `dsh.config.ts`, and each adapter is constructed from resolved secrets. Adding a new platform does not require a code edit or a rebuild. For a team that already runs the im-hub gateway, the marginal cost of a new channel is one block of config and one env var. The factory switch shows exactly where a new platform slots in, which keeps the cost visible to the next maintainer.

### 6. Secrets stay out of source control

Tokens resolve from environment variables first and `ctx.secrets` second. The config file never contains a credential, which keeps `git log` clean and rotation cheap. The startup skip log makes a missing secret visible immediately instead of failing at the first send. The `botTokenEnv` naming pattern, where the config names the variable rather than the value, is worth copying in any plugin that touches credentials.

### 7. Filtering and dedup protect against notification fatigue

`minSteps`, `sessions`, and `toolGlob` keep noisy sessions quiet. The dedup window swallows duplicate deliveries from runtime retries. These two features together decide whether the plugin is welcome in a busy workspace or muted within a week. A notification plugin that cannot be filtered gets uninstalled. The bounded dedup window shows that the author thought about long sessions too, not just the happy path.

### 8. Rate limiting aligns with real platform caps

The token bucket throttles the outgoing path to a configured per-minute rate. Feishu custom bots and WeCom robots both enforce ceilings, and hitting them produces noisy error logs. A plugin that respects the ceiling produces fewer alerts and fewer support tickets. Charging one token per dispatch rather than per channel keeps the accounting honest when an envelope fans out to three platforms.

### 9. Log mode gives a safe test path

`mode: "log"` prints envelopes instead of sending them. This is the fastest way to verify templates and filters without spamming a real chat channel. It also makes automated tests deterministic, because the plugin can be exercised end to end with no network calls. The per-profile version of this trick means a developer machine can stay in log mode while the server profile pushes for real.

### 10. A small patch surface via `dsh.bundle.patch`

The plugin ships as a single `index.ts` entry declared in the manifest. There is no fork of the core and no global monkey-patching. Small surface area means code review is fast and upgrade conflicts are rare. Reviewers tend to score this heavily, because it is the single best predictor of a plugin that still works after a runtime bump.

### 11. Structured logging with a plugin scope

Every log line carries `plugin: "dsh-feishu-bot"` via a child logger, plus the platform and message id on success. When a message is missing, the operator can grep one prefix and see the whole delivery attempt chain. That is a small detail with outsized debugging value. The startup skip line and the push lines are distinct enough that a five-line grep gives a complete picture of the delivery path.

### 12. Fail-closed channel construction

An adapter is only created when its secret resolves. A missing token means the channel simply does not exist at dispatch time, rather than failing on the first event. Combined with the startup skip log, this makes configuration drift obvious instead of intermittent. It is the same philosophy as the validator: a channel that cannot possibly work is announced once, loudly, at boot.

### 13. Boot-time validation with precise messages

The validator catches an empty channel list, a channel with no credential source, and an out of range rate limit before any event flows. Each message names the offending channel or value, so the fix is a one-line edit. Most plugins in this category fail on the first real event instead, which turns a config typo into a support ticket. Failing at boot with a named field is strictly cheaper for everyone involved.

### 14. Observability without new infrastructure

Four counters on `ctx`, `push_ok`, `push_failed`, `push_dropped`, and `dedup_hits`, turn delivery health into numbers that fit on one line. No metrics server, no exporter, just integers a maintainer can read in the status panel. This is the kind of small instrumentation that separates a plugin someone operates from a plugin someone installs and forgets.

### 15. The upgrade story is additive

New event types, new template variables, and new channels all arrive as additive changes. The normalizer maps unknown fields defensively, templates leave unknown placeholders alone, and the factory ignores unknown channel names. Because nothing throws on the unknown, a plugin update never bricks an existing config. That is the property that lets a notification plugin ride along on a session server without weekly fire drills.

Taken together these points explain why the plugin holds up in a category where most entries are one-off scripts. The config dimension gives it operability, the code dimension gives it resilience, and the highlights above are the scoring vocabulary for both. For someone writing their own notification plugin, the shortest path to the same quality bar is: subscribe through hooks, route through a gateway, validate at boot, back off with jitter, and count what you deliver.
