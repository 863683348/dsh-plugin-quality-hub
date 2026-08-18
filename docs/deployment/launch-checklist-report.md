# DSH Plugin Quality Hub — 上线 10 项工作检查报告（v2 复查）

> 依据：`dafeixiang-saas-launch` skill → `references/mvp-build-order.md` 的 10 项上线清单
> v1 检查时间：2026-08-18 09:21 ｜ **v2 复查时间：2026-08-19 01:05 (GMT+8)**
> v2 检查对象：`app/` 最新代码（C:/worktmp 副本，含 v0.2–v0.4 + 5 底部页 + SEO 收尾）+ 线上 dshquality.com 实测

---

## 总览表（v2）

| # | 上线工作项 | v1 状态 | **v2 状态** | 关键证据 |
|---|-----------|--------|------------|---------|
| 1 | 需求 / UI / 技术框架设计 | ✅ | ✅ 完成 | Spec + 技术栈锁定（Next 14 + Prisma + Neon + next-intl + Vercel） |
| 2 | MVP 搭建（脚手架） | ✅ | ✅ 完成 | `app/` App Router + 30 页 + 10 API 路由，build 全过 |
| 3 | 中英文 i18n | ✅ | ✅ 完成 | en/zh 258+ key 双向对称 + legal 命名空间（5 底部页） |
| 4 | 亮黑 UI 设定 | ✅ | ✅ 完成 | tokens.css 亮/暗双套 + theme-provider（localStorage+matchMedia） |
| 5 | 谷歌登录 | ⏸ 不适用 | ⏸ 不适用 | 公开只读评分站；refresh 用 CRON_SECRET Bearer 即可 |
| 6 | 收付款对接 | ❌ 未开始 | ⏸ 预留 | 无支付代码；ads.json（adsEnabled:false）+ sponsor 文案已铺商业化地基 |
| 7 | GA4 + 热力监控 | 🟡 部分 | 🟡 部分（GA4 ✅ 已修） | GA4 生产加载判断已补；热力/事件埋点仍未做 |
| 8 | 移动端适配 | 🟡 部分 | ✅ 完成 | mobile-375-audit.md 通过（13 组件无溢出 + 线上实测） |
| 9 | 安全检测 | 🟡 部分 | 🟡 部分（大头✅ 已修） | 安全头含 HSTS ✅；npm audit 仍未跑 |
| 10 | SEO 操作 | 🟡 部分 | ✅ 完成 | sitemap.ts + robots.ts + JSON-LD + hreflang + canonical 全齐，线上生效 |

**v2 结论：10 项中 7 项完成，2 项不适用/预留，1 项部分完成（安全审计）。**

---

## v1 → v2 修复确认（自上次检查后完成的工作）

| 项 | v1 缺口 | v2 证据 |
|---|---------|---------|
| 7 GA4 | 所有环境加载（含 localhost/Preview 污染） | `analytics.tsx` 已加 `NODE_ENV==='production' && VERCEL_ENV!=='preview'` 判断 ✅ |
| 9 HSTS | 未配置 | `next.config.mjs` 已加 `Strict-Transport-Security: max-age=31536000; includeSubDomains` ✅ |
| 10 SEO | sitemap/robots/JSON-LD/hreflang 全缺 | `sitemap.ts`（静态页双语言+博客单篇）、`robots.ts`、根 layout JSON-LD（Organization+WebSite）、`alternates.languages` 全齐 ✅ |
| 8 移动端 | 375 全量核验未跑 | `mobile-375-audit.md`：13 组件静态走查无溢出 + 4 页线上实测 200 ✅ |
| 部署 | Vercel 不可访问（302 SSO） | **线上 dshquality.com 已 200 可访问**，首页等级分布/排名/JSON-LD/GA4 全部正常渲染 ✅ |

---

## 逐项明细（v2 最新）

### 7. GA4 + 热力监控 —— 🟡（GA4 完成，热力/埋点未做）
- ✅ `analytics.tsx`：`next/script` + afterInteractive + `anonymize_ip`，ID 环境变量优先（`NEXT_PUBLIC_GA_ID` > 默认 G-CW5VXQTCXH）
- ✅ 生产加载判断已补；CSP 已放行 `googletagmanager.com`
- ❌ 热力工具（Clarity/Hotjar）未接入（免费，5 分钟可做，P2）
- ❌ 关键事件埋点未做（外链点击/订阅提交，P2）

### 9. 安全检测 —— 🟡（安全头全，剩 npm audit）
- ✅ 安全头：`X-Content-Type-Options` / `X-Frame-Options` / `Referrer-Policy` / `Strict-Transport-Security` / `CSP`
- ✅ API 限流：`rate-limit.ts`（Upstash Redis，订阅 10/min/IP）
- ❌ `npm audit` 未跑（skill 要求无高危 + postcss 升 latest，勿 `--force`）——**唯一待办 P1**
- ⏸ Supabase RLS / magic-byte / webhook 验签：无 Supabase 不适用

### 6. 收付款 —— ⏸ 预留（非阻塞）
- `ads.json`：`adsEnabled: false`，home-top/plugins-side 两个 Sponsored 位 + home-promo Partner 位，i18n sponsor 文案 + method 页赞助政策说明已就位
- 何时启用：有广告主 / 想接捐赠时再开，建议 PayPal 或 Stripe

---

## 待办清单（更新版）

### P1（建议尽快，共 1 项）
1. **`npm audit`**：`cd app && npm audit`，无高危即过；postcss 单独 `npm i postcss@latest`，**勿 `npm audit fix --force`**

### P2（可选迭代，共 2 项）
2. 热力监控：Microsoft Clarity（免费）接入，看用户滚动/点击热区
3. 事件埋点：GA4 自定义事件（外链点击、weekly 订阅提交、搜索）

### 已闭环（v1 的 P0/P1 全部完成）
- ✅ Vercel 部署可访问（dshquality.com 200）
- ✅ Vercel 环境变量（真实 Neon 连接串 + secrets）
- ✅ GA4 生产加载
- ✅ SEO 收尾四件套
- ✅ 375px 移动端走查

---

*报告 v2：DSH 上线检查（dafeixiang-saas-launch skill 10 项对照，基于最新代码 + 线上实测）*
