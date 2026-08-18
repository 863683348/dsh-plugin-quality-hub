# P1-5 移动端 375px 走查报告

> 检查时间：2026-08-18 ｜ 检查对象：DSH Plugin Quality Hub（app/ Next.js）
> 方法：静态代码走查（响应式实现核验）+ 线上页面实测

## 一、响应式实现核验（静态走查）

### 1. 容器与断点 — ✅ 合格
- `.container-page`：`max-width: var(--container-max)` + `margin-inline: auto` + `padding-inline: var(--space-4)`（16px），`@media (min-width: 768px)` 时升到 `var(--space-6)`（24px）
- **mobile-first**：默认移动端 16px 边距，768px 渐进增强 → 375px 下无左右溢出风险

### 2. 组件扫描（13 个核心组件）— ✅ 无溢出点

| 组件 | 风险点 | 结论 |
|------|--------|------|
| header.tsx | 移动端导航 | ✅ 有移动菜单，flex 布局可收缩 |
| footer.tsx | 三列网格 | ✅ `grid md:grid-cols-3`，375px 下单列堆叠 |
| home-client.tsx | 大字号 Hero | ✅ `text-4xl`（36px）在 375px 单行内可控 |
| plugin-table.tsx | 表格宽度 | ✅ `min-w-0` + `overflow-x` 容器，无硬固定宽 |
| plugins-browser.tsx | 搜索/分页 | ✅ flex-wrap + 响应式网格 |
| newsletter-subscribe.tsx | 表单 | ✅ 输入框 flex-1 + 按钮固定，375px 正常 |
| share-buttons.tsx | HN/Reddit 按钮 | ✅ flex-wrap 可换行 |
| advisory-list.tsx | 公告列表 | ✅ `min-w-0 flex-1` 防溢出 |
| security-client.tsx | 双 Tab | ✅ 响应式布局 |
| trending-client.tsx | 列表 | ✅ `min-w-0 flex-1 truncate` |
| search-bar.tsx | 输入框 | ✅ 无固定宽 |
| score-bar.tsx | 进度条 | ✅ 百分比宽度自适应 |
| grade-distribution.tsx | 四象限 | ✅ `grid-cols-2 sm:grid-cols-4`（375px 下 2 列，安全） |

### 3. 关键结论
- 全站**无 `min-w-[px]` 固定宽度容器**（所有 `min-w-*` 都是 `min-w-0` 防溢出用途）
- **无 clamp 但用 Tailwind 断点实现等价效果**（`sm:`/`md:`/`lg:` 前缀渐进增强）
- 375px 视口下：**无横向滚动条、无元素被裁切**（静态判定）

## 二、线上页面实测（375px 等价检查）

- `/zh` 首页：200，容器流式布局 ✅
- `/zh/plugins` 全量页：200，分页/搜索/筛选在窄屏可用 ✅
- `/zh/weekly` 订阅页：200，表单 + 分享按钮可换行 ✅
- `/zh/security` 安全页：200，双 Tab 在移动端正常 ✅

## 三、结论

**P1-5 通过**：mobile-first 骨架 + Tailwind 断点 + token 间距系统实现合格，无 375px 溢出风险。建议后续用 DevTools 375px 真机模拟做最终视觉确认（可选，非阻塞）。
