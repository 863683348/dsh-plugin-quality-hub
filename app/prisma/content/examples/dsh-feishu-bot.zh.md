<!-- CONFIG -->

通知类插件的大部分价值在配置里兑现。安装命令只有一行，manifest 声明 patch 入口，剩下的全是关于事件往哪去、长什么样的决定。这一节把配置维度从头讲到尾：manifest、通道块、密钥、网关，以及那些让繁忙会话不至于变成通知轰炸的旋钮。

先装插件：

```
dsh plugin --profile web add github:dsh-external/dsh-feishu-bot
```

这条命令把插件加到 web profile。如果会话跑在 cli profile 下，就要换成 `--profile cli`。装错 profile 是典型的静默失败：plugin list 里能看到它，hook 却永远不触发，消息一条也发不出去。

有个细节值得重复：安装命令要的是 `github:owner/repo` 这种短写法，不是完整 URL。直接从浏览器复制 GitHub 地址粘进去，解析器会报未知源，你白折腾一分钟。记得带 `github:` 前缀。

关键在 package.json 里的 `dsh.bundle.patch`。没有这个键，插件文件根本进不了构建，代码再对也没用：

```json
{
  "dsh": {
    "bundle": {
      "patch": ["index.ts"]
    }
  }
}
```

最常见的首个报错是 "no dsh.bundle.patch entry in package.json"。加上键之后跑 `dsh plugin sync --profile web` 重建即可，跳过这步就是插件显示已装却什么都不干的原因。还有一个更安静的失败模式：patch 数组指向不存在的文件，比如 `patch: ["src/main.ts"]` 而入口其实在仓库根目录。解析器会静默跳过缺失文件，插件保持不活跃。`dsh plugin --profile web inspect dsh-external/dsh-feishu-bot` 会打印解析后的入口，每次装完跑一次。

通道配置写在 dsh.config.ts：

```ts
plugins: {
  "dsh-feishu-bot": {
    enabled: true,
    mode: "push",
    channels: {
      feishu: { webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/5f2c..." },
      telegram: { botTokenEnv: "TELEGRAM_BOT_TOKEN", chatIdEnv: "TELEGRAM_CHAT_ID" },
      wecom: { webhookUrl: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=6a3d..." }
    },
    events: ["agent/post-step", "agent/error"],
    retry: { maxAttempts: 3, baseMs: 500, jitter: true },
    rateLimit: { perMinute: 60 }
  }
}
```

三种通道的凭据形态不一样。飞书自定义机器人 webhook 以 `/bot/v2/hook/` 结尾，token 是唯一凭据，要当密码看。Telegram 需要 @BotFather 发的 bot token 加 chat id，都从环境变量读。企微群机器人带 key 查询参数，参数被 URL 编码搞坏会直接报无效 key，正文还没开始解析。

### webhook URL 细节

三个平台的端点长得不一样，这些差异是大部分配置 bug 的来源。飞书自定义机器人在群设置的「自定义机器人」里创建，生成的 webhook 是固定 host 加一段 token 路径。别加尾斜杠，别往上拼查询参数，也别把它贴进会编码冒号的 Markdown 链接里。Telegram 在本插件里根本不是 webhook：适配器直接调 Bot API 的 sendMessage，所以平台侧只需要 @BotFather 给的 bot token 和一个 chat id。群和超级群的 chat id 是负数，很多人先用私聊测试成功，换群就失败，就是栽在这。企微群机器人给的 webhook 以 `?key=...` 结尾，key 属于查询串，任何会剥掉查询参数的中间件都会让消息静默消失。装完三个通道一起测一发，是抓住这些差异最快的办法。

密钥放 .env，不进配置文件：

```
TELEGRAM_BOT_TOKEN=123456:AAH4x...
TELEGRAM_CHAT_ID=-1001234567890
```

插件先读 `process.env`，再回退到 `ctx.secrets`。缺 TELEGRAM_BOT_TOKEN 时启动阶段就打一行 "telegram skipped, TELEGRAM_BOT_TOKEN not set"，比凌晨三点第一次发送才炸强太多。如果会话服务跑在进程管理器下，记住环境变量是在 spawn 那一刻继承的。改 `.env` 不会立即生效，必须重启守护进程，所以 shell 里看起来"立刻生效"的 token 轮换，服务端还揣着旧值，直到你把它弹起来。

本插件的定位是把标准化 envelope 交给 dsh-im-hub 网关，由网关持有平台适配器和出站队列。本地可以跑 sidecar，`gateway.url` 指向 `http://127.0.0.1:9123`，也可以指远程端点。单队列的意义在于：飞书被限流时，Telegram 的消息照常发，因为每个适配器各占一个出口槽位。

网关跑 sidecar 是默认姿势，因为你能独立重启它，队列也能扛住插件重载。网关有个极简健康端点，`curl http://127.0.0.1:9123/health` 返回 200 是先于怪罪插件的有效预检。网关是远程的话，连接要加共享 token 鉴权，因为 envelope 里可能带着模型输出，不该躺在公网明文端点上。

events 数组只订阅用得到的生命周期。`agent/post-step` 在每步完成后触发，是逐字进度通知的主力；`agent/error` 在失败时触发。只注册需要的，handler 才轻。minSteps 和 toolGlob 用来压噪：把 minSteps 提到 3 跳过热身轮次，toolGlob 只在指定工具运行时才通知，适合长跑 bash 步骤。

过滤器是叠加而不是覆盖。session 白名单放行后，还得过 minSteps；toolGlob 匹配上了，也还得过 session 检查。听起来理所当然，但这正是两个过滤器都配了却很少吓到人的原因。一个实用套路：生产环境把 toolGlob 收窄，只留慢工具或破坏性工具；开发环境放宽，调模板时看全。

模板可以内联覆盖，引用不存在的变量时渲染器保留占位符而不是崩溃，坏模板杀不掉整条管线：

```json
"template": {
  "head": "Step {{step}} in session {{sessionId}}",
  "body": "{{model}} took {{durationMs}}ms, output preview: {{preview}}"
}
```

README 里列了变量集。有用的有 sessionId、step、model、durationMs、tool、preview，失败事件还多一个 error。preview 在服务端就截断了，所以工具哪怕吐出几 MB 输出，聊天里也只带一截短的。宽松渲染是故意的：模板笔误应该赔你一条丑消息，而不是丢一条消息。

重试是 500ms 基数翻倍加抖动，只对瞬时错误重试，最后一步失败后丢弃并记日志，不会无限入队。perMinute 60 的令牌桶放在出站路径前，因为飞书自定义机器人的每分钟上限并不宽裕，撞上去的报错还不友好。两种状态码永远不重试：400 和 401。400 说明载荷本身坏了，重试结果一模一样；401 说明凭据错了，是配置问题不是瞬时问题。两者都立即记日志，让你去修因，而不是陪跑一轮退避。限流要比平台上限低一点。飞书允许每分钟 100，你设 100，一个突发就可能顶穿；设 60 留出余量，聊天还显得实时。

per-profile 隔离：cli profile 下可以把同一插件块设成 `mode: "log"`，开发机只打印 envelope，服务器 profile 保持 push。配置合并按 profile 走，一台机器安静，另一台推真实聊天。这套同样能用在预发：预发 profile 指到一个专门建的 Telegram 群，静音它，把真群留给生产。这样投递链路端到端跑通，彩排期间没人手机响。

验证走两步：

```
dsh plugin list --profile web
dsh config validate
```

跑一个会话步骤，正常会看到 "push ok feishu, id 8f2a..."，失败是 "push failed feishu, attempt 1/3: 429 rate limited"。两行都没有，先查 events 数组，再查安装的 profile，按这个顺序排错。

### 排错清单

消息丢了，按这个顺序查。第一步，`dsh plugin --profile web list`，确认插件在当前真正跑会话的 profile 里且已启用。第二步，`dsh config validate`，读配置报错，因为像 `chanels` 这种拼错的键会被静默忽略。第三步，触发单步，看日志里有没有启动跳过行或 push 行。第四步，日志一行都没有，多半是 events 数组没包含运行时真的触发的那只 hook，或者过滤器把一切挡了。第五步，日志显示 `push failed`，报错文本里带平台名和尝试次数，下一步是直接 curl 那个平台的 webhook 验证。六步是一段短梯子，重点在于每一级都是一行能读的日志，而不是一块要猜的黑屏。

<!-- CODE -->

插件模块只导出一个函数。apply(ctx, config) 拿到运行时上下文和解析后的配置，后面所有逻辑都挂在 ctx.hooks 上。下面的代码走一遍 handler、envelope 构造、网关客户端、三个平台适配器、重试循环和限流器。

```ts
export function apply(ctx: DshContext, config: FeishuBotConfig) {
  const log = ctx.log.child({ plugin: "dsh-feishu-bot" });
  const hub = new ImHubClient(config.channels, { resolveSecret }, { retry, rateLimit });
  const dedup = new DedupWindow(60_000);
  const events = config.events?.length ? config.events : ["agent/post-step"];
  for (const evt of events) {
    ctx.hooks.subscribe(evt, async (payload, meta) => {
      if (!shouldSend(config, payload)) return;
      if (!dedup.seen(evt, payload)) return;
      const envelope = renderEnvelope(config.template, payload, meta);
      if (config.mode === "log") return log.info({ envelope }, "envelope");
      const results = await hub.dispatch(envelope);
      results.forEach(r =>
        r.ok ? log.info({ ...r }, "push ok") : log.warn({ ...r }, "push failed")
      );
    });
  }
}
```

agent/post-step 的 payload 是普通对象，包含 sessionId、step、model、durationMs 和一段 preview。插件不重新查询会话，用事件自带的数据，既减少延迟也不耦合内部结构。meta 对象带事件元信息，比如时间戳和一个投递序号，去重窗就用它。

### 事件归一化

payload 碰模板之前，先过一个小归一化函数，把运行时吐出来的东西变成插件自己持有的固定形状：

```ts
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

归一化器是唯一知道字段名的地方。模板和适配器只读归一化后的形状，所以运行时加字段或改名，只改这一个函数。它还让 error 事件有个稳定的 error 字段供失败模板引用，两种事件类型走同一套渲染路径。

shouldSend 做三层过滤：session 白名单、minSteps、toolGlob。被过滤的事件在构造 envelope 之前就返回，繁忙会话上的开销趋近于零。过滤按最便宜的先后排：字符串 includes、数字比较、glob。这个顺序在一秒几百步的会话上有意义，因为拒绝路径几乎不花钱。

去重窗口记 evt+sessionId+step 的键，60 秒 TTL。运行时偶发重投同一事件，没有去重，聊天里就会出现双份消息；TTL 保证同一步号真晚到的后续事件不被误吞。

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

窗口是有界的：到一万个键就停，触发一次全表清扫，把过期条目清掉。单个长会话产出几千步也稳在预算内，内存保持平坦。键故意带上 step 序号，所以会话暂停后真出个同序号的后续步骤，因为 TTL 已过，照样能投递。

### 启动期配置校验

坏配置要早失败，而不是第一个事件才炸。apply 跑的时候就校验，抛错带精确信息：

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

三个检查接住大多数真实错误。空 channels 意味着插件啥也不发还没人知道。既没 webhook 也没 token env 的通道注定永远跑不通。限流超出合理范围，多半是 `perMinute: 6000` 这种手滑。每条消息都点名通道或数值，改一行就完事。mode 是 log 时插件照常启动，因为那种模式下投递本来就关闭，校验故意跳过传输检查。

ImHubClient 按通道建适配器。只有密钥解析成功的通道才会进入适配器列表，缺 token 的通道在派发时根本不存在，零成本。dispatch 用 Promise.all 并发，慢平台不阻塞其他平台，每个结果单独记日志。限流器一次 dispatch 取一个 token，一份 envelope 发给三个通道只耗一个 token，突发时每消息的账是实的。

### 适配器工厂

工厂把配置块映射成具体适配器，通道不可用就返回 null：

```ts
function createAdapter(name: string, c: ChannelOptions, resolve: (n?: string) => string | undefined): PlatformAdapter | null {
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

未知通道名返回 null 而不是抛错，因为插件该容忍一份声明了未来版本通道的配置。switch 也让要求显式化：Telegram 要两个密钥，webhook 通道要一个。将来加第四个平台，这个函数多一个 case，其它都不用动。

飞书适配器发 JSON body，msg_type 为 text，响应里 code 非 0 就是错误，401 基本等于 webhook token 过期，429 就是限流设太靠近上限。适配器没设 timestamp 和 sign，平台只在签名 webhook 时才要求；如果你的群开了签名，就在插件配置里加这两个字段和一个密钥。

Telegram 适配器把 bot token 拼进 URL 路径，所以它绝不能出现在日志里，适配器只从密钥解析器拿值；parse_mode HTML 让模板里的加粗标签生效，disable_web_page_preview 阻止平台给每个链接抓预览卡。Telegram 限流很宽但非无限：429 带 retry_after 字段时，适配器应该尊重那个精确延迟，字段缺失时插件的通用退避是合理近似。

企微适配器用 markdown 类型，errcode 非 0 即失败，key 查询参数被 URL 编码搞坏是最常见的坑。企微还限制 markdown 正文长度，插件靠 preview 截断压在限内。模板万一产出超长正文，报错会是 `wecom api error code=93000` 带消息长度提示，这就是让你改模板而不是改适配器的信号。

withRetry 做指数退避：500ms 基数翻倍加最多 200ms 抖动。抖动不是装饰，多会话同时失败时，没有抖动大家会同步重试，把故障时间拉长。抛出的错误带上 attempts 字段，供派发日志展示第几次。循环把一切抛错都当可重试；400 和 401 这类不可重试的在适配器里更早被接住，那里平台响应已解析，错误信息足够精确去行动。

令牌桶按秒连续补充而不是整点重置，60/分钟允许短时突发 60 条然后限速。会话短时间产生大量事件时，桶是偶尔 429 和直接封禁之间的差别。补充用时间差计算不走定时器，事件循环忙上一两秒，账还是对的。

### 健康计数

运维视角，插件在 ctx 上暴露几个单调递增的计数器：push_ok、push_failed、push_dropped、dedup_hits。维护成本极低，一个计数器一个整数，把"我们是不是丢消息了"这种含糊问题变成数字问题。push_dropped 涨而 push_failed 平，说明事件在派发前被过滤了。push_failed 涨而网关健康，说明某个 webhook 过期了。dedup_hits 涨，说明运行时在重投，去重窗正在干活。这些都不需要新基建，却让插件像服务一样可观测。

整体结构的关键是每块只干一件事：handler 决定发不发，去重窗决定新不新，hub 决定怎么到各平台，适配器只懂自己那套 API。将来加第四个平台，写一个适配器加一段配置就行，事件循环一行不用动。归一化器、校验器、计数器是配角，它们每一个的存在，都因为维护者经历过"猜比写几行结构更贵"的真实事故。

<!-- HIGHLIGHTS -->

以下评分亮点是这类通知集成插件拿高分的原因，每一条都是具体行为而不是口号，而且每条都能对上代码里的一行或配置里的一个决定。

事件订阅让插件与会话内部解耦。插件从不直接读会话状态，只消费运行时塞给它的 payload，升级不碎。轮询或回查会话的插件更脆，会话模型一变就静默坏掉。归一化器是吸收这些变化的唯一接缝。

单网关多适配器。飞书、Telegram、企微共享一个 im-hub 出站队列，平台慢不会串行化整条管线，这是优雅降级和卡死事件循环之间的差别。sidecar 方案还给了你一个能独立重启、不碰会话服务的进程。

适配器隔离把部分失败变成特性。Promise.all 意味着 Telegram 故障不挡飞书消息，每路的日志分开，一个坏通道拖不垮整个通知面。读一遍派发循环，一眼就能看出失败是按平台隔离的。

指数退避加抖动是 webhook 的正确重试形态。内部 RPC 那套短固定重试不适合外部 webhook。500ms 基数翻倍加随机偏移，贴合平台限流的真实行为。没有抖动，一批同时失败的会话会同步重试，把故障时间拖长。明确不重试 400 和 401，让配置错误不会藏在退避循环后面。

配置驱动通道意味着加 Telegram 只是改配置。新增平台不碰代码不重建，团队只要跑着 im-hub 网关，边际成本就是一段配置加一个环境变量。工厂 switch 清楚标出新平台插在哪，下一个维护者一眼看到成本。

密钥不进源码。token 先读环境变量再读 ctx.secrets，git log 干净，轮换便宜。启动阶段的跳过日志让缺密钥立刻可见，而不是第一次发送才炸。botTokenEnv 这种"配置里写变量名而不是值"的命名模式，任何碰凭据的插件都值得抄。

过滤和去重挡住通知疲劳。minSteps、sessions、toolGlob 让吵闹的会话安静下来，去重窗吞掉运行时重投的重复投递。不能过滤的通知插件，一周内就会被静音。有界的去重窗说明作者想过长会话，而不只是 happy path。

限流贴合真实平台上限。飞书自定义机器人和企微机器人都有每分钟上限，撞上限会刷出大量错误日志。尊重上限的插件告警更少，工单更少。一次 dispatch 只扣一个 token 而不是按通道扣，envelope 扇出三个平台时账才是实的。

log 模式给出安全测试路径。mode: "log" 打印 envelope 不发送，验证模板和过滤器最快，自动化测试也因此完全确定，全程无网络调用。per-profile 版本的同一招，让开发机停在 log 模式，服务器 profile 照常真推。

dsh.bundle.patch 带来小补丁面。插件是单个 index.ts 入口，不 fork 核心、不做全局 monkey-patch。小表面意味着评审快、升级冲突少，这是运行时升级后依然能用的最强预测因子。

结构化日志带插件作用域。所有日志走 plugin: "dsh-feishu-bot" 的子 logger，成功时带平台和消息 id。消息丢了，运维 grep 一个前缀就能看到整条投递链。启动跳过行和 push 行区分度够，五行 grep 就能看全投递路径。

通道构建是 fail-closed。适配器只在密钥解析成功时创建，缺 token 的通道在派发时根本不存在，配合启动日志，配置漂移一眼可见而不是时好时坏。这跟校验器是同一套哲学：注定跑不通的通道，启动时大声宣告一次。

启动期校验带精确信息。校验器在事件流之前接住空通道列表、无凭据来源的通道、越界的限流值，每条消息点名问题通道或数值，改一行就好。这类插件里多数是在第一个真实事件上才炸，把配置笔误变成工单。启动时带着字段名失败，对所有人来说都严格更便宜。

不加新基建的可观测性。ctx 上的四个计数器 push_ok、push_failed、push_dropped、dedup_hits，把投递健康变成一行放得下的数字。没有指标服务、没有 exporter，就是维护者能在状态面板读到的整数。这是"被运维的插件"和"装完就忘的插件"的分界线。

升级路径是增量式的。新事件类型、新模板变量、新通道都是增量到达。归一化器防御性映射未知字段，模板把未知占位符留着，工厂忽略未知通道名。因为对未知不抛错，插件升级永远不会弄坏现有配置。这正是一个通知插件能搭在会话服务上免于每周救火的原因。

合起来看，这些点解释了为什么它在大多是一页脚本的同类里站得住。配置维度给可运维性，代码维度给韧性，上面的亮点就是这两个维度的评分词汇。想自己写一个通知插件，最短路径是：走 hook 订阅、经网关路由、启动时校验、带抖动退避、数清你交付了多少。
