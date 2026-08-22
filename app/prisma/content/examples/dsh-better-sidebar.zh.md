<!-- CONFIG -->

侧边栏是大多数人在一个 harness 里最先想改的地方。默认左侧栏有四个标签页：文件、终端、Git、子代理。这个布局能用，但它是固定的。DSH-better-sidebar（仓库 omdsh-dev/DSH-better-sidebar）把这条固定栏变成了扩展点。任何第三方插件都可以在自带标签页旁边注册自己的标签页。本篇讲这个技巧的配置那一半，代码那一半和评分亮点在另外两节。

先说 DSH 插件的本质。一个插件就是一个导出 apply(ctx, config) 函数的 JS 或 TS 模块，这就是全部契约。harness 在启动时调用你的 apply 一次，把上下文对象和你的配置交给你，你挂载 UI 或者直接返回，没有魔法。配置这一维要做三件事：声明这个模块是插件、选定 profile、调节传给 apply() 的 options 对象。

安装就是一条命令。web profile 下是这样：

```bash
dsh plugin --profile web add github:omdsh-dev/DSH-better-sidebar
```

harness 会克隆仓库、读 package.json、找 dsh bundle 段、把入口文件接进 web 构建。几秒后你可以确认它是否生效：

```bash
dsh plugin --profile web list
dsh plugin --profile web inspect omdsh-dev/DSH-better-sidebar
```

inspect 值得跑一次。它会打印解析后的入口文件、声明的 hook 和插件声明的配置 schema。如果入口文件显示缺失，说明你漏了 patch 字段。这是最常见的失败，而且它是静默失败，所以 inspect 是你的朋友。

插件之所以能被识别，靠的是 package.json 声明。这是让它可加载的最小配置：

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

这里有两件事要紧。第一是 dsh.bundle.patch 数组，没有它 harness 永远不会把这个包当插件处理，你的 apply() 写得再干净也没用。第二是入口文件以 TypeScript 源码形式出现在 patch 里。harness 在启动时把它编译进 web 客户端 bundle。这就是为什么 UI 插件不需要你这边单独做构建步骤，你交付源码，harness 负责 patch 进去。

然后是配置对象。DSH-better-sidebar 从你的 dsh.config.ts 里读一小块 options。插件声明 schema，harness 在 web 客户端启动时拿你的配置去校验。一个贴近实际的配置长这样：

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

从上往下读。enabled 让你不卸载也能开关插件。position 把整条侧边栏钉在左边或右边。tabs 让你重排或隐藏内置标签页。metrics 是插件自带的标签页，customTabsPath 指向一个文件，你可以在插件仓库之外定义自己的标签页。最后这个是最低调的杀手级功能，你完全不用碰插件源码，只扩展它。

三个配置值容易坑人。collapseAfterMs 在空闲后自动折叠侧边栏，如果窗口很窄就设成 0。defaultCollapsed 在小屏上很重要，六个标签页的侧边栏很占宽度。customTabsPath 一旦写错会在启动时报错，侧边栏回退到默认，所以路径保持相对项目根目录，重启前先用 ls 确认。

还有一层配置面叫 profile。web profile 管浏览器客户端，还有其他 profile 用于桌面和无头工作流。只给 web profile 声明的插件在别的 profile 里根本不会加载。如果团队在多台机器上跑同一份配置，每次换机器都要按 profile 分开安装，并检查 dsh plugin --profile web list。

常见错误链条是这样的。有人克隆仓库、改 dsh.config.ts、重启，然后新标签页不见了，他怪插件。实际上要么 package.json 的 patch 数组是空的，要么 profile 参数指错了，要么配置键拼错了。三种情况症状一样：什么都不渲染。所以配置排查顺序是 package.json 第一、profile 第二、键拼写第三。这个插件受欢迎，部分原因就是配置一旦写对，效果立刻可见，刷新一次新标签页就出现在栏里。

配置维还有一个容易被忽略的点是版本锁定。dsh plugin add 默认拉最新 tag，但生产环境里团队往往要锁死版本，避免插件作者改了默认行为之后整条侧边栏跟着变。做法是在配置里显式声明期望版本，或者用 package-lock 类机制固定安装来源。另一个点是离线环境。harness 安装插件要走 GitHub，内网用户通常预先把仓库镜像到内部源，再用本地路径安装。这些都不是插件特有的问题，但它们决定了一个 UI 插件能不能在一个组织里长期稳定跑。

这种可见性也是为什么侧边栏是学 DSH UI 插件最好的教材。配置只是外壳，让标签页出现的是代码，那是下一节的内容，而让它评分高则是最后亮点节的事。

<!-- CODE -->

配置一节讲了标签页从哪里声明式地来。现在讲真正的活：apply() 函数和 registerTab 调用。整个插件就是一个导出函数加几个 DOM 辅助函数，整个表面积就这么大，这种小是刻意的。

下面是核心，裁到只剩要紧的东西：

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

逐行看。import 从 dsh 包拉两个类型。这个导入路径 dsh/types 在近几个 harness 版本里是稳定的，所以插件不用追内部名字。apply() 不做解构，它直接读 ctx 和 config 对象，所以传一个不完整的 config 对象不会让插件崩掉。

registerTab 调用是心脏。四个字段要紧。id 在所有插件里必须唯一，因为 harness 用 id 做内部注册表的键。title 是栏里显示的名字。icon 引用内置图标集，"panel-left" 是真实条目，想要自定义图形也可以直接传 SVG 字符串。order 控制相对内置标签页的位置，负值把标签页往前推。mount 是契约，harness 给你一个宿主元素，你在里面建 UI，然后返回一个带 dispose() 方法的对象。

这个返回对象比看起来重要。harness 会保留 mount 返回的东西，在卸载或关标签页时调用它的 dispose()。如果你忘了返回 dispose，harness 会警告并直接分离宿主元素，通常还能用，但事件监听会泄漏。返回一个带 dispose 的对象是 DSH 唯一一条绝不该跳过的约定。

customTabsPath 分支让这个插件从标签页变成框架。ctx.resolveConfigPath() 把你的相对路径按项目根目录变成绝对路径。然后插件读一个 tabs 数组，用同样的 registerTab 契约逐个注册。也就是说用户的 sidecar 文件可以定义一个和插件自带标签页相同 mount 签名的标签页。扩展的扩展，不需要 fork。

结尾的 dispose 注册用的是 ctx.on("dispose", ...)。harness 在插件卸载前触发一次，这是注销标签页、移除全局监听的正确位置。在两个地方做清理，这里和返回对象里，有点防御过度但无害。

还有一个生命周期细节值得提。mount 的调用时机在 harness 完成标签页注册表构建之后、首次渲染之前。所以 mount 里可以放心依赖宿主 DOM 已经存在的兄弟节点。反过来，如果插件在 apply 顶层就急着碰 DOM，那必然会拿到空引用。这个时序约束解释了为什么所有 UI 组件都必须放进 mount，而不是放在 apply 的函数体里。

Sidebar 类才是真正的 DOM 活，这是精简版：

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

renderTabs 用 document.createElement 而不是 innerHTML。这是刻意选择，因为带插值字符串的 innerHTML 是注入面，而 DSH 标签页会渲染用户控制的文本，比如仓库名和分支名。createElement 让每个标签都走 textContent，没法执行标记。对一个要显示任意分支名和文件名的插件来说，这一个决定就是它能过审的一大原因。

tablist role 和 tab role 属性是无障碍胶水。三行代码，让这条栏可以键盘导航。大多数 UI 插件会跳过这个，这个没跳，评分里看得见。

bindCollapse 接自动折叠。mousemove 监听重置计时器，指针停住后侧边栏折叠。root 上的 data-position 属性让皮肤层不用任何内联样式就能应用左右对应的 CSS。内联样式会压过 CSS 变量在级联里的位置，那会跟主题系统打架。把所有视觉决定留在 class 里，插件就保持主题无关。

dispose() 又短又正确。清计时器，删节点。现代浏览器里删节点时监听会自动清理，所以这个插件唯一的泄漏源是计时器，它处理掉了。

错误处理在 apply 边界上。插件把 sidecar 加载包在 try/catch 里，用 ctx.log.warn 记日志而不是抛异常：

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

这个 try/catch 把硬启动失败变成可见警告。harness 继续跑，内置标签页照样渲染，用户看到 toast 而不是空白客户端。对一个有几千安装量的开源插件来说，这就是一星差评和提 patch 的区别。

代码维还有一处值得留意，就是 unregisterTab 的对称性。apply 注册了 dsh-sidebar 这个 id，dispose 时按同一个 id 注销。这套一对一关系让 harness 在插件热重载时能精确替换旧实例，不会留下半个挂载的标签页。热重载是开发期的主要迭代方式，开发者在 index.ts 里改一行，客户端自动重挂。如果注销逻辑不对称，重载几次之后栏里就会攒出一排重复标签页。所以任何注册，从标签页到事件监听，都配一个对应的反注册，这是这个插件代码能一直保持干净的根本原因。

这个插件值得抄的模式是：通过 ctx.ui.registerTab 注册，mount 返回可释放对象，用 createElement 建 DOM，样式不进内联属性，可选输入软失败。生态里每个 UI 插件都长这样，好插件都严格按这个顺序来。

<!-- HIGHLIGHTS -->

给 UI 插件打分和给逻辑插件打分不一样。逻辑插件要么产出正确结果要么没有。UI 插件得看它的手感、它怎么降级、它有多尊重宿主。DSH-better-sidebar 在这些维度上大多数都拿高分，所以下面的亮点按评审人或维护者真正会掂量的标准分组。每一项是一个可打分的准则，附上理由。

1. 扩展点设计，而不是写死的标签页。这个插件本可以只画五个标签页就完事。它反而先通过官方 ctx.ui.registerTab 契约注册一个标签页，然后所有东西、包括用户通过 sidecar 文件提供的标签页，都走同一扇门重新注册。这个设计决定拿了最高分。扩展点每次都胜过 fork，因为用户可以不改插件源码就扩展它。这个选择的代价是 apply() 里多几行，回报是一个永远不需要追着 harness 自带标签列表跑的插件。

2. 对 mount 和 dispose 的契约遵守。每个标签页 mount 都返回带 dispose() 的对象。harness 靠这个形状做干净卸载。注册表里很多插件 mount 返回 undefined，泄漏监听直到浏览器标签页关掉。这个插件在每条路径上都遵守约定，包括 sidecar 分支，用户自定义标签页忘了 dispose 会收到警告而不是静默行为。分数反映这份纪律：它不跟平台对着干，它配合平台。

3. 用 createElement 做 DOM 安全。分支名、文件名、仓库 slug 最后都会变成标签文本。这些字符串来自插件外部。把它们插进 innerHTML 就是存储型 XSS 的载体，离在客户端跑脚本只差一次点击。插件用 createElement 建每个节点、用 textContent 赋值。这不是风格偏好，这是安全和不安全的分界线。评审人很看重这点，你抄这个模式时也该看重。

4. 主题无关的样式。根元素带 data-position，外观由皮肤决定。没有内联样式，没有写死的颜色。也就是说插件在任何已注册皮肤下都渲染正确，包括深色主题和高对比模式，代码里一个条件判断都不用加。维护者喜欢这点，因为它消灭了一整类标题叫"我换皮肤后颜色不对"的工单。

5. 无障碍默认开。nav 用 role="tablist"，每个按钮用 role="tab"。键盘用户可以方向键在标签页间移动、回车激活。折叠状态通过切换按钮的 aria-expanded 播报。这三个小属性大多数侧边栏插件都不写。评分表把无障碍单独列一行，这个插件过关。

6. 坏输入下的优雅降级。customTabsPath 指向不存在的文件在早期版本里是启动崩溃。现在的代码把加载包在 try/catch 里，用 ctx.log.warn 记日志，再用 ctx.ui.notify 弹 UI 通知。客户端正常启动，内置标签页正常渲染，用户看到原因。这种优雅失败是把能在大规模安装里活下来的插件和被第一次坏配置就卸载的插件区分开的东西。

7. 小而可读的表面。整个运行时就是一个类加一个 apply 函数。新贡献者十分钟内能读完整个插件。这种可读性本身就是特性，因为维护者审小 diff 更快，用户信任看得懂的代码。评分在这里偏向极简，这个插件没有用不需要的抽象给自己注水。

8. 读起来像散文的配置。options 对象镜像心智模型：position、collapseAfterMs、defaultCollapsed、customTabsPath。每个键映射一个行为，每个行为刷新一次就能在 UI 里看见。配置复杂度和运行时复杂度保持成比例。配置键存在时它做的事一目了然，缺失时默认值接管。对观众里包含 DSH 新手的插件来说，这是正确的平衡。

9. 显式排序控制。order 用负数让插件把自己放在栏里任意位置，不用跟 harness 内部排序打架。sidecar 标签页默认 50，所以用户扩展默认排在内置组后面，但也能被强行推到最前。控制很小但真实，它挡住了侧边栏插件最常见的抱怨，也就是"我的标签页落错位置了"。

10. 稳定的公开类型。从 dsh/types 导入而不是挖内部路径，意味着插件能扛过 harness 升级，不用发一个追改版。用户感受到的是"它一直在工作"，这是 UI 插件能得到的最高褒奖。评分表里有一条兼容性，这个插件靠稳定性得分，而不是靠发版频率。

合起来这些点解释了大约 371 到 735 的 star 区间。这个插件没有重造侧边栏，它打开了侧边栏。对正在评估要不要自己做 UI 插件的人来说，教训在第一条：用官方注册 API 暴露扩展点，剩下的一切，主题、无障碍、安全，都变成你可以拿来给自己打分的清单。

还有一个观察值得放到最后。这类 UI 增强插件的 star 增长曲线通常不是陡峭的一条线，而是沿着 harness 每次大版本更新往上跳一截。原因很简单，harness 更新会重排内部 DOM，写死的插件跟着坏，走扩展点的插件毫发无损。用户被迫切换的时候，活下来的那个就成了默认选择。这个插件之所以能落在几百 star 的量级，靠的正是这种"版本更迭时依然能用"的长期可靠性，而不是一次性的功能炫技。对读者来说，这也是最实际的选型标准：一个 UI 插件值不值得装，看它跨了多少个 harness 版本还在维护，比看它今天有多少 star 更靠谱。
