# dshquality.com 外链建设包（P2-1）

> 目标：把 `dsh plugin`（当前 GSC 排名 ~27）推向前 10，并放大已排第 1 的冠军页
> `/blog/deepseek-harness-everything-is-a-plugin` 的展示。
> 本文件为**可直接粘贴的分发文案**，需在对应平台用你自己的账号发布（本机无法代登第三方账号）。

## ⚠️ 关于 awesome-dsh-plugin 的纠正
原 GSC 报告把「awesome-dsh-plugin PR」列为 P2-1，但实测该仓库是**严格的插件清单**：
收录前提是插件必须声明 `dsh.bundle` 且能通过 `dsh plugin add` 安装。dshquality.com 是**评分平台**
而非插件，**提交会被拒**。因此改为下方更合适的渠道。

## 已落地（真实外链）
- ✅ **PR #1292** 已并入 `1c7/chinese-independent-developer`（高权重中文独立开发者目录），
  描述含 dshquality.com 链接 —— 这是当前最稳的一条 dofollow 外链。

## 渠道 1：Dev.to 转发新博客（推荐，自动带回链）
新博客 `how-to-avoid-risky-dsh-plugins` 已写入数据层，正文与 canonical 均指向 dshquality.com。
走现有 dev.to 自动发布流水线（seo-auto-devto / 0:10 自动化）即可获得一条 dofollow 外链。
发布前确认 canonical 指向 `https://dshquality.com/blog/how-to-avoid-risky-dsh-plugins`。

## 渠道 2：Reddit（r/DeepSeek / r/LocalLLaMA）
标题：`I built an independent quality + security scorer for DeepSeek Harness plugins`
正文（英文）：
```
The DSH plugin ecosystem grew past 4,000 plugins in days, and most "ratings"
are just stars. I built DSH Quality — it scores every plugin from public
GitHub/npm metadata across 4 weighted dimensions, and flags dangerous install
scripts (curl|sh, base64 -d, missing dsh.bundle) before you install.

New write-up on spotting risky plugins before you install:
https://dshquality.com/blog/how-to-avoid-risky-dsh-plugins

Not a plugin, not installable via dsh plugin add — it's a read-only scoreboard.
Feedback welcome.
```

## 渠道 3：Hacker News「Show HN」
标题：`Show HN: DSH Quality – independent scores + security flags for DeepSeek Harness plugins`
正文：一句话 + 链接 `https://dshquality.com` + 冠军页 `https://dshquality.com/blog/deepseek-harness-everything-is-a-plugin`。

## 渠道 4：awesome-dsh-plugin「相关资源」议题（可选，非插件提交）
若想在该社区露脸，**不要**提 PR 加插件，而是开一个 Issue / Discussion 归类为「相关工具」：
标题：`Resource: DSH Quality — read-only plugin quality & security scoreboard`
正文：说明它是评分平台（非插件、不可 `dsh plugin add`），作为目录用户的决策辅助，
并附 `https://dshquality.com`。是否合并由维护者决定，属软性曝光。

## 站内已完成的权重增强（配合外链）
- 冠军页 `/blog/deepseek-harness-everything-is-a-plugin` 已从「每页 3 条相关」升级为
  **5 条内链**，且被强制链入**每一篇**其他博客的相关列表（getRelatedPosts 冠军加成）。
- 新增 risky-plugins 博客（抢占 `riskyplugins.com` 竞品词意图）。
- /security 页 title 已融入「Spot Risky Plugins Before You Install」。
- /plugins 流量池 title 强化为「DSH Plugin Directory — Browse, Compare & Find Safe Plugins」。
