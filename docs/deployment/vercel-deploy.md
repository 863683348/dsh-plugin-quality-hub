# Vercel 部署手册 - DSH Plugin Quality Hub

> 生成日期：2026-08-18
> 目标：将 `app/` Next.js 应用部署到 Vercel，绑定域名 dshquality.com

## 前置检查（已全部就绪 ✅）

| 项目 | 状态 | 验证方式 |
|------|------|----------|
| vercel CLI 58.10.0 | ✅ 全局已装 | `npm ls -g` 显示 vercel@58.10.0 |
| Vercel 登录 | ⚠️ 待登录 | `vercel whoami` → No credentials |
| git 身份 | ✅ 863683348 | `git config --global user.name` |
| SSH 443 通道 | ✅ | `ssh -T -p 443 git@ssh.github.com` → Hi 863683348 |
| vercel.json | ✅ | framework: nextjs + prisma generate 构建钩子 |
| .env.local | ✅ | DATABASE_URL/DIRECT_URL 含 connect_timeout=30 |
| .gitignore | ✅ | 已忽略 .env*.local / node_modules / .next |

## 部署步骤

### 1. Vercel 登录
```bash
vercel login
# 浏览器打开 https://vercel.com/cli/login 完成授权
```

### 2. 导入 GitHub 仓库（推荐）或 CLI 部署
**方案 A：Vercel Dashboard 导入（推荐）**
1. 打开 https://vercel.com/new
2. Import Git Repository → 选择 `863683348/dsh-plugin-quality-hub`
3. **关键：Root Directory 填 `app`**（Next.js 版在 app/ 子目录）
4. Framework Preset 自动识别为 Next.js
5. 配置环境变量（见第 3 步）后 Deploy

**方案 B：CLI 部署（从 app/ 目录）**
```bash
cd "C:/Users/l'x/WorkBuddy/2026-08-17-21-54-54/app"
vercel --prod
```

### 3. 环境变量配置（Vercel 项目设置 → Environment Variables）

| 变量名 | 值 | 说明 |
|--------|-----|------|
| DATABASE_URL | `postgresql://neondb_owner:...@ep-green-salad-ay0jfmy7-pooler...?sslmode=require&connect_timeout=30` | Neon pooler（含 connect_timeout!） |
| DIRECT_URL | `postgresql://neondb_owner:...@ep-green-salad-ay0jfmy7...?sslmode=require&connect_timeout=30` | Neon 直连（Prisma migrate 用） |
| GITHUB_TOKEN | `ghp_xxx` | GitHub API 只读 token（提升限流 60→5000/h） |
| KV_REST_API_URL | `https://xxx.upstash.io` | Vercel KV（未配置时内存 fallback，不阻塞） |
| KV_REST_API_TOKEN | `xxx` | Vercel KV token |
| NEXT_PUBLIC_SITE_URL | `https://dshquality.com` | 站点 URL |
| CRON_SECRET | `crn_dev_dsh_quality_hub_2026` | refresh API 鉴权密钥 |

### 4. 域名绑定
- Vercel 项目 → Settings → Domains → 添加 `dshquality.com`
- 按提示在域名注册商添加 DNS 记录：
  - A 记录：`76.76.21.21`（Vercel 推荐）
  - 或 CNAME：`cname.vercel-dns.com`

### 5. 部署后验证
```bash
curl https://dshquality.com/api/v1/rankings?limit=5   # 期望 200 + JSON
curl https://dshquality.com/                          # 期望 200 + HTML
curl -X POST https://dshquality.com/api/v1/refresh -H "x-cron-secret: crn_dev_dsh_quality_hub_2026"  # 期望 200 + {success}
```

### 6. 定时刷新（可选）
- 方案 A：Vercel Cron（pro 计划）→ vercel.json 添加 crons 配置
- 方案 B：GitHub Actions（免费）→ 仓库已有 `.github/workflows/refresh-data.yml`，每周一 08:00 UTC 触发

## 注意事项
1. **Root Directory 必须为 `app`**（仓库根目录是 GitHub Pages 静态版，Next.js 全栈版在 app/ 子目录）
2. **Neon 休眠唤醒**：免费层闲置后冷启动需 5-10s，连接串必须含 `connect_timeout=30`，否则 API 首请求 500
3. **Prisma 构建钩子**：vercel.json 已配置 `prisma generate && next build`，确保生产构建生成客户端
4. **数据初始化**：生产数据库已有 100 条种子数据（8/17 迁移+seed），无需重复
5. **首次 API 请求慢**：Neon 休眠唤醒 + 首请求冷启动，约 5-10s，后续秒回

## 回滚
- Vercel 控制台 → Deployments → 选择上一版 → Redeploy
- 或 `vercel rollback` 命令
