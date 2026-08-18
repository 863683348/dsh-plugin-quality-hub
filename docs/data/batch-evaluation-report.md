# DSH 插件批量评测报告 — Batch 2 + 真实 GitHub 数据

> 生成时间：2026-08-18 13:05
> 评测引擎：`app/src/lib/scoring.ts`（四维加权：维护 30% + 文档 25% + npm 30% + 生态 15%）
> 数据库：Neon PostgreSQL（生产）

## 一、本次评测概况

| 来源 | 数量 | 说明 |
|------|------|------|
| Batch 2（本地构造） | 24 | 6 个组织 × 24 个新插件名，覆盖 6 owner 分布 |
| 真实 GitHub（dsh-plugin topic） | 7 | refresh 管道自动抓取评测 |
| **合计新增** | **31** | 数据库 100 → **131** 个插件 |

## 二、全库等级分布（131 个）

| 等级 | 数量 | 占比 |
|------|------|------|
| A（≥80） | 22 | 16.8% |
| B（60-79） | 45 | 34.4% |
| C（40-59） | 31 | 23.7% |
| D（<40 或危险脚本） | 33 | 25.2% |

## 三、安全检测结果（9 个 danger 标记）

| 插件 | 分数 | 等级 | 危险模式 |
|------|------|------|----------|
| ZSeven-W/openpencil（真实） | 72 | **D** | curl\|sh 安装脚本 |
| strukto-ai/mirage（真实） | 88 | **D** | curl\|sh 安装脚本 |
| 其余 7 个（seed） | - | D | 种子数据危险标记 |

> 验证：`openpencil`（72 分）和 `mirage`（88 分）即使分数高，因检测到危险安装脚本被强制压到 D 级 ✅ 符合 Spec AC-06。

## 四、真实 GitHub 插件明细（7 个）

| 插件 | 分数 | 等级 | Stars | npm | flags |
|------|------|------|-------|-----|-------|
| crafter-station/petdex | 93 | A | 3,880 | petdex ✅ | warning |
| Q00/ouroboros | 84 | A | 5,517 | ouroboros ✅ | warning |
| strukto-ai/mirage | 88 | **D** | 3,502 | mirage ✅ | **danger** + warning |
| ZSeven-W/openpencil | 72 | **D** | 5,269 | 无 | **danger** + warning |
| zhu1090093659/dsh-web-ui | 71 | B | 4,246 | 无 | warning |
| xiaobright/dsh-anchored-standard | 71 | B | 3,465 | 无 | warning |
| Devin-AXIS/iPolloWork | 70 | B | 4,130 | 无 | warning |

## 五、Batch 2 插件明细（24 个，Top 10）

| 插件 | 分数 | 等级 | Stars |
|------|------|------|-------|
| plugin-stack/context-compressor | 97 | A | 2,588 |
| plugin-stack/markdown-lint | 93 | A | 2,945 |
| devflow/schema-validator | 92 | A | 3,326 |
| ai-toolkit/model-router | 90 | A | 2,744 |
| ai-toolkit/shell-completer | 87 | A | 204 |
| opensource-ai/log-viewer | 85 | A | 230 |
| dsh-hub/metrics-dashboard | 82 | A | 408 |
| opensource-ai/grpc-client | 82 | A | 316 |
| dsh-hub/webrtc-helper | 81 | A | 865 |
| ai-toolkit/etl-pipeline | 80 | A | 690 |

## 六、技术说明

1. **Neon 库**：未直接使用 `@neondatabase/serverless`，走 Prisma 标准 PostgreSQL 协议 + `connect_timeout=30`（应对冷启动）。方案验证可用，无需切换。
2. **Batch 2 数据**：确定性 RNG 构造（seed=20260818），非真实仓库，仅用于评测引擎验证。
3. **真实数据**：来自 GitHub API `topic:dsh-plugin` 搜索，匿名限额 60 req/h 已用尽（剩余 8），下次评测建议配 `GITHUB_TOKEN`。
4. **脚本**：`app/scripts/batch-evaluate.mts`（批量评测）、`app/scripts/db-status.cjs`（状态检查）可复用。

## 七、遗留问题

- refresh_logs 中有一条 `running` 状态记录未关闭（进程被杀导致），数据已写入但状态未更新
- GitHub 匿名限额低，真实评测需要 `GITHUB_TOKEN`（建议在 Vercel 环境变量中配置）
