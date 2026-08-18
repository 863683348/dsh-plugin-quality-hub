# DSH Plugin Quality Hub — 上线 10 项工作检查报告

> 依据：`dafeixiang-saas-launch` skill → `references/mvp-build-order.md` 的 10 项上线清单
> 检查时间：2026-08-18 09:21 (GMT+8)｜ 检查对象：`app/` Next.js 全栈版（Vercel 部署）
> 仓库 HEAD：`546d8d9`（GA4）+ `b6c7ab0`（v0.2–v0.4）已推送 main

---

## 总览表

| # | 上线工作项 | 状态 | 完成度 | 关键证据 |
|---|-----------|------|--------|---------|
| 1 | 需求 / UI / 技术框架设计 | ✅ 完成 | 100% | Spec + 技术栈锁定（Next.js 14 + Prisma + Neon + next-intl + Vercel），文档在 `.workbuddy/memory` 与 `docs/deployment/vercel-deploy.md` |
| 2 | MVP 搭建（脚手架） | ✅ 完成 | 100% | `app/` App Router + `layout.tsx` + 组件分层（components/lib/services/types），dev/build/tsc 全通过 |
| 3 | 中英文 i18n | ✅ 完成 | 100% | `src/i18n/locales/en.ts` + `zh.ts`，`useTranslations()` 全站接入，`<html lang>` 随 locale |
| 4 | 亮黑 UI 设定 | ✅ 完成 | 100% | `src/styles/tokens.css` 亮/暗 Token + `theme-provider.tsx`（localStorage 持久化 + matchMedia 初始值） |
| 5 | 谷歌登录 | ⏸ 不适用 | N/A | 产品无登录需求（公开评分站）；skill 中该项为 Supabase Auth 前提，本项目未采用 Supabase |
| 6 | 收付款对接 | ❌ 未开始 | 0% | 无 PayPal / 支付代码；`ads.json` 商业化配置已就位（`adsEnabled: false`），属 v0.4 预留 |
| 7 | GA4 + 热力监控 | 🟡 部分 | 70% | GA4 ✅（`analytics.tsx` afterInteractive + `anonymize_ip`，提交 546d8d9）；热力 ❌（无 Clarity/Hotjar）；事件埋点 ❌（无自定义事件） |
| 8 | 移动端适配 | 🟡 部分 | 70% | mobile-first 骨架 ✅（flex/grid + clamp，375px 断点约定）；375px 全量核验 ❌（未跑设备模拟走查） |
| 9 | 安全检测 | 🟡 部分 | 60% | 安全头 ✅（CSP/X-Frame/X-Content-Type/Referrer）；npm audit ❌（未跑）；RLS/storage/magic-byte ❌（无 Supabase 不适用） |
| 10 | SEO 操作 | 🟡 部分 | 60% | metadata 每页 ✅；sitemap.xml ❌、robots.txt ❌、JSON-LD ❌、hreflang ❌ |

**结论：10 项中 4 项完成，1 项不适用，5 项未完成/部分完成。**

---

## 逐项明细

### 1. 需求 / UI / 技术框架设计 —— ✅ 完成

- 用户画像与场景：DSH 插件生态独立评分平台（Top Rated / Trending / Security Watch / Weekly）。
- 技术栈锁定：Next.js 14.2.5（App Router）+ Prisma 5.22 + Neon PostgreSQL + next-intl 4 + Vercel 部署。
- 三文档：PRD v0.1、架构选型、UIUX 设计语言均已产出并确认（记录于项目 memory）。
- 部署文档：`docs/deployment/vercel-deploy.md`（含 Root Directory=app 修复记录）。

### 2. MVP 搭建（脚手架） —— ✅ 完成

- 路由骨架：`src/app/[locale]/` 下 8 页（首页/plugins/plugin详情/trending/security/weekly/about/method）+ 8 个 API v1 路由。
- 分层：`components/`（24 组件）、`lib/`（api/api-response/cache/errors/scoring/rate-limit 等）、`services/`（newsletter/advisory）、`config/`、`types/`。
- 自检验证链：`tsc --noEmit` 0 错误；`next build` 18 页成功；`tests/scoring.test.ts` 单测存在。
- 登录/支付预留位：`ads.json` 广告/推荐位配置、header/footer 用户态区域预留。

### 3. 中英文 i18n —— ✅ 完成

- `src/i18n/locales/zh.ts` + `en.ts`，key 命名 `namespace.key` 规范。
- 全站文案走 `useTranslations` / `getTranslations`，未见 tsx 硬编码中文字面量。
- `middleware.ts` 用 next-intl 中间件处理 locale 重定向（`/en/*` 307 → 规范化）。
- 缺失 key 由 next-intl 默认兜底回退 key 名，不白屏。

### 4. 亮黑 UI 设定 —— ✅ 完成

- `src/styles/tokens.css`：`--color-primary/bg/surface/surface-2/text/muted/border/meta/success/warning/danger` 亮暗双套 Token。
- `theme-provider.tsx`：`localStorage('dsh-theme')` 持久化 + `prefers-color-scheme` 初始检测 + `data-theme` 属性切换。
- 组件颜色全部引用 Token（`text-[var(--color-text)]` 等），无裸色值。
- 图标用 lucide-react，无 emoji 图标。

### 5. 谷歌登录 —— ⏸ 不适用

- skill 假设 Supabase 栈；本项目为公开只读评分站，无用户账户/鉴权需求，**无登录功能**。
- 相关：`/api/v1/refresh` 用 `CRON_SECRET` Bearer 简单鉴权（非 OAuth），已满足当前需求。

### 6. 收付款对接 —— ❌ 未开始

- 无 PayPal / Stripe / Creem 任何支付代码、无 `PLAN_PRICES`、无订单映射表。
- 商业化已铺地基：v0.4 `ads.json`（`adsEnabled: false`，Sponsored/Partner 位 + i18n sponsor 文案 + `method-content.tsx` 赞助政策说明）。
- **下一步**：若要做捐赠/赞助收款，建议接 PayPal（海外受众）或 Stripe，作为独立迭代。

### 7. GA4 + 热力监控 —— 🟡 部分（GA4 完成，热力/埋点未做）

已完成：
- `src/components/analytics.tsx`：`next/script` + `afterInteractive` 策略，`gtag('config', 'G-CW5VXQTCXH', { anonymize_ip: true })`。
- ID 优先级：`NEXT_PUBLIC_GA_ID` 环境变量 > 默认 `G-CW5VXQTCXH`。
- `layout.tsx` 注入 `<head>`；`next.config.mjs` CSP 已放行 `googletagmanager.com`。
- `.env.example` 含 `NEXT_PUBLIC_GA_ID`（占位符）。

未完成：
- 热力工具（Microsoft Clarity / Hotjar）未接入。
- 关键事件埋点（注册/生成/支付等漏斗）未做（站点无登录/支付，事件面较窄，可只埋下载/外链点击/订阅提交）。

> ⚠️ **注意**：skill 要求仅生产加载（`isProd && !preview`），当前实现为**所有环境加载**（含 localhost/Preview）。建议补环境判断，避免开发流量污染 GA4。

### 8. 移动端适配 —— 🟡 部分

已完成：
- mobile-first：`flex/grid` + `clamp()` 布局，无固定宽度容器，`container-page` 响应式。

未完成（验收标准未跑）：
- 375px（iPhone SE）无横向滚动条/无裁切的全量走查未执行。
- 触控目标 ≥44×44px 未系统核对。
- 导航在移动端为折叠/堆叠，未用抽屉/底部栏（可用性一般，非阻塞）。

### 9. 安全检测 —— 🟡 部分

已完成：
- `next.config.mjs` 安全头：`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin`、`CSP`（default-src 'self' + GA4 放行）。
- API 限流：`rate-limit.ts`（Upstash Redis），订阅接口 10/min/IP。

未完成 / 不适用：
- `npm audit` 未跑（skill 要求无高危 + postcss 单独升 latest，勿 `--force`）。
- HSTS 头未配置（`Strict-Transport-Security`）——Vercel 平台本身在 HTTPS 下可加，建议补。
- Supabase RLS / storage policy / magic-byte：无 Supabase 不适用。
- 无登录/支付，验签类（PayPal webhook 验签等）不适用。

### 10. SEO 操作 —— 🟡 部分

已完成：
- 每页 `generateMetadata`（title/description），`<html lang>` 正确。
- 语义化 HTML：header/main/footer/article 结构，h1–h6 层级，图片 alt。

未完成（验收标准缺 3/4）：
- `sitemap.xml` ❌（`src/app` 下无 sitemap 文件，`public/` 为空）。
- `robots.txt` ❌（无）。
- JSON-LD 结构化数据 ❌（无 Organization/SoftwareApplication 注入）。
- hreflang ❌（`alternates.languages` 未配，多语言页无互指）。

---

## 部署状态 ⚠️ 重点

| 项 | 状态 |
|---|---|
| 代码推送 | ✅ `546d8d9`（GA4）+ `b6c7ab0`（v0.2–v0.4）已推 main，`git ls-remote` 确认一致 |
| 本地构建 | ✅ `next build` 18 页成功，tsc 0 错误，API/页面冒烟通过 |
| Vercel 线上 | ⚠️ **不可访问**：`https://app-d3nxyyow8-dafeixiang.vercel.app/zh` 302 → Vercel 登录页（SSO 保护或部署暂停/域名未验证）。**v0.2–v0.4 + GA4 尚未对线上生效** |
| GitHub Pages（静态版） | ✅ 正常：`https://863683348.github.io/dsh-plugin-quality-hub/` 200，标题正常 |
| Vercel 环境变量 | ⚠️ 需在 Vercel 控制台补充：`DATABASE_URL`、`DIRECT_URL`、`GITHUB_TOKEN`、`KV_REST_API_URL`、`KV_REST_API_TOKEN`、`NEXT_PUBLIC_SITE_URL`、`NEXT_PUBLIC_GA_ID`、`CRON_SECRET`、`BUTTONDOWN_API_KEY`（缺任一可能导致线上 DB/GA 不可用） |
| .env.local | ⚠️ 仅存在于工作区 `C:\Users\l'x\WorkBuddy\2026-08-17-21-54-54\app\.env.local`（已 gitignore）；`C:\worktmp\dsh-plugin-quality-hub\app\.env.local` 不存在，Vercel 构建依赖控制台环境变量 |

---

## 待办清单（按优先级）

### P0（部署阻塞）
1. **排查 Vercel 部署不可访问**：登录 Vercel 控制台 → 确认 `app-d3nxyyow8-dafeixiang` 项目部署状态、SSO/认证保护是否误开、域名是否需验证。
2. **补齐 Vercel 环境变量**（9 个，见上表），然后重新部署（Root Directory=app）。
3. 部署后验证：`/zh` 与 `/zh/weekly` 200、页面含 `gtag/js` + `G-CW5VXQTCXH`、CSP 头生效。

### P1（上线前建议）
4. GA4 仅生产加载：`analytics.tsx` 加 `NODE_ENV === 'production' && VERCEL_ENV !== 'preview'` 判断。
5. 热力工具接入：Microsoft Clarity（免费，5 分钟）或 Hotjar。
6. SEO 收尾：`sitemap.ts` + `robots.ts`（Next.js App Router 原生支持）+ 首页/插件页 JSON-LD + `alternates.languages` hreflang。
7. `npm audit` 扫描 + postcss 升 latest（勿 `--force`）；补 HSTS 头。
8. 375px 移动端全量走查（DevTools 设备模拟，跑通首页/列表/详情/订阅/分享）。

### P2（后续迭代）
9. 收付款：决定是否接 PayPal/Stripe（当前广告位 `adsEnabled: false` 未启用，属预留）。
10. 谷歌登录：若未来加"收藏插件/订阅管理"账户体系再引入（当前不适用）。

---

*报告生成：DSH 上线检查（dafeixiang-saas-launch skill 10 项对照）*
