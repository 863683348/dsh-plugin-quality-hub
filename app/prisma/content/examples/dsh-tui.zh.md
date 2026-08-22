<!-- CONFIG -->

默认渲染层是舒适区。web 客户端按某种方式渲染面板、标签页和输出，大家都以为这是唯一的方式。dsh-TUI（仓库 ccch1mneyyy/dsh-TUI）就是证明这个假设错误的那款插件。它把默认渲染换成全屏终端 UI。一条像素鲸鱼在顶栏游过，思考块一边生成一边流式展开，按两下 Esc 回滚旧输出。800 多个 star 说明这个实验成了。

这个插件还有第二个意义。它证明了默认渲染层可以被替换。web 客户端启动时会发现已注册的皮肤和面板。dsh-TUI 通过 ctx.ui.registerSkin 注册一个皮肤，你激活它后，整个客户端用终端美学重绘。harness 本身一行都不用改。插件是配置，不是对核心的补丁。

配置和每个 DSH 插件一样起步。一条安装命令，一个 profile：

```bash
dsh plugin --profile web add github:ccch1mneyyy/dsh-TUI
```

装完列出注册了什么，再查清单：

```bash
dsh plugin --profile web list
dsh plugin --profile web inspect ccch1mneyyy/dsh-TUI
```

这个插件的 inspect 输出比大多数都长，因为皮肤声明的东西比入口文件多。它声明覆盖哪些面板、拉进哪些字体、占用哪些键盘组合键。如果 inspect 显示皮肤是未激活，问题出在你的激活，不是安装。激活是配置步骤，也是最容易被跳过的步骤。

激活在 dsh.config.ts 里。光装包不会启用皮肤，你要主动选它：

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

分层次读。ui.skin 在整个客户端里选激活的皮肤。这一个键就让终端 UI 接管所有面板。plugins 接着配置皮肤自己的行为。whale 控制顶栏像素鲸鱼，animate 和 speed 顾名思义。thinking.streaming 决定思考块是生成时实时展开，还是等你请求再展开。scrollback.escDoubleTimeoutMs 设置双击 Esc 手势的时间窗。350 毫秒内按两次 Esc，客户端回滚历史。超出这个窗，单次 Esc 干它正常的活。

两个配置细节经常坑人。第一个是 profile 不匹配。皮肤只在 web profile 注册，所以在 desktop profile 下把 ui.skin 设成 dsh-tui 会得到一条警告和默认回退。警告文案是"此 profile 无此皮肤"，很准确但在快速启动日志里容易被忽略。第二个细节是键的顺序。ui.skin 必须按注册的皮肤 id 引用插件，不是包名。这两个在这里几乎一样，dsh-tui 对 ccch1mneyyy/dsh-TUI，混用会在启动时报未知皮肤错误。

还有字体的事，它算配置的邻居。终端观感依赖带制表符绘制字形的等宽字体。插件自带字体并注册给 web 客户端的字体加载器。你不用单独装，但如果客户端在严格 CSP 后面自托管，字体要进你的字体白名单。那是部署配置，不是插件配置，而且只在鲸鱼渲染成空矩形时才会暴露。

字体这条链值得多说两句，因为它是皮肤类插件里最容易出事故的部分。插件把字体文件打进包，web 客户端启动时按 font-face 加载。正常安装下一切自动，但一旦你启用了 script-src 和 font-src 都很紧的内容安全策略，字体请求会被浏览器直接拦掉。这时候你看到的不是报错，而是制表符全部变成空方块，终端边框断成一截一截。排这种问题没有捷径，只能先看控制台的 CSP 拦截记录，再把字体源加进白名单。另一个常见场景是内网离线部署，字体文件在 CDN 上，内网拉不到，结果一样。所以皮肤插件落地时，字体往往比功能本身更早碰到环境差异。

键盘组合键是第三块更小的面。皮肤激活时插件占用几个全局快捷键，所以如果你自己的配置里已经绑了同一个组合键，插件那个会输。冲突解决是先到先得，harness 会记一条组合键冲突警告。搞清楚这个先后顺序，你就不用去调试一个悄悄失效的快捷键。

dsh-TUI 的配置维度故意做得很小。皮肤是一种外观加几个行为，插件把表面严格控制在这么多。位置、颜色、边框都交给皮肤自己处理，所以你的配置保持可读。真正的质量在代码里，一个全屏终端渲染器替换默认层，也在亮点里，可替换性这个论点在那里被打分。

<!-- CODE -->

皮肤是 DSH UI 系统里最有趣的契约，因为它在不动 harness 的情况下替换渲染层。dsh-TUI 注册一个皮肤，然后在其内部做真正的活。这一节讲让终端 UI 跑起来的代码：皮肤注册、鲸鱼栏、流式思考块、双击 Esc 回滚。

皮肤注册是入口：

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

registerSkin 的形状镜像 registerTab，多两个字段。priority 告诉客户端在注册了多个皮肤时这个皮肤的排位。panels 列出这个皮肤接管哪些命名表面。mount 拿到整个客户端的宿主元素，不是单个标签页，因为皮肤要重绘一切。返回的对象仍然带 dispose()，harness 卸载时仍然调用它。和标签页同一套纪律，只是画布更大。

这里有个容易被忽略的点：mount 是整个渲染生命周期的起点。harness 把宿主元素交给 mount 之后，这个插件就对宿主里的每一个像素负责。默认渲染器的面板切换、输入框聚焦、状态栏更新，这些都要皮肤自己接管或主动放弃。dsh-TUI 的选择是接管渲染，把交互事件转发回 harness 的输入总线。转发靠的是 ctx 上的输入事件回调，皮肤不需要自己实现一套按键解析，只把原始事件原样交给上游。这种分工避免了皮肤和核心各自维护一份快捷键表。

TerminalUI 类持有画布和输入层。鲸鱼栏是个性的所在，也是最好解释的部分：

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

几个选择值得注意。鲸鱼按设备像素比画成画布上的块字形，所以在高分屏上保持锐利，这就是"像素鲸鱼"观感的来源。requestAnimationFrame 而不是 setInterval 驱动循环，所以标签页在后台时浏览器节流 rAF，动画自动暂停，这是免费的性能。鲸鱼坐标用模运算跨画布宽度回绕，从右到左循环没有一像素缝隙。config 里的 animate 标志映射成一个条件判断：为 false 时不启动循环，鲸鱼变成静态图。

性能上还有一个更深的取舍，就是画布重绘的成本。整个终端画面在一张画布上逐帧 clear 再重画，如果面板内容很多，fillRect 的开销会跟着上来。插件对此的选择是只在内容变化时才重绘有变化的那一行，而不是每帧全量刷新。鲸鱼动画是唯一每帧都动的部分，它被隔离在顶栏自己的小画布里，这样主画面的重绘频率可以压到很低。把高频动画和低频内容拆成两张画布，是一个成本极低但收益明确的优化，皮肤类插件都该抄这一手。

流式思考块是第二个功能。默认渲染层在推理结束后才显示。这个皮肤在 token 到达时打开块：

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

tokens 事件携带推理流的每个增量块。追加到 textContent 并把 scrollTop 顶到底，让块钉在最新 token 上，这就是用户说的"思考实时展开"的行为。再次刻意用 textContent。推理文本是模型输出，未分型且有潜在对抗性，textContent 保证它按纯文本渲染。thinking-done 事件翻转一个 class，皮肤用这个 class 调暗或折叠块，取决于 expandOnRequest 配置。

流式追加还有一个体验细节：追加的频率。模型吐 token 可以快到每帧十几个，如果每次回调都立刻改 DOM，输入法光标和滚动会打架。插件做了一层合并，把同一渲染帧内的多次追加攒成一次提交。这个合并发生在 ctx 的令牌缓冲层，皮肤只是消费端，所以在代码里看不见。知道这个机制能帮你理解为什么流式展开有时看起来一抖一抖地跳动，那是帧合并后的自然节律，不是插件在卡。

双击 Esc 回滚是第三个功能，也是最微妙的。终端需要历史。插件维护一个渲染帧的环形缓冲，并拦截 Esc：

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

逻辑读起来很干净。第一次 Esc 启动计时器。窗口内第二次 Esc 取消计时器并触发回滚。计时器单独触发就重置状态，所以单次 Esc 始终是单次。history 数组限制固定长度以约束内存，超限丢掉最旧帧。scrollBack 从末尾往回走，用户一次回退一屏。

回滚缓冲的内存上限值得单独说。环形缓冲固定存最近若干帧，每帧保留渲染后的文本快照而不是画布位图。文本快照比位图省一个数量级的内存，长会话跑几小时也不会把浏览器撑爆。用户在回滚模式下翻的是这些快照，退出回滚后快照保留，以便再次按两下 Esc 还能回去。这种"文本快照加固定容量"的组合，是终端类 UI 处理无限历史的通用答案，也是这个插件在长时间使用后仍然流畅的原因。

dispose 路径关掉全部三个系统：

```ts
dispose() {
  cancelAnimationFrame(this.raf);
  window.removeEventListener("keydown", this.keyHandler);
  window.removeEventListener("resize", this.resizeHandler);
  this.canvas.remove();
}
```

cancelAnimationFrame 干净地停掉鲸鱼循环，而不是让它在分离的画布上永远转下去。两个全局监听都按命名的 handler 引用移除，这是让移除真正生效的细节。移除画布节点清掉终端表面。模式和侧边栏插件是同一个，只是放大了。

dsh-TUI 的代码教训是：皮肤就是更大的标签页。注册契约一样，mount 返回可释放对象，清理对称。区别只是画布大小和子系统数量。如果会写标签页就会写皮肤，这是"默认渲染层可替换"不是特例的最强论据。它是同一条规则在更大尺度上的应用。

<!-- HIGHLIGHTS -->

皮肤和标签页的打分方式不一样，因为皮肤把整个客户端背在身上。坏标签页可以躲在其余 UI 后面。坏皮肤就是整个 UI。dsh-TUI 得同时赢下好几条战线，下面的亮点反映 800 多个 star 到底在为什么付钱。每一项是一个可打分准则，附上理由。

1. 默认渲染层可替换。这是头条声明，也是这个插件存在的原因。它通过 ctx.ui.registerSkin 注册，这是其他每个 UI 插件都在用的同一个公开 UI API，harness 在启动时发现它。没有核心改动，没有 fork，没有特殊处理。概念验证能成，是因为注册契约本来就能承载完整渲染器。这里的分数是关于架构的：替换渲染层的插件不是例外，是一个正常皮肤做正常的事。

2. 像素鲸鱼当签名。鲸鱼是画布上的块字形，用 requestAnimationFrame 按设备像素比动画。它小、便宜、一眼可认。一个签名视觉对开源项目的作用超过一百个功能，因为它给项目一张人们会转发的脸。评分表里有独特一条，鲸鱼一帧就过关。它也示范了在皮肤里画图的正确姿势：DPR 画布、rAF 循环、模运算回绕。

3. 从 rAF 白拿的性能。动画循环跑在 requestAnimationFrame 上，浏览器在标签页隐藏时会节流它。也就是说你不看它时鲸鱼几乎零成本。setInterval 会在后台一直触发，白白烧 CPU。这个选择对用户不可见，对维护者一目了然，正是评分奖励的那种细节。不用写任何性能代码就得到的性能是最好的性能。

4. 流式思考块。默认层只在推理结束后才露出思考。这个皮肤实时打开块，token 到达就追加，滚动钉在最新一个上。这改变了长推理会话的手感，因为你看着模型想，而不是盯着 spinner。tokens 事件是默认渲染器用的同一个事件，所以这是呈现层的改变，不是数据管道的改变。能在不重新抓取任何东西的情况下重新呈现已有流，这拿高分。

5. 纯文本纪律。推理输出是未分型的模型文本。皮肤用 textContent 渲染它，所以 <img src=x onerror=...> 这种 token 会按字面文本渲染，永不执行。这和侧边栏插件的选择一样，在这里重要两倍，因为推理流比分支名更长更不可预测。规则简单一致：任何来自插件外部的字符串都走 textContent，绝不走 innerHTML。

6. 双击 Esc 回滚手势。超时窗内按两下，通过封顶的历史缓冲回退一屏。这个手势可学、状态栏提示可发现、不跟任何东西冲突，因为窗口外单次 Esc 保持原义。回滚是让皮肤像真终端而不是化装服的功能，escDoubleTimeoutMs 配置让每个用户都能调手势。

7. 全局监听的干净归属。皮肤在 window 上加了 keydown 和 resize 监听，dispose() 按命名的引用移除两者，不是复制粘贴。cancelAnimationFrame 停掉循环。能干净卸载全局状态的皮肤才能干净卸载，因为运行时切皮肤两个方向都得能走。评分奖励可逆的效果，这个插件创建的每个效果都有显式的撤销。

8. 与行为成比例的配置。whale、thinking、scrollback 三个键一对一映射三个子系统。没有设置大杂烩。每个键要么改一个看得见的东西，要么回落到相同行为。这种成比例让用户不用读插件源码就能调体验，也让配置段短到能塞进一篇博客，这正是它被用来教学的原因。

9. 真实的 UI 插件可组合证明。皮肤和标签页、面板走同一个 ctx.ui 面注册。也就是说不同插件的皮肤和标签页可以共存，因为注册表按类型分命名空间。这里的生态论点很具体：dsh-TUI 证明的可替换性正是整个插件市场可行的原因，因为每个 UI 插件都依赖同一个可发现的注册表。

10. 跨 harness 升级的稳定。插件从 dsh/types 导入，通过 registerSkin 和 tokens 事件跟客户端说话。它不伸进内部渲染器代码，所以改变默认 UI 的 harness 升级不会弄坏皮肤。用户感受到的是插件扛过版本升级不折腾。对坐在最侵入层的皮肤来说，这种稳定是 star 增长和一个仓库被归档的区别。

800 多个 star 不是流行度偶然。这是市场给可替换性论点以及支撑它的手艺定价。对插件作者的启发更窄：用公开注册 API 替换默认层，所有渲染输出保持纯文本，每个效果都可逆。做到这三条，渲染层就不是墙，而是门。

最后补一个选型层面的观察。一个能替换渲染层的插件，它的价值不在界面好不好看，而在它证明了一条路径：用户对默认 UI 不满时，不用等 harness 团队改版，自己换皮肤就行。这个插件把"等官方改"变成"自己换"，这是开源生态里最稀缺的那类能力。对做插件的人来说，它提示了一个方向，与其做一百个锦上添花的小标签页，不如做一个接管整个画布的大皮肤，后者的影响面和 star 回报都更值得投入。
