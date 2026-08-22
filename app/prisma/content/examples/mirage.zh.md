<!-- CONFIG -->

mirage 是 runtime 类插件，配置的核心是选一个后端顶替真实磁盘和真实 shell。安装和其它插件一样：

```
dsh plugin --profile web add github:strukto-ai/mirage
```

DSH 把文件访问和命令执行抽象成 provider。mirage 把这两个 provider 换掉。会话代码继续用 ctx.fs.readFile 和 ctx.sh.exec，只有背后实现变了。你挑一个后端，插件在启动时接好线。这是不带容器的沙箱范式。

基础配置：

```ts
plugins: {
  mirage: {
    filesystem: { provider: "ram", maxBytes: 64 * 1024 * 1024, maxFiles: 5000 },
    bash: {
      provider: "sandbox",
      readOnly: false,
      perExecTimeoutMs: 10000,
      outLimit: 100000,
      blockedPrefix: ["rm -rf /", "sudo", "mkfs", "shutdown"]
    }
  }
}
```

filesystem.provider 选存储后端，bash.provider 选 shell 后端，sandbox 是标准选择，把每条命令都送进隔离工作区。blockedPrefix 在命令真正执行前就拦掉，是大多数会话真正需要的便宜又直观的防线。

S3 后端给持久化跨机会话：

```json
"filesystem": { "provider": "s3", "bucket": "dsh-mirage-sessions", "region": "us-east-1", "prefix": "sessions/{{sessionId}}/", "cacheInRam": true }
```

prefix 模板把每个会话的文件锁在自己的键空间里，共享桶才安全。凭据走标准 AWS_ACCESS_KEY_ID 和 AWS_SECRET_ACCESS_KEY 环境变量。cacheInRam 把热读文件留在本地，否则每次读都是一次到对象存储的往返。

Redis 是 RAM 和 S3 之间的中间态：

```json
"filesystem": { "provider": "redis", "url": "redis://localhost:6379", "keyPrefix": "dsh:mirage:", "ttlSeconds": 86400 }
```

文件进程重启后还在，但按 TTL 自动过期，省掉写清理任务。keyPrefix 让同一个 Redis 能承载多个环境而不撞键。

协作工具当存储。Slack 后端把每个文件写成频道线程里的一条消息或上传：

```json
"filesystem": { "provider": "slack", "tokenEnv": "SLACK_BOT_TOKEN", "channel": "C0D3MIRAGE", "postAsThread": true }
```

会话本来就在 Slack 里跑的团队，文件就该出现在人都在的地方。读操作取回线程并解码最新那条文件消息。

Gmail 后端把每个文件变成草稿邮件，路径在主题里，内容在正文里：

```json
"filesystem": { "provider": "gmail", "credentialsFile": ".gmail-credentials.json", "label": "DSH/Mirage", "draftOnly": true }
```

draftOnly 保证只停在草稿箱，不主动发送。读操作按 label 列出草稿再解析正文。

Notion 后端把每个文件映射成数据库里的一页：

```json
"filesystem": { "provider": "notion", "tokenEnv": "NOTION_TOKEN", "databaseId": "8f2a1c...", "property": { "title": "Path", "content": "Body" } }
```

路径进标题属性，内容进正文属性。输出需要给不读日志的人审阅时选它。

bash 侧：readOnly: true 适合只读巡检型会话，任何 exec 都直接拒绝，除非命令在 allowlist 上；perExecTimeoutMs 卡住失控命令，outLimit 截断 stdout，话痨工具涨不起内存。完全隔离模式下每次 exec 用工作区的新拷贝，破坏性命令碰不到同侪文件。

per-profile 覆盖：cli profile 下把同一插件块设成 provider: "ram"，本地又快又可丢，服务器 profile 落到 S3，会话代码两边都不用动。

配额对所有后端生效。maxBytes 或 maxFiles 超了，会话收到类型化错误 "mirage: quota exceeded maxBytes=67108864"，能 catch 能重试，比笼统的通用失败强。

验证：

```
dsh plugin list --profile web
```

跑一个写入再读回的会话，健康启动会打印 "mirage fs backend=s3 ok"。如果看到默认后端，先查插件是否在该 profile 启用，再查配置键是不是 filesystem，别写成 fs。这两种错误都表现为少一行日志而不是报错，所以启动日志才存在。

<!-- CODE -->

mirage 实现了 DSH 自带的 provider 契约，再在启动时把默认实现换掉。契约很小，这正是能换的原因：

```ts
export interface FsProvider {
  read(path: string): Promise<Uint8Array>;
  write(path: string, data: Uint8Array): Promise<void>;
  list(dir: string): Promise<string[]>;
  stat(path: string): Promise<{ size: number; mtime: number } | null>;
  delete(path: string): Promise<void>;
}
```

入口函数：

```ts
export function apply(ctx: DshContext, config: MirageConfig) {
  ctx.providers.replace("filesystem", createFsProvider(config.filesystem));
  ctx.providers.replace("bash", createShellProvider(config.bash));
  ctx.log.info({ fs: config.filesystem.provider, sh: config.bash.provider }, "mirage active");
}
```

整个插件核心就是两次工厂调用加两次替换调用。session 永远不会知道背后换了什么，这就是 runtime 类插件的全部技巧。

工厂用 switch 分发后端，遇到未知 provider 字符串在启动时立刻抛错 "mirage: unknown filesystem provider xxx"。拼错后端名是配置 bug，应该响亮地失败，而不是第一次写入时才炸。

RAM 后端就是一张 Map 加路径归一化和字节预算。路径归一化很关键：./x、/x、x 应该指同一个文件，否则同一份文件通过两种调用风格出现两次。每次写入扫一遍实时大小，几千个文件没问题，几百万就会慢，README 里写了这个取舍。

S3 后端把路径拼进 prefix 键空间。prefix 干两件事：把会话锁进自己的键空间，同时充当命名空间分隔符。stat 把 S3 的 HEAD 响应映射成和 RAM 后端一样的形状，会话根本分不清自己在哪个后端上。cacheInRam 在前端再接一层本地缓存，热读不用走网络。

Redis 后端用 setex，把 TTL 绑在写入上，过期自动且按文件粒度。list 用 scan 扫前缀代替目录列表，大目录树时会慢，文档写了这一点。Redis 没有原生 mtime，provider 返回 0 并如实注明，不假装精确。

Slack 后端最怪，也最容易被最后才考虑。Slack 没有目录列表 API，provider 在内存里维护一份路径到消息时间戳的索引。它是最慢、限制最多的后端，README 直接这么说，真实用途是输出本来就要出现在频道里的会话。

Gmail 后端把路径映射到主题行。findDraft 按 label 加主题前缀查询，等于在邮件 API 上做小型数据库查询。draftOnly 保证什么都不发，副作用只留在账号里。文本能干净往返，二进制不行，README 同样写明。

shell 沙箱在执行前查两件事：blockedPrefix 在 spawn 之前拒绝，readOnly 模式直接全拒。runIsolated 才是真正的隔离边界，它用工作区的新拷贝跑命令，带超时和输出上限，失控进程和话痨工具都被关住。

为什么是替换而不是拦截。DSH 也可以暴露钩子逐个拦截 fs 调用，但拦截意味着包住每一个调用点还要保持一致。替换意味着写一份接口实现，一次性交出去。差别体现在插件体积上，也体现在每个后端可以单独测试上。前者是在复杂系统上叠补丁，后者是给抽象画一条干净的边界线。

<!-- HIGHLIGHTS -->

mirage 是 runtime 类插件的参考范例，评分集中在同一组优点上，下面每条都是具体属性，附带通常出现在评分理由里的推理。

provider 抽象又小又干净。FsProvider 五个方法，ShellProvider 一个方法。小接口好实现也好测，每个后端塞进同一个形状，加第七个后端就是写一个类，不碰接线。

会话零接口变化。后端从磁盘切到 S3，会话代码一行不改，唯一可见的差别是报错。这是 provider 替换能成立的根本属性，逼着会话改代码的插件第一天就死。

没有容器的沙箱。bash 后端提供隔离，但不启动 Docker 也不起 VM。前缀拦截挡住危险命令，超时关住失控命令，输出上限含住话痨命令。很多团队因此拿到沙箱八成价值，运维成本是零头。

一个开关六个后端。RAM、S3、Redis、Slack、Gmail、Notion 全在一个 provider 字符串后面。跨度本身就是重点，团队可以从开发的临时 RAM 平移到生产的持久 S3，会话代码不动，这是抽象成立的最清晰证明。

RAM 是诚实的默认。它就是一张带字节预算的 Map，快、正确、明确是临时的。作为默认意味着新用户几秒内拿到能用的沙箱，README 对重启丢数据这个代价的坦白也把预期设对了。

S3 给出持久可共享的会话。按会话的键前缀是共享桶安全的前提，cacheInRam 让热读保持快。这个后端把本地沙箱变成共享基础设施，实现直接映射对象存储模型，不绕弯。

Redis 免费送生命周期管理。写入即设 TTL，文件自己过期，整类清理任务消失。provider 老实交代没有 mtime，这是对的：假精确不如如实标注缺失。

协作后端证明了抽象没有天花板。Slack、Gmail、Notion 当文件系统，笑话之下是真工作流。会话已经跑在 Slack 里，文件就该在线程里；非技术评审要看出处，Notion 页面可审。这些后端对多数用户不实用，它们是抽象上限的证明。

shell 防线可读。blockedPrefix 就是一段字符串前缀列表，谁都能读，能看出到底拦了什么，而且在 spawn 之前就拦住。对比没人审得动的正则 allowlist，可读性本身是安全属性。

类型化配额错误可操作。"mirage: quota exceeded maxBytes=67108864" 是会话能 catch 能反应的消息，笼统的通用失败不是。插件把限额当一等错误命名，运行时约束就该这样浮出水面。

per-profile 覆盖让环境诚实。cli profile 用 RAM，web profile 用 S3，开发又快又可丢，生产持久。配置合并按 profile 走，不会因为一个游离的环境变量把后端翻过来。

社区信号有意义。约 3431 star 意味着失败模式被暴露过，README 反映了这些。star 不是质量证明，但它是先验：用户越多，bug 报告越多，边界情况越多，写文档的压力越大。README 里明写的限制注记和这段历史一致。

测试故事每个后端都一样。因为每个后端实现同一接口，CI 里打 RAM，按需打 S3。provider 替换模式让整个插件不需要网络 mock 就能测，这是小接口的直接结果。

代价被写出来而不是藏起来。每个后端在 README 里都有局限小节。Slack 慢，Gmail 二进制往返差，Redis 没有 mtime。肯点名自己弱点的文档比只列优点的文档信号更强，评分通常也这么看。
