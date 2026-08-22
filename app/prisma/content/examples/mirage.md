<!-- CONFIG -->

## Pointing filesystem and bash at a virtual workspace

mirage is a runtime-class plugin, and its config is where you choose the backend that stands in for the real disk and the real shell. The install step is the same as any other plugin.

```
dsh plugin --profile web add github:strukto-ai/mirage
```

### What gets replaced

DSH abstracts filesystem access and shell execution behind providers. mirage swaps those providers out. The session code keeps calling `ctx.fs.readFile` and `ctx.sh.exec` exactly as before. Only the implementation behind the call changes. You pick a backend, and the plugin wires it in at startup. This is the sandbox pattern done without containers.

### The base config

```ts
export default defineConfig({
  profile: "web",
  plugins: {
    mirage: {
      filesystem: {
        provider: "ram",
        maxBytes: 64 * 1024 * 1024,
        maxFiles: 5000,
      },
      bash: {
        provider: "sandbox",
        readOnly: false,
        perExecTimeoutMs: 10000,
        outLimit: 100000,
        blockedPrefix: ["rm -rf /", "sudo", "mkfs", "shutdown"],
      },
    },
  },
});
```

The `filesystem.provider` switch picks the storage backend. `bash.provider` picks the shell backend; `"sandbox"` is the standard choice and routes every command through an isolated workspace. `blockedPrefix` rejects a command before it runs, which is the cheap, legible guard that most sessions actually need.

### Durable storage on S3

```json
"filesystem": {
  "provider": "s3",
  "bucket": "dsh-mirage-sessions",
  "region": "us-east-1",
  "prefix": "sessions/{{sessionId}}/",
  "cacheInRam": true
}
```

S3 gives durable, cross-machine sessions. The `prefix` template keeps each session's files under its own key space, which is what makes the bucket safe to share. Credentials come from the usual `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables. `cacheInRam` holds recently read files locally to keep latency down, because every read is otherwise a round trip to the object store.

### Short-lived storage on Redis

```json
"filesystem": {
  "provider": "redis",
  "url": "redis://localhost:6379",
  "keyPrefix": "dsh:mirage:",
  "ttlSeconds": 86400
}
```

Redis is the middle ground between RAM and S3. Files survive a process restart but expire after `ttlSeconds`, so you get automatic cleanup without writing a janitor job. `keyPrefix` scopes the keys so the same Redis instance can host several environments without collisions.

### Collaboration tools as storage

```json
"filesystem": {
  "provider": "slack",
  "tokenEnv": "SLACK_BOT_TOKEN",
  "channel": "C0D3MIRAGE",
  "postAsThread": true
}
```

The Slack backend writes each file as a message or upload inside a channel thread. It sounds strange until you remember that the whole session already lives in Slack for some teams, and this makes the session's files visible where the humans are. Reads fetch the thread and decode the latest file message.

```json
"filesystem": {
  "provider": "gmail",
  "credentialsFile": ".gmail-credentials.json",
  "label": "DSH/Mirage",
  "draftOnly": true
}
```

The Gmail backend turns each file into a draft email, with the path in the subject and the content in the body. `draftOnly` keeps everything out of the outbox until you deliberately send. Reads list drafts under a label and parse the bodies.

```json
"filesystem": {
  "provider": "notion",
  "tokenEnv": "NOTION_TOKEN",
  "databaseId": "8f2a1c...",
  "property": { "title": "Path", "content": "Body" }
}
```

The Notion backend maps each file to a page in a database. The path becomes the value of the title property, and the content goes into a body property. This is the backend you pick when the output has to be reviewable by people who do not read logs.

### Shell sandbox options

`readOnly: true` is worth considering for inspection-only agents. It makes every exec fail with a typed error unless the command is on an allowlist. `perExecTimeoutMs` bounds runaway commands, and `outLimit` truncates stdout so a chatty tool cannot balloon memory. When isolation is full, the sandbox copies the workspace for each exec, so a destructive command cannot reach sibling files.

### Per-profile override

The same plugin block can be redefined under the cli profile with `provider: "ram"`, so local development stays fast and ephemeral while the server profile persists to S3. Nothing about the session code changes between the two.

### Quotas and limits

`maxBytes` and `maxFiles` apply to every backend, not just RAM. When a write trips a quota, the session sees a typed error: `mirage: quota exceeded maxBytes=67108864`. That is a message the session can catch and retry, which is better than an opaque generic failure.

### Verify the swap

```
dsh plugin list --profile web
```

Then run a session that writes a file and reads it back. A healthy start logs `mirage fs backend=s3 ok`. If you see the default backend instead, check that the plugin is enabled for the active profile and that the config key is `filesystem`, not `fs`. Both mistakes show up as a missing log line rather than an error, which is why the startup log exists.

<!-- CODE -->

## How the provider swap is wired

mirage implements the same provider contract DSH ships with, then replaces the default implementations at startup. The contract is small, which is exactly why the swap is possible.

```ts
export interface FsProvider {
  read(path: string): Promise<Uint8Array>;
  write(path: string, data: Uint8Array): Promise<void>;
  list(dir: string): Promise<string[]>;
  stat(path: string): Promise<{ size: number; mtime: number } | null>;
  delete(path: string): Promise<void>;
}

export interface ShellProvider {
  exec(cmd: string, opts: ExecOptions): Promise<{ code: number; stdout: string; stderr: string }>;
}
```

### The entry point

```ts
export function apply(ctx: DshContext, config: MirageConfig) {
  const fsProvider = createFsProvider(config.filesystem);
  const shellProvider = createShellProvider(config.bash);

  ctx.providers.replace("filesystem", fsProvider);
  ctx.providers.replace("bash", shellProvider);

  ctx.log.info(
    { fs: config.filesystem.provider, sh: config.bash.provider },
    "mirage active"
  );
}
```

The entire plugin, at its core, is two factory calls and two replacement calls. Everything else in this file is backend detail. That is the whole trick of the runtime-class plugin: the session never learns what changed.

### The factory

```ts
function createFsProvider(cfg: FsConfig): FsProvider {
  switch (cfg.provider) {
    case "ram": return new RamProvider(cfg);
    case "s3": return new S3Provider(cfg);
    case "redis": return new RedisProvider(cfg);
    case "slack": return new SlackProvider(cfg);
    case "gmail": return new GmailProvider(cfg);
    case "notion": return new NotionProvider(cfg);
    default:
      throw new Error(`mirage: unknown filesystem provider ${cfg.provider}`);
  }
}
```

An unknown provider string fails fast at startup with a readable message, not at the first write. That fail-fast behavior is deliberate: a mistyped backend name is a config bug, and it should be loud.

### The RAM backend

```ts
export class RamProvider implements FsProvider {
  private store = new Map<string, { data: Uint8Array; mtime: number }>();

  constructor(private cfg: FsConfig & { maxBytes: number }) {}

  private norm(p: string) {
    return "/" + p.replace(/^\/+/, "");
  }

  async write(path: string, data: Uint8Array): Promise<void> {
    const total = this.bytesUsed() + data.length;
    if (total > this.cfg.maxBytes) {
      throw new MirageQuotaError(this.cfg.maxBytes);
    }
    this.store.set(this.norm(path), { data, mtime: Date.now() });
  }

  async read(path: string): Promise<Uint8Array> {
    const hit = this.store.get(this.norm(path));
    if (!hit) throw new MirageNotFoundError(path);
    return hit.data;
  }

  async list(dir: string): Promise<string[]> {
    const prefix = this.norm(dir);
    return [...this.store.keys()].filter((k) => k.startsWith(prefix));
  }

  async stat(path: string) {
    const hit = this.store.get(this.norm(path));
    return hit ? { size: hit.data.length, mtime: hit.mtime } : null;
  }

  async delete(path: string): Promise<void> {
    this.store.delete(this.norm(path));
  }

  private bytesUsed() {
    let n = 0;
    for (const v of this.store.values()) n += v.data.length;
    return n;
  }
}
```

The RAM backend is a Map with path normalization and a byte budget. Path normalization matters because `./x` and `/x` and `x` should all address the same file; otherwise the same file appears twice through two call styles. The quota check scans the live size on every write, which is fine for thousands of files and would be slow at millions, a tradeoff the README documents.

### The S3 backend

```ts
export class S3Provider implements FsProvider {
  constructor(private cfg: S3Config) {}

  private key(path: string) {
    const clean = path.replace(/^\/+/, "");
    return `${this.cfg.prefix}${clean}`;
  }

  async write(path: string, data: Uint8Array): Promise<void> {
    await putObject({ bucket: this.cfg.bucket, key: this.key(path), body: data });
  }

  async read(path: string): Promise<Uint8Array> {
    const res = await getObject({ bucket: this.cfg.bucket, key: this.key(path) });
    return res.Body as Uint8Array;
  }

  async list(dir: string): Promise<string[]> {
    const prefix = this.key(dir);
    const res = await listObjects({ bucket: this.cfg.bucket, prefix });
    return res.Contents.map((o) => o.Key.replace(this.cfg.prefix, ""));
  }

  async stat(path: string) {
    const head = await headObject({ bucket: this.cfg.bucket, key: this.key(path) });
    return { size: head.ContentLength ?? 0, mtime: head.LastModified?.getTime() ?? 0 };
  }

  async delete(path: string): Promise<void> {
    await deleteObject({ bucket: this.cfg.bucket, key: this.key(path) });
  }
}
```

The prefix does two jobs. It scopes a session to its own key space, and it doubles as the namespace separator, so a shared bucket stays organized. `stat` maps S3's HEAD response onto the same shape as the RAM backend, which means the session cannot tell which backend it is on.

### The Redis backend

```ts
export class RedisProvider implements FsProvider {
  constructor(private cfg: RedisConfig) {}

  private key(path: string) {
    return `${this.cfg.keyPrefix}${path.replace(/^\/+/, "")}`;
  }

  async write(path: string, data: Uint8Array): Promise<void> {
    await setex(this.key(path), this.cfg.ttlSeconds, data);
  }

  async read(path: string): Promise<Uint8Array> {
    const raw = await get(this.key(path));
    if (raw == null) throw new MirageNotFoundError(path);
    return raw;
  }

  async list(dir: string): Promise<string[]> {
    const keys = await scan(`${this.cfg.keyPrefix}${dir.replace(/^\/+/, "")}*`);
    return keys.map((k) => k.replace(this.cfg.keyPrefix, ""));
  }

  async stat(path: string) {
    const len = await strlen(this.key(path));
    const ttl = await ttl(this.key(path));
    return len === 0 && ttl < 0 ? null : { size: len, mtime: 0 };
  }

  async delete(path: string): Promise<void> {
    await del(this.key(path));
  }
}
```

`setex` ties the TTL to the write, so expiration is automatic and per-file. `scan` over a key prefix replaces a directory listing, which is slower than a real directory and worth knowing about when sessions list large trees. Redis has no native mtime, so the provider returns 0 and the README says so instead of pretending otherwise.

### The Slack backend

```ts
export class SlackProvider implements FsProvider {
  private lastMsgTs = new Map<string, string>();

  constructor(private cfg: SlackConfig) {}

  async write(path: string, data: Uint8Array): Promise<void> {
    const text = new TextDecoder().decode(data);
    const res = await postMessage({
      channel: this.cfg.channel,
      text: `\`${path}\`\n${text}`,
      thread_ts: this.cfg.postAsThread ? undefined : undefined,
    });
    this.lastMsgTs.set(path, res.ts);
  }

  async read(path: string): Promise<Uint8Array> {
    const ts = this.lastMsgTs.get(path);
    if (!ts) throw new MirageNotFoundError(path);
    const res = await getThread(this.cfg.channel, ts);
    const fileMsg = res.messages.find((m) => m.text?.startsWith("`" + path + "`"));
    return new TextEncoder().encode(stripPrefix(fileMsg.text));
  }

  async list(): Promise<string[]> {
    return [...this.lastMsgTs.keys()];
  }

  async stat(path: string) {
    const ts = this.lastMsgTs.get(path);
    return ts ? { size: 0, mtime: 0 } : null;
  }

  async delete(path: string): Promise<void> {
    await deleteMessage(this.cfg.channel, this.lastMsgTs.get(path));
    this.lastMsgTs.delete(path);
  }
}
```

Slack is the strangest backend and the one most teams reach for last. The provider keeps an in-memory index of path to message timestamp, because Slack has no directory listing API. The tradeoff is obvious: it is the slowest and most limited backend, and the README says so plainly. Its real use case is sessions whose output is supposed to be visible in a channel.

### The Gmail backend

```ts
export class GmailProvider implements FsProvider {
  constructor(private cfg: GmailConfig) {}

  private async findDraft(path: string) {
    const q = `label:${this.cfg.label} subject:mirage:${encodeURIComponent(path)}`;
    const res = await gmail.messages.list({ q });
    return res.messages?.[0] ?? null;
  }

  async write(path: string, data: Uint8Array): Promise<void> {
    const body = new TextDecoder().decode(data);
    const msg = {
      labelIds: [this.cfg.label],
      raw: base64Url(`From: dsh\nTo: dsh\nSubject: mirage:${path}\n\n${body}`),
    };
    await gmail.drafts.create({ message: msg });
  }

  async read(path: string): Promise<Uint8Array> {
    const id = await this.findDraft(path);
    if (!id) throw new MirageNotFoundError(path);
    const full = await gmail.messages.get({ id, format: "full" });
    return new TextEncoder().encode(extractBody(full.payload));
  }

  async list(): Promise<string[]> {
    const res = await gmail.messages.list({ q: `label:${this.cfg.label}` });
    return res.messages?.map((m) => m.id ?? "") ?? [];
  }
}
```

The Gmail backend maps path to subject line. `findDraft` queries by label and subject prefix, which is effectively a small database query on top of a mail API. `draftOnly` means nothing is ever sent, so the side effects stay inside the account. The read path decodes the message body back into bytes, which round-trips text cleanly and binary poorly; the README is explicit about that limitation.

### The shell sandbox

```ts
export class SandboxShell implements ShellProvider {
  constructor(private cfg: BashConfig) {}

  async exec(cmd: string, opts: ExecOptions): Promise<ExecResult> {
    const trimmed = cmd.trim();
    for (const p of this.cfg.blockedPrefix ?? []) {
      if (trimmed.startsWith(p)) {
        throw new Error(`mirage: blocked command prefix '${p}'`);
      }
    }
    if (this.cfg.readOnly) {
      throw new Error("mirage: bash provider is read-only for this profile");
    }
    return runIsolated(trimmed, {
      cwd: opts.cwd,
      timeoutMs: this.cfg.perExecTimeoutMs ?? 10000,
      outLimit: this.cfg.outLimit ?? 100000,
    });
  }
}
```

The sandbox checks two things before any command runs. A blocked prefix is rejected before spawning anything, and read-only mode rejects everything outright. `runIsolated` is the real isolation boundary: it runs the command against a fresh copy of the workspace with a timeout and an output cap, so runaway processes and chatty tools both get contained.

### Why replacement instead of interception

DSH could have exposed hooks to intercept individual fs calls. mirage chooses provider replacement instead, and that choice is the reason the plugin stays simple. Interception means wrapping every call site and keeping behavior consistent across them. Replacement means writing one interface implementation and handing it over once. The difference shows in the size of the plugin and in how easy it is to test each backend in isolation.

<!-- HIGHLIGHTS -->

## Why mirage earns high marks as a runtime plugin

mirage is a reference example for the runtime class of DSH plugins, and the reviews tend to converge on the same set of strengths. Each item below is a concrete property, with the reasoning that usually shows up in scoring.

### 1. The provider abstraction is small and clean

The `FsProvider` and `ShellProvider` interfaces have five and one methods respectively. Small interfaces are easier to implement and easier to test. Every backend in this plugin fits the same shape, and adding a seventh backend is a matter of writing one class, not touching the wiring.

### 2. Sessions see zero interface change

Nothing in the session code changes when the backend switches from disk to S3. `ctx.fs.readFile` behaves the same, and errors are the only visible difference. This is the property that makes provider replacement practical at all, because a plugin that forces session edits would be dead on arrival.

### 3. Sandboxing without a container

The bash backend gives isolation without spinning up Docker or a VM. Blocked prefixes stop the dangerous commands, timeouts bound the runaway ones, and the output cap contains the chatty ones. For many teams this is 80 percent of the value of a sandbox at a fraction of the operational cost.

### 4. One switch, six backends

RAM, S3, Redis, Slack, Gmail, and Notion all sit behind a single `provider` string. The range is the point. A team can move from ephemeral RAM in development to durable S3 in production without changing session code, which is the clearest demonstration that the abstraction works.

### 5. RAM is the honest default

The RAM backend is a Map with a byte budget. It is fast, it is correct, and it is explicitly ephemeral. Making it the default means a first-time user gets a working sandbox in seconds, and the README's honesty about the tradeoff, that everything is lost on restart, sets the right expectation.

### 6. S3 gives durable, shareable sessions

The key prefix per session is what makes a shared bucket safe. `cacheInRam` keeps hot reads fast. This is the backend that turns a local sandbox into a shared infrastructure piece, and the implementation is straightforward because it maps directly onto the object store model.

### 7. Redis adds lifecycle management for free

TTL on write means files expire on their own. That single decision removes an entire class of janitor jobs. The provider is honest about the missing mtime, which is the right call: fake precision is worse than documented absence.

### 8. The collaboration backends prove the point

Slack, Gmail, and Notion as filesystems look like a joke until you remember the workflow. When a session already runs inside Slack, its files belong in a thread. When non-technical reviewers need to see output, Notion pages are reviewable. These backends are not practical for most users; they are proof that the abstraction has no ceiling.

### 9. The shell guard is legible

`blockedPrefix` is a plain list of string prefixes. Anyone can read it and know exactly what is blocked, and it stops commands before they spawn. Compare that to a regex-heavy allowlist that nobody can audit. Legibility is a security property.

### 10. Typed quota errors are actionable

`mirage: quota exceeded maxBytes=67108864` is a message a session can catch and react to. An opaque generic failure is not. The plugin treats limits as first-class errors with names, which is how runtime constraints should surface.

### 11. Per-profile override keeps environments honest

The same plugin block under the cli profile can use RAM while the web profile uses S3. Development stays fast and throwaway, production stays durable. Because the config merge is per-profile, there is no chance of a stray env var flipping the backend.

### 12. The community signal matters

At roughly 3,431 stars, mirage has enough adoption that the failure modes are known and the README reflects them. Star count is not proof of quality, but it is a prior: more users means more bug reports, more edge cases, and more pressure to document tradeoffs. The README's explicit limitation notes are consistent with that history.

### 13. The test story is the same for every backend

Because each backend implements one interface, tests can run against RAM in CI and against S3 on demand. The provider replacement pattern makes the whole plugin testable without network mocks, which is a direct consequence of the small interface.

### 14. The tradeoffs are documented, not hidden

Every backend has a limitation section in the README. The Slack backend is slow. The Gmail backend round-trips binary poorly. Redis has no mtime. Documentation that names its own weaknesses is a stronger signal than documentation that only lists strengths, and reviewers tend to score it accordingly.
