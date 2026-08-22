<!-- CONFIG -->

## 你在配置什么

OpenViking 不是通常意义上的 dsh 插件。它是一个上下文数据库，有自己的服务端、自己的客户端 SDK，还有一套长得像文件系统的 URI 方案。和 dsh-memory-evolve 的对比，是这两篇拆解存在的意义，所以我会把这个对比贯穿各节。

装 OpenViking 意味着配两样东西：存储并索引上下文的服务端，和跟它对话的客户端。服务端是重的那部分，它需要一个能用的向量索引，参考部署里这个索引由同团队出的向量数据库 VikingDB 支撑。客户端是你 agent 语言里的小库。Python 客户端文档最全，也是我用的那个。

## 启动服务端

官方 README 指向 openviking.ai 项目页获取当前启动命令，具体调用随版本变化。典型路径是用仓库根目录的 Docker 或 compose 文件把服务端跑起来，再让客户端连过去。服务端活着的最小检查，是对它的端口发一个健康请求。

我的环境里，仓库根的 compose 文件把 API 和索引一起拉起。服务端从环境变量或设置文件读配置，我必须要设的两个值是 embedding 端点和 rerank 开关。健康检查是对根路径的一次简单 GET，返回带 status 字段的 JSON。我把它放进了 shell 别名，开工前先确认存储活着。

索引新内容需要 embedding 模型。参考配置集成了 Doubao embedding 和 rerank 模型，方便的地方是你不用自己拼一套 embedding 流水线。想换供应商，服务端支持指向 OpenAI 兼容端点，配置在服务端设置文件里。

## URI 方案

让 OpenViking 与众不同的，是所有上下文都组织成少数几个顶层命名空间下的 URI。布局长这样：

```
viking://memories/session-001/chat-history
viking://resources/runbooks/payment-service-incident
viking://skills/prometheus-query
```

三个命名空间：memories 存会话和长期 agent 上下文，resources 存知识库内容，skills 存可复用流程。memories 是会话和长期上下文累积的地方。resources 是知识库，是 agent 应该能找到的文档、runbook、spec。skills 是应该稳定执行的怎么做步骤。三个命名空间不是硬墙。价值在组织层面，它给了 agent 和人类同一张心智地图。

每个条目有路径，路径像目录一样嵌套。agent 不会每次查询都搜整个库。它先定位到目录，再在目录里做语义搜索。这是经典 RAG 搞错的设计，也是这个库值得仔细配置的原因。

## 客户端配置

Python 客户端用服务端地址配置，有的部署还要 token。一个连上并搜索的最简脚本：

```python
import viking

client = viking.Client(base_url="http://localhost:8000", token=os.getenv("VIKING_TOKEN"))

root_uri = "viking://resources/runbooks"
results = client.find("how to handle a payment timeout", target_uri=root_uri)

for r in results.resources:
    print(f"{r.uri} (score: {r.score:.4f})")

client.close()
```

`find` 调用接收自然语言查询和一个 `target_uri`。`target_uri` 是目录锚点，每个结果的 score 告诉你匹配有多相关。这是你调用最多的操作，也是对扁平 RAG 碎片化问题的直接回答。

## 分层加载配置

配置里最有趣的部分是分层上下文加载，就是 L0/L1/L2 设计。每个存储的文档有三种表示：短摘要（L0）、结构化概览（L1）、全文（L2）。客户端按任务决定加载到多深。

实践里你配置的是 agent 应该多积极地爬层级。便宜的筛选一遍，只要 L0。要细节的活，L2。这事关 token 成本。一个几千词的 runbook，可以在 L0 就被快速筛掉，只有 agent 真需要细节时才全文加载。我保持默认层级行为，只对少数我确定要精度的文件强制 L2。

## 目录递归检索

配置还覆盖搜索挖多深。目录递归检索意味着锚在 `viking://resources` 的搜索会下钻子目录，锚在叶子目录的搜索保持狭窄。结果太散或太窄时，这就是要拧的旋钮。我锚在仍属于任务的最宽目录，只有宽结果开始带出无关内容才收窄。

锚点选择是主要的调优习惯。我每个任务都从"仍装着答案的最窄目录"开始，只有结果为空才放宽。锚点太宽会带进无关内容，让 rerank 埋掉好结果。锚点太窄一个结果都没有。轨迹视图让这个反馈回路很快，因为你一眼看到搜索访问了哪个目录。

## 自动会话管理

服务端维护会话状态，这让长周期任务能跑。会话的聊天历史在 `viking://memories/session-001/chat-history` 下，生命周期由服务端管理。实际效果是 agent 跨轮恢复上下文，调用方不用手工拼对话。放在记忆对比里，这是对本地插件用文件解决的同一问题的集中式答案。

## 为什么集中式在某些场景胜过本地

用 OpenViking，记忆不是工作区里的一堆 Markdown 文件。它是服务器上的库，任何连上来的东西都能共享、能查询。这对团队有真实好处：多个 agent 能读同一个知识库，检索是语义的而不是线性的，库能超出文件夹的容量扩展。

代价是运维。服务端要跑、要监控、要备份。embedding 流水线要花钱、要保健康。对想让自己上下文跟着机器走的独立开发者，本地文件方案更轻。对需要一个共享语义检索知识库的团队，服务端才是对的形状。

## 接进你的 agent

客户端不限于 Python。协议是 HTTP，任何能发请求的 harness 都能用这个库。我的 dsh 环境里，通过一个小的集成层把库暴露给 agent，配置就收成三个环境变量：

```
VIKING_BASE_URL=http://localhost:8000
VIKING_TOKEN=<issued token>
VIKING_DEFAULT_ANCHOR=viking://resources
```

默认锚点很重要，它决定未指定锚点的搜索落在哪。设成你的 agent 允许读的最宽命名空间。如果 agent 开始拉进不该看的内容，再收窄。

给库做种子是另一半配置。空库一个结果都返回不了，会困惑第一次会话。我用批量 upsert 把现有文档种子进去，再跑一次测试 find 确认索引有响应。多数"什么都跑不起来"的报告其实是从这里开始的，是空库，不是坏库。

## 扩展与备份

这个库的定位就超过本地文件树。备份是服务端备份，不是文件拷贝。自建的话，定期快照索引、导出资源。用托管后端的话，持久化由运维方负责。存任何丢了会心疼的东西之前，先想清楚你在哪一边，因为两条路的备份故事完全不同。

## 配置清单

把配置算完成之前，按顺序检查这些。服务端响应健康请求。客户端用对的 base URL 和 token 连上。一条种子文档写入并能在搜索里回来。要浅层时，分层加载先返回 L0 再返回 L2。会话状态在重连后存活。每一项都是五分钟的检查，合起来能在常见配置错误咬人之前抓住它们。

<!-- CODE -->

## 把 OpenViking 当代码读

OpenViking 是服务端，所以"代码"分散在几层：客户端怎么写上下文、服务端怎么索引、搜索怎么下钻 URI 树、agent 怎么决定加载哪一层。我会追一遍开发者真正碰到的部分，然后展示如果把它接进 dsh 风格的 agent，你要写的集成层。

先说个框架。完整服务端源码很大，团队也一直在动。对这篇拆解重要的是你对着写代码的契约，URI 方案和 find 调用，而这份契约稳定到可以放心构建。

## 写路径

把上下文写进库，是第一个要理解的操作。一个资源写到某个 URI，服务端同时为语义搜索建立索引。

```python
import viking

client = viking.Client(base_url="http://localhost:8000")

runbook = viking.Resource(
    uri="viking://resources/runbooks/payment-timeout",
    content=text_of_runbook,
    summary="Troubleshooting steps for payment timeouts",
)
client.upsert(runbook)
```

`upsert` 在好意义上幂等。同一 URI 重跑，更新资源而不是复制一份。这是上下文库想要的属性，因为 agent 天然会随时间重写、精炼知识。`summary` 字段喂给 L0 层，意思是你在写的时候就决定了，之后的廉价相关性检查会看到什么。

URI 不是装饰。路径是主要寻址机制。写到 `viking://resources/runbooks/...` 和写到 `viking://memories/...` 不是命名选择，它改变的是命名空间和检索行为。

## 查找路径

检索就是一次调用，目录锚点是让它保持清醒的东西。在叶子目录里搜索保持狭窄。在父目录搜索则下钻。

```python
results = client.find(
    "payment gateway returns 502 after retries",
    target_uri="viking://resources/runbooks",
    recursive=True,
)
```

`recursive=True` 打开目录递归检索。开着，搜索会走遍 `runbooks` 下的子目录并合并语义命中。关着，只有锚点直接下的资源是候选。这个旋钮回答了经典 RAG 的抱怨：搜对了东西却拿到错的碎片。

每个结果带 score。参考实现里这个分来自 embedding 距离，可选地再由 rerank 模型精排。库很大时 rerank 值得开，它花一点延迟换明显更好的排序。配置在服务端设置里，不在客户端。

## 分层加载，L0 到 L2

三层设计是 OpenViking 停止像普通向量库、开始像带摘要的文件系统的地方。agent 先看摘要，再决定走多深。

```python
def load_document(client, uri, tier):
    if tier == "L0":
        return client.read(uri, level=0)   # summary only
    if tier == "L1":
        return client.read(uri, level=1)   # structured overview
    return client.read(uri, level=2)       # full text
```

层级由 agent 侧的策略决定。便宜的筛选一遍，给每个候选读 L0，留下摘要看着相关的，幸存者才读 L1 或 L2。我在一个面向支持的问答库上用过，对 token 花费的影响就是我用它的原因。那些本来要全文读、每个几千 token 的文档，光靠摘要就被跳过了。

L0 摘要和 L1 结构是服务端在写入时用配置的模型算好的。意思是分层视图不是检索时的小把戏，它是存储文档的一部分。

## dsh 集成层

现在接回本站内容的重点：怎么把 OpenViking 暴露成 dsh 风格插件。插件导出 apply 函数，包住 viking 客户端。我给内部 agent 写过这样的集成：

```ts
import { Client } from "@openviking/client";
import type { Ctx } from "@deepseek-ai/dsh";

export default async function apply(ctx: Ctx, config: VikingConfig) {
  const client = new Client({ baseUrl: config.baseUrl, token: config.token });
  ctx.on("session:create", async (session) => {
    const memory = await client.find(
      buildQuery(session.intent),
      { targetUri: "viking://memories", recursive: true }
    );
    const block = await Promise.all(
      memory.slice(0, config.topK).map((hit) =>
        client.read(hit.uri, { level: config.tier ?? "L1" })
      )
    );
    ctx.attachMemory(block, { maxTokens: config.maxTokens });
  });
}
```

形状应该眼熟，因为和本地记忆插件是同一套生命周期。会话开始触发一次读取，读取变成挂上的记忆块，块前置进对话。差别在数据住哪、怎么检索。这里读取是对共享服务端的语义搜索，不是对本地分支的文件读取。

`ctx.attachMemory` 这个名字是示意性的，客户端 import 路径也是。具体包名和钩子名取决于你的 harness 版本。可迁移的是结构：写和读分开，检索带锚点、分层。

## 会话管理

会话是服务端上的一等对象。聊天历史住在记忆 URI 下，服务端跟踪它。调用方不用再从原始对话重建上下文。

```python
session = client.create_session("support-ticket-4821")
client.append(session.uri, "user: the gateway is returning 502")
state = client.session_state(session.uri)
```

自动会话管理在 agent 任务跨很多轮时显现。每一轮的上下文都存在会话 URI 下，重连从上次停的地方接上。放到和本地五轨插件的对比里，这是"下一次会话还记得"的集中式版本。本地插件把每日日志存在文件里。OpenViking 把会话状态存在服务端，用 URI 寻址。

## 可观测性：检索轨迹

有一个功能在调试时很突出，可视化的检索轨迹。服务端记录搜索怎么下钻树、访问了哪些目录、每步返回了哪些结果。检索错了，你可以重放这条路径，而不是猜 agent 为什么找到它找到的东西。

用代码说，一次 find 返回的不只是结果，还有轨迹。客户端把它暴露成结果对象上的元数据，服务端 UI 把它渲染成树。搜索返回垃圾时，轨迹显示锚点是不是太宽、embedding 是不是没抓住意图、或者 rerank 是不是埋掉了对的命中。这是经典 RAG 链路缺的可观测性，也是为什么调试 OpenViking 更像调试数据库查询，而不是调试黑箱。

## 多模态支持

这个库不只有文本。服务端把图片和文本一起索引，用视觉语言模型理解，用 embedding 模型检索。贴进资源的截图，可以被一段描述它内容的文本查询找到。

```python
client.upsert(viking.Resource(
    uri="viking://resources/screenshots/login-error",
    content=image_bytes,
    mime="image/png",
    summary="Screenshot of the login error dialog",
))
```

多模态路径对处理设计稿、仪表盘、报错截图的 agent 很重要，而大多数真实支持工作就是这些。检索故事不变：锚点、搜索、打分、分层。模态只改变存了什么。

## 检索返回空时

空结果的情况值得显式处理。搜索一个都没有，不一定是 bug。通常意味着锚点太窄、查询词和存储内容的词汇表分歧太大、或者资源从来没被索引过。分层加载和轨迹让诊断变快。我加了一个回退，搜索空时把锚点放宽一层：

```python
def find_with_fallback(client, query, anchor):
    results = client.find(query, target_uri=anchor, recursive=True)
    if results.resources:
        return results
    parent = anchor.rsplit("/", 1)[0]
    return client.find(query, target_uri=parent, recursive=True)
```

放宽锚点是最便宜的修复，通常能成，因为库组织成树，顶层命名空间很少。同样的动作在扁平向量库里没有意义，因为没有目录可以放宽。

## 代码对比说明了什么

并排读，两种记忆方案不是同一件事的竞争实现。本地插件是一个决策的文件系统，按固定顺序读。OpenViking 是一个可查询的库，按语义相关性读。一个简单且完全归你。另一个强大且共享。两者的代码都反映了这点。本地插件的读路径是五次并行文件读。服务端插件的读路径是一次带锚点、带分、带层级选择的搜索。

这是接任一个进去的人实际能带走的结论。如果你的上下文是一组想要可检视、有版本的决策和偏好，文件路径用几乎零活动部件就给你这些。如果你的上下文是很多 agent 都在读的增长中的知识库，服务端路径给你文件和本地方案给不了的检索质量和共享访问，而你要写的代码只是包着稳定契约的薄客户端。

<!-- HIGHLIGHTS -->

## 给 OpenViking 打分

我会用和本地记忆插件相同的维度给 OpenViking 打分，因为这两篇就是让人并排读的。然后列出驱动分数的具体亮点，再列那些应该拦住你盲目采用的取舍。

## 计分卡

- 上下文质量：9/10。目录锚定、递归检索修掉了困扰扁平 RAG 的碎片化。语义搜索开始前，结果已经被限定在正确的书架上。
- token 效率：9/10。L0/L1/L2 分层是我在上下文工具里见过最强的成本控制。全文加载只在摘要证明它值得时才发生。
- 可观测性：9/10。可视化检索轨迹把检索调试从猜谜变成一条可读的轨迹。这很少见，也很值钱。
- 会话连续性：8/10。自动会话管理有效，重连后仍存活。扣分是因为它是集中式的，依赖服务端在线。
- 运维成本：5/10。这是诚实的弱项。服务端、embedding 流水线、存储，都要跑、都要付钱。
- 单人本地适配：4/10。对想要上下文跟着本地工作区走的单个人，基于文件的插件更轻，这个是杀鸡用牛刀。

## 亮点详述

- 文件系统范式修掉了碎片化问题。经典 RAG 把文档切成块平铺存储。检索到一块，拿到的是没有上下文的碎片。OpenViking 保持文档完整、按路径寻址，搜索锚定在目录上。我在 runbook 库里搜支付超时，回来的是完整流程，不是散落的段落。差别是结构性的，不是调参技巧。

- 分层加载是本类目里最好的 token 控制。L0 几句话，L1 结构化概览，L2 全文。agent 读浅层判断相关性，只在真需要时加载全文。在一个长 runbook 的知识库上，我量到对提示词尺寸的影响是戏剧性的，因为大多数候选根本没越过摘要。单这一个功能，就值得任何 agent 读长文档的人用这个工具。

- 目录递归检索和人找东西的方式一致。你不会为修一个 bug 搜遍整座图书馆，你会去故障排查那个架子翻。递归搜索对 agent 做同样的事，从正确的目录开始下钻。锚点是查询的一等公民，这是大多数扁平 RAG 工具从不做的设计决定。

- 检索轨迹让调试可见。搜索返回错的东西时，轨迹显示搜索走了哪条路、访问了哪些目录、在哪里打了什么分。我就这样修好过一例真正迷惑的检索，看到锚点太宽、rerank 埋掉了正确的命中。一条能读的轨迹，胜过一百行日志。

- 自动会话管理去掉了一整类胶水代码。会话活在服务端，上下文用 URI 寻址。调用方不用手拼对话。对长周期任务，这是"干净续跑"和"重新来过"之间的差别。

- 记忆、资源、技能一个库装下。单一 URI 方案下的三个命名空间意味着 agent 的长期记忆、团队知识库、可复用流程都在一个可查询的地方。检索用同一个 find 调用横跨它们。统一是重点，也是让 OpenViking 感觉像数据库而不是又一个 RAG 库的原因。

- 多模态检索是内置的，不是后补的。文本、图片、截图索引进同一棵树，从同一次搜索回来。对看报错截图或设计稿的支持 agent，这补上了纯文本记忆留下的缺口。

- 企业级扩展是设计目标。参考后端 VikingDB 就是为大向量负载建的，团队资料声称万亿级容量和更低的成本。我没法从这里验证这些数字，你也不该照单全收。可验证的是形状：这是个设计上就要超过文件夹容量的工具。

- 项目有真实动量。写这篇时仓库约 28.9k star，对一个年轻的基础设施项目，这是很强的关注信号。字节跳动 Viking 团队背书，Apache 2.0 许可，去掉了常见的被放弃和许可摩擦的顾虑。

## 你应该权衡的取舍

- 它是服务端，服务端有月度成本。托管、embedding、存储、在线率，现在都是你的问题。基于文件的插件完全没有这些，对独立开发者，这个差别可能单独决定选择。

- 默认路径偏向供应商技术栈。embedding 和 rerank 默认是 Doubao 模型，托管后端是 VikingDB。可以配置替代品，但无摩擦的路指向字节生态。有中立要求的团队要给这个配置留预算时间。

- 它还早。文档随版本变动，项目页上的启动命令比成熟项目换得勤。我搭服务端时撞上过，赔了一个下午。功能是真的，打磨还在路上。

- 本地开发更重。为一个实验拉起库，意味着跑服务端、付索引的钱。本地插件在 dsh 启动那一刻就在跑。两者各有位置，不重叠。

## 一笔具体的 token 账

数字让分层论证具体化。假设知识库有二十个 runbook，每个大约四千 token。一个天真的 agent 为了回答一个问题加载每个文档。那是每个问题八万 token，任何预算都撑不住。

有分层，流程就变了。每个 runbook 还有一个约一百五十 token 的 L0 摘要。第一遍读全部二十个摘要，二十乘一百五十，大约三千 token。多数摘要明显无关，agent 留下三个候选。它读它们的 L1 概览，三个乘大约一千，又三千。一个文档真的相关，它在 L2 加载它，四千 token。总价约一万 token，而不是八万。

同样的答案，八分之一的成本，而且 agent 没读它不需要的十九个文档。这个算术就是我说分层是本类目最好 token 控制的原因。这不是含糊的效率说法，是你能在电子表格里量出来的系数。

## 一个知识库，很多 agent

集中式的形状在不止一个 agent 读同一内容时回报最大。支持 agent、开发 agent、文档 agent 都能查同一个 resources 树，一个写的更新其他立刻可见。没有要同步的副本，没有要调和的漂移。

会话模型在共享知识库的同时保持各自上下文独立。每个 agent 有自己的会话 URI，但读同一个 resources。这个拆分，共享知识加私有会话，正是小团队想要的形状，也是人多时服务端压倒本地文件的最强论据。

## 访问控制与治理

一旦库里装的是团队知识，访问控制就不再是可选项。URI 树给了按命名空间挂权限的自然位置。你可以让支持 agent 读 runbooks，但不让它在 resources 下写架构决策。具体机制取决于部署，项目页记录当前版本支持什么。重点是结构性的：因为一切按路径寻址，权限有自然的形状，而不是硬贴上来的。

## 两者之间怎么选

如果你是想要决策跟着自己在项目之间走的独立开发者，用本地文件方案。它即时、免费、可检视。如果你是团队，跑着 agent 打一个共享知识库，里面是长文档和多模态内容，集中式库挣得起它的运维成本。

诚实的框架不是"哪个更好"。是"你能容忍哪种失败方式"。本地插件失败是忘掉一条你想留的事实。OpenViking 失败是宕机，或者花超预算。不同团队能忍受不同的失败。这个选型取舍，就是这两篇拆解存在的意义。
