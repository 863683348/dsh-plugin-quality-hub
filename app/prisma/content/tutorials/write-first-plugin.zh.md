## 一句话：一切皆插件

DeepSeek Harness，大家简称 dsh，是围绕一个核心思想构建的。CLI、Web UI、工具、命令、技能、MCP server、LLM 适配器和定时任务，全都是插件。插件就是一个导出 `apply(ctx, config)` 的 JS 或 TS 模块。这一句话就是完整的心智模型。想通这一点之后，dsh 的每一个扩展点都变成同一个技能，只是注册调用不同。而新手和资深 dsh 用户的差距，大部分只是记住了多少个注册调用。

我放慢一点，把这个说法落到实处，因为「一切皆插件」这句话被反复引用，引用多了就失去了含义。你运行 `dsh web` 时看到的屏幕，本身就是插件产出的。模型调用工具时，你在 trace 里看到的工具，是已注册的插件能力。你输入斜杠命令时，回答的是一个插件的命令处理器。决定下一步该调用哪个工具的 agent 主循环，也是一个插件。这里没有一个碰不得的隐藏核心。只有 `apply(ctx, config)`，和那个把能力交给你的上下文对象。

这一点有很实际的意义。在大多数工具里，你要为 UI 学一套 SDK，为 CLI 学另一套，为自动化再学一套。在 dsh 里你只学一个契约，然后到处复用。同一个模块既注册斜杠命令，也能注册定时任务，因为两者都只是同一个 `ctx` 上的注册。这种压缩正是 dsh 值得学的根本原因，也是这篇教程存在的理由。

## 插件契约：apply(ctx, config)

每个 dsh 插件，无一例外，都导出一个叫 `apply` 的函数。签名有两个参数。第一个是 `ctx`，是你操作整个 harness 的入口。第二个是 `config`，是用户安装你的插件时提供的任何内容。下面是最小的、真正做事的插件：

```ts
export function apply(ctx, config) {
  ctx.log('my-first-plugin activated');
  ctx.commands.register('hello', {
    description: 'Say hello from your first plugin',
    action: () => `Hello from ${config.name ?? 'my-first-plugin'}`,
  });
}
```

从上往下读这个文件。export 语句让 `apply` 可被发现。第一行往 dsh 日志里写一行，这是你确认插件真的加载了的方式。第二行注册一个叫 `hello` 的斜杠命令。用户在 Web UI 里输入 `/hello` 时，`action` 函数运行并返回问候字符串。

没有别的生命周期钩子是你必须实现的。没有 `init`，没有 `mount`，没有 `destroy`。只要 dsh 能找到 `apply`，它就在 profile 启动时调用一次，你的插件是什么，完全由这次调用期间注册的内容决定。这种去仪式化正是重点。一个只打一行日志的插件也是合法插件，而且它是一个有用的诊断工具，因为它立刻告诉你安装管道是否通。

`ctx` 上能注册什么？简短的回答是 harness 能做的几乎所有事。工具、命令、技能、MCP server、生命周期钩子、模型适配器、定时任务、UI 面板、会话存储访问，全都挂在 `ctx` 上。你不必一次学完。从命令开始，因为它们最容易看到效果。

## 清单文件：package.json 声明 dsh.bundle

这里有一个新手最容易踩的坑。你可以写出完美无缺的插件文件，装上去，却什么都没发生，因为 dsh 不会把安装的每个包都当成插件。一个包只有在 package.json 里声明了 `dsh` 字段，具体说是 `dsh.bundle.patch`，才会成为激活的 profile layer。没有这个声明，包能正常装上，然后静静地躺在那。

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

`patch` 数组就是构成 profile layer 的入口文件列表。它是一个数组而不是单个字符串，这一点很关键。更复杂的插件可以 patch 多个文件，每个都按顺序加载和应用。对你的第一个插件，一个入口就够了。

`type: "module"` 这一行在现代环境里很重要。dsh bundle 是 ES module，所以你的包应该把自己声明成 module。漏掉它，Node 就回落到 CommonJS 语义，你的 `export function apply` 会在加载时变成语法错误。你拿到的报错不一定直观，所以一开始就写上 `type: "module"`，能省掉整整一类困惑。

一个常见问题：入口必须是 TypeScript 还是纯 JavaScript。两种都行。dsh 在加载前会编译 bundle，所以 `.ts` 入口没问题，也是生态里多数插件用的。如果你写纯 JS，把文件命名为 `index.js`，并把这个名字写进 patch 数组。本教程其余部分用 TypeScript，因为生态主要发的是这个。

## 建立项目目录

给插件建一个文件夹并进去。

```bash
mkdir my-first-plugin
cd my-first-plugin
```

开始时需要两个文件：上面展示的带清单的 `package.json`，和插件入口。有 npm 的话，拿到合法清单最快的方式是跑 `npm init -y` 再编辑结果。编辑比命令本身更重要，因为你要手写加 `dsh` 块。

```bash
npm init -y
```

打开生成的 package.json，加上 `type` 和 `dsh` 字段。然后创建入口文件，用编辑器，或者在 Unix 类 shell 上用 heredoc：

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

`src` 目录是惯例，不是硬性要求。dsh 只关心 `dsh.bundle.patch` 里的路径是否对应真实文件。入口放 `src/index.ts`，清单就得写 `"patch": ["src/index.ts"]`。放根目录，清单写 `"patch": ["index.ts"]`。两者不一致是第二大静默失败，紧跟在缺 `dsh` 块之后，所以让它们保持一致。

## 细看 hello 命令

`ctx.commands.register` 值得细看，因为它是你以后注册每种能力的模板。第一个参数是命令名，用户输入为 `/hello`。暂时保持小写、不要连字符，因为 UI 和解析器都按字面处理这个名字。

第二个参数是选项对象。`description` 字符串出现在命令面板和 tooltip 里。要为一个从没见过你插件的人写，因为读它的恰恰是那个人。`action` 函数是命令触发时运行的东西。它可以同步也可以异步，返回值就是展示给用户的内容。

这个例子里的 action 读取 `config.name`。这是 `apply` 的第二个参数渗进了命令体，它用小规模演示了 config 的流动。用户在安装时提供的任何内容，在你的 action 里都拿得到。`??` 回退意味着不带 config 的安装也能给出合理的问候。永远给 config 一个默认值，因为多数用户装完你的插件根本不会去打开配置文件。

## 装进 web profile

dsh 按 profile 隔离插件 bundle。Profile 在 `$DSH_HOME/profiles/` 下，默认 home 是 `~/.dsh`。Web UI 跑的是 `web` profile，也就是本教程要用的那个。

```bash
dsh plugin --profile web add ./
npx @deepseek-ai/dsh web
```

第一条命令把当前目录作为插件装进 web profile。第二条启动 Web GUI。等服务报告就绪，在浏览器打开 `http://127.0.0.1:3080`。

这一步可能出两个问题，都值得点名。如果安装命令抱怨缺 `dsh` 声明，那是清单错了，什么都没装。如果安装成功但 GUI 里没有任何你的插件的痕迹，检查 `DSH_HOME` 是否指向你想象的位置。`web` profile 从 `$DSH_HOME/profiles/web` 解析，如果你的 shell 和 GUI 进程看到不同的 `DSH_HOME`，插件装进一棵树，GUI 读另一棵树。这是整个工作流里最令人困惑的环境 bug，而且不是你的插件的错。做任何事之前先把 `DSH_HOME` 显式设好：

```bash
export DSH_HOME="$HOME/.dsh"
```

然后在同一个 shell 里跑安装和 GUI。如果你的 `~/.dsh` 不在预期位置，把 `DSH_HOME` 指向真实位置重来。规则很无聊但绝对：一个 `DSH_HOME` 值，一个 shell，一次运行。

## 你应该看到什么

GUI 起来之后，开一个会话，在输入框里敲 `/hello`。命令面板应该在你写的 description 下列出它。选中，响应显示你的问候。如果 `config.name` 从没设置过，它回落到 `my-first-plugin`，这证明默认值生效了。

另一个确认在日志里。在 CLI 侧跑插件列表，应该能看到你的插件被报告为激活：

```bash
dsh plugin --profile web list
```

输出显示你的插件名、版本、安装来源。本地安装的来源是你传入的路径，通常是解析成绝对路径的 `./`。如果列表里没有这一项，是清单或 patch 路径错了。

有个细微点值得理解：插件什么时候加载。Bundle 在 profile 启动时加载，不是在你敲回车的那一刻。如果 GUI 已经在跑，你这时候装插件，要重启 GUI 才会出现。经典症状是装完、看不到、以为插件坏了。它没坏。重启 `npx @deepseek-ai/dsh web` 再刷新浏览器，命令就出现了。这个重启要求几乎绊倒每个首次用户，我第一次也被绊过，所以把它算进你的工作流。

## 用更多能力扩展插件

hello 命令足够证明管道通了，但一个只会说 hello 的插件没用。让我展示同一个 `apply` 形态长成你可能真会留着的东西。加一个检查工作区的命令，给它一个配置项。

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

这个版本里有两个细节值得注意。第一个是 async action。读写文件要花时间，命令系统原生支持异步 action，所以返回 promise 没问题。第二个是 `node:fs/promises` 的动态 import。在 action 里惰性加载文件系统模块，让插件的启动路径保持快，这是个在插件长大后会有回报的习惯。

`note` 命令有 `args.text` 引用。命令参数来自解析器，插件可以声明一个命令接受哪些参数。参数形状超过一个字符串时，你定义 parameters，UI 会为它们渲染表单。现在只要记住这个模式存在：action 收到 `args`，`args` 装着用户在命令名后面输入的内容。

这条命令以你的用户权限运行。`appendFile` 写到当前工作目录指向的地方，这是真实的力量。命令插件没有沙箱，这正是本系列安全教程存在的原因。你自己的插件没问题。第三方插件，要审他们的命令写什么、写在哪。

## 理解 patch 的含义

`dsh.bundle.patch` 里的 `patch` 这个词值得拆开，因为它解释了插件如何组合的心智模型。一个 profile 是一叠 layer。每个已装插件用它的入口文件 patch 这叠东西。dsh 启动 profile 时，按顺序应用这些 layer，每个 layer 的 `apply` 运行并注册能力。

这个模型有后果。两个插件都能注册名为 `hello` 的命令，最后一个加载的占住名字，或者 harness 根据注册 API 拒绝重复。能力名是共享命名空间，所以你一装超过一个插件，唯一命名就变得重要。给命令名加插件名前缀，比如 `note` 改成 `ws-note`，保持无冲突。

patch 模型还意味着卸载是干净的。移除一个插件就移除它的 layer，它注册的一切随之消失。没有需要手工清理的孤儿状态，前提是你的插件不写自己职责之外的文件。上面的 `note` 命令写 `NOTES.md`，这不由 harness 管理，所以卸载插件后文件还在。那是你的数据，插件正确地不去删它。

## 配置你的插件

config 是 `apply` 的第二个参数，它值得单独一节，因为它是你的插件变得可复用的地方。用户安装你的插件时可以传一个配置对象。具体机制因安装来源略有不同，但形状总是一个 JSON 对象，最终作为 `config` 进你的 `apply`。

```bash
dsh plugin --profile web add ./ --config '{"name":"alice","volume":3}'
```

插件内部，`config` 就是这个对象，或者没传时是 `undefined`。让插件健壮的模式是一进 `apply` 立刻把 config 合并到一组默认值上：

```ts
export function apply(ctx, config) {
  const opts = { name: 'dsh', volume: 1, ...(config ?? {}) };
  ctx.log(`configured with name=${opts.name}`);
}
```

展开给你纯 JS 里近似带类型的回退，`?? {}` 防止 `config` 是 undefined。拿到 `opts` 之后，把值传进你的注册而不是硬编码。hello 命令已经这么用 `config.name` 了。好处是同一个插件文件能服务不同名字不同设置的许多用户，这正是让 config 成为一等参数的全部意义。

关于 config 有一条规则：别把密钥放进去。config 对象是磁盘上的一个文件，不是加密保险箱。你的插件需要 API key 时，从环境变量或本地凭据文件读，把 config 值当作非秘密的提示。这是我希望更多插件作者早点划下的线。

## 验证，然后对照 Hub

如果重启后什么都没发生，按顺序过检查清单。第一，确认 `dsh plugin --profile web list` 显示了你的插件。没有的话，是清单错了，修在 package.json。第二，确认 patch 路径和真实文件一致。第三，确认入口导出的是具名的 `apply`，不是 default 导出。dsh 找的就是具名导出，default 导出能干净编译但永远不会激活。

命令跑通后，闭环完成。你构建、安装、验证了一个 dsh 插件。下一步是看做得更多的插件。去本站 Top Rated 榜单，打开一个你欣赏的插件读代码。每一个都是你刚建的形态：导出 `apply(ctx, config)` 的模块。唯一区别是它们在 `ctx` 上注册了什么。渲染仪表盘的注册面板。查数据库的注册工具。发通知的注册钩子。同一个契约，不同的注册。

从这里长得最快的方式，是挑本系列一篇教程跟着做。MCP 教程展示怎么把一个现成 server 包成工具集。斜杠命令教程深入命令和参数。工具教程覆盖模型用来选择和调用你的工具的 JSON Schema 契约。每一篇都在你现在跑通的 `apply` 骨架上加一个新注册。

## 你的插件在 Web GUI 里出现在哪

新用户常问自己的插件在屏幕上哪里。诚实的回答是取决于插件注册了什么，而命令插件在你使用它之前基本不可见。要看的三个地方是命令面板、设置的插件列表、和日志。

开一个会话，输入 `/`。面板列出所有已注册命令。你的那条带着你写的 description 出现，这正是好 description 比看起来重要的原因。设置页有插件区，列出当前 profile 里激活的插件，带名字、版本、来源。日志是最不风光也最有用的。CLI 侧，插件激活行在启动时打印。如果你的 `ctx.log` 触发了，它的文本就在那。

这些表面没有一个是你插件的仪表盘。它们是可观测点。命令面板是用户找命令的地方。设置列表是确认安装的地方。日志是你排错的地方。按这个顺序学会检查三者，因为每个回答一个不同的问题：你的插件是不是活的。

## default 导出的陷阱

检查清单提过具名导出。这个陷阱值得单独一节，因为它制造了整个生态里最令人困惑的无操作。看这个文件：

```ts
export default function apply(ctx, config) {
  ctx.log('this never fires');
}
```

它能编译。能安装。插件出现在列表里。什么都没发生。dsh 找具名导出 `apply`，default 导出满足不了这个查找。打包器不抛错，因为 default 导出是合法的 JavaScript。你的插件被静默跳过。

修复是机械的。把 `export default` 改成 `export function apply`。如果你的编辑器从模板补全 `apply`，检查它用的是哪个 export 关键字。我在这个错误上浪费过一个下午，现在把写 export 关键字当成第一习惯。

相关的陷阱是导出改名函数：

```ts
function init(ctx, config) { ... }
export { init };  // 名字不对
```

harness 不会去扫描「长得像 apply 的函数」。它 import 确切的名字。改名就必须导出为 `apply`：

```ts
export function apply(ctx, config) { ... }
```

记住两句话。具名导出，确切名字 `apply`。文件里其他一切都是你的事。

## 一次真实的排错，从头到尾

让我走一遍一次真实失败，让检查清单有上下文。这是我第一次写插件时真遇到的顺序，是这个体验的经典版本。

我建了插件、安装、启动 GUI、敲 `/hello`。面板什么都没有。我第一个假设是插件没装上，于是跑 `dsh plugin --profile web list`。插件在，版本全在。这排除了安装步骤。

接下来查日志。`ctx.log` 的激活行缺失，这告诉我 `apply` 从没运行过。一个加载了但 `apply` 从不触发的插件，指向导出形态。我打开入口文件，发现是 `export default function apply`。就是上一节那个陷阱。我改成具名导出，重启 GUI，`/hello` 出现了。

第二次失败时，插件根本不在列表里。这缩小到清单。我打开 package.json，发现 `dsh` 块指向 `src/index.ts`，但文件建在了项目根目录。patch 路径和真实路径对不上。我移动文件，或者改清单，插件就列出自己了。

第三次失败是环境问题。插件在列表里，导出正确，日志触发了，GUI 还是什么都不显示。原因是安装的 shell 和启动 GUI 的 shell `DSH_HOME` 不一致。我在一个 shell 里显式导出 `DSH_HOME`，两条命令都在它下面跑，一切就出现了。

三次失败，三个原因，三个修法。没有一次是我插件逻辑的 bug。穿过任何一个的最快路径都一样：查列表、查日志、查导出、查路径。把这四项检查写在便签上，你就永远不会在装不上的插件上浪费一小时。

## 三种安装来源对比

到现在你只用了本地目录 `dsh plugin --profile web add ./`。这是三种来源之一，另外两种在你分享或使用插件时立刻变得重要。

npm 来源拉已发布包。spec 是包名，可选带版本：

```bash
dsh plugin --profile web add @scope/my-plugin
dsh plugin --profile web add @scope/my-plugin@1.2.3
```

GitHub 来源按 owner 和 repo 名拉仓库，仓库可以自带 bundle 而不用发 npm：

```bash
dsh plugin --profile web add github:owner/repo
dsh plugin --profile web add github:owner/repo#main
```

本地来源是你已经用的路径。它是你开发的方式，因为指向你正在编辑的代码，改完重跑 add 命令会重新应用 layer。

来源的选择改变插件如何更新。npm 安装重跑就能拉更新的已发布版本。GitHub 安装跟踪仓库，`#ref` 后缀固定分支、tag 或 commit。本地安装就是磁盘上现在的样子。你自己的开发循环，本地是唯一合理的选择。从 Hub 装的插件，GitHub 是常见默认，因为多数 dsh 插件以仓库形式分发。

## 锁版本与可复现安装

安装一个插件就是跑一个小的构建加加载步骤。对你要依赖的插件，你想要这步可复现，这意味着固定安装的东西。`github:owner/repo` 这种浮动安装在安装时抓取默认分支的最新。下一次安装，哪怕明天，可能拿到不同 commit。探索时没问题，工作流依赖的插件有风险。

来源支持时按 tag 或 commit 固定：

```bash
dsh plugin --profile web add github:owner/repo@v1.2.0
dsh plugin --profile web add github:owner/repo@a1b2c3d4e5f67890abcdef0123456789abcdef01
```

npm 包固定版本：

```bash
dsh plugin --profile web add @scope/my-plugin@1.2.3
```

可复现论证不止于版本号。插件在安装时跑构建步骤，等于你在信任仓库对你的机器做合理的事。固定 commit 意味着你信任那个具体快照，可以先审再装，装后审计。本系列安全教程对此深入得多，包括 Hub 的 Security Watch 如何跟踪最近更新的仓库作为早期预警。

## 更新与卸载

管理插件和安装插件一样重要。更新从同一来源拉新版本。确切命令跟着插件表面走，大致形状是：

```bash
dsh plugin --profile web update my-first-plugin
```

对从 GitHub 装的插件，更新重新解析来源，这正是固定付费的地方：固定的安装在你有意移动时才会更新。未固定的安装更新到分支头现在的样子，某天可能正是你要的，也可能不是。

卸载是安装的逆操作：

```bash
dsh plugin --profile web remove my-first-plugin
```

卸载把 layer 从 profile 栈里拿走。插件注册的一切随之消失。前面 `NOTES.md` 的例子是诚实的例外：插件写在 harness 之外的文件是你的，不会被删。如果你写了会存状态的插件，在 README 里明确写它存什么、存哪，让用户知道卸载后留下什么。

更新或卸载后，记住前面的重启规则。Profile layer 在 profile 启动时应用。重启 Web GUI 再刷新，再判断改动是否生效。

## 权限模型，用大白话讲

你的插件以你的用户权限运行，这句话值得完全理解。模型调用你注册的工具时，工具代码以启动 dsh 的用户身份运行。命令写文件时，以该用户的文件权限写。没有独立沙箱，没有隔离区，没有限制 token 的子进程。

这是特性，也是责任。是特性因为它让插件能做真事：读工作区、碰数据库、调用外部 CLI，全用你的正常权限。是责任因为权限恰好等于你 shell 的权限。你从 Hub 装的插件，是能做任何你能做的事的代码。

实际规则随之而来。任何插件在碰重要机器之前先审源码。锁版本，让事后审查匹配你实际运行的。优先选声明读写内容的插件。你自己造插件时，以同样的尊重对待它，因为你的用户会把同样的信任交给它。

## 多入口 bundle 与插件组合

`patch` 数组接受多个入口，更大的插件会用到。一个插件可能把入口拆成主文件加 UI 文件，或命令集加后台 worker。每个入口都加载，按数组顺序调用 `apply`。

```json
{
  "dsh": {
    "bundle": {
      "patch": ["src/index.ts", "src/ui.ts"]
    }
  }
}
```

组合的故事超越单个插件。一个 profile 是来自许多插件的 layer 叠成的栈，每个 patch 同一个 harness。这就是一个 dsh 安装能同时拥有 UI 皮肤、数据库工具、通知钩子，全部来自不同仓库、全部共存的原因。前面说的共享命名空间规则让栈保持有序：跨插件唯一能力名，插件内稳定名字。

插件变大就按 dsh 自己的方式拆。保留注册能力的入口，把重逻辑移进出入口 import 的模块。patch 数组是给独立的可加载 layer 的，不是给你项目里每个文件。一个 layer 一个入口，一个职责一个 layer。

## 命令还是工具：你该造哪个

hello 命令跑通后，自然的问题是何时造命令而不是工具。简短的回答是谁触发。命令在一个人输入或从面板选的时候触发。工具在模型决定某能力对当前任务有用时触发。

造命令，当应该由人决定。重命名文件、写笔记、跑报表，这些都是人驱动的动作。造工具，当应该由模型决定。为上下文读文件、任务中查数据库、调 API 解决问题，这些是模型驱动的动作。

注册形状相似，这正是重点。`ctx.commands.register` 和 `ctx.tools.register` 都收名字加选项对象。工具选项多一个 `parameters` JSON Schema 和一个 `execute` 函数，代替 `action`。理解了命令形状，工具形状只是一小步，本系列工具教程会详细走一遍。

## 心智模型，再说一遍

最后让我重述那一句话，现在带着它承载的分量。一切皆插件。插件是导出 `apply(ctx, config)` 的模块。清单里的 `dsh.bundle.patch` 让模块成为插件而不是死包。Profile 是插件住的地方，`$DSH_HOME/profiles/web` 是你装进去的那个。你收到的 `ctx` 是整个 harness，你在上面注册什么，你的插件就变成什么。把 hello 插件留一份在随手能找到的地方，因为它是测试你的 dsh 安装是否工作的最快方式，也是你以后写的每个更大插件的起点。
