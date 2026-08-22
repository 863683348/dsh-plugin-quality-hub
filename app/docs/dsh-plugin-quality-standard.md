# DSH 插件质量规范（DSH Plugin Quality Standard）

> 本文档定义「什么是好的 DSH 插件」，是 [DSH Plugin Quality Hub](https://dshquality.com) 评分模型的
> 人类可读版本。所有评分维度、权重、红线都与线上引擎一致。插件作者可据此自查，生态贡献者可据此
> 判断一个插件是否值得信任。
>
> 适用范围：所有打 `dsh-plugin` topic 的 GitHub 仓库 + 发布到 npm 的 DSH 插件。

---

## 1. 为什么需要这份标准

DeepSeek Harness 于 2026-08-13 开源，几天内 `dsh-plugin` topic 仓库突破 **6000+**，但社区插件
**质量参差不齐、零治理**。本规范的目标：

- 给作者一份**可执行的自检清单**（发布前对照打分）
- 给使用者一个**可信的信号层**（质量分 / 安全红旗）
- 给生态一个**统一的话语**（我们用同一套维度评价所有插件）

评分引擎完全公开、可解释（见 `src/lib/scoring.ts`）。分数不是黑盒。

---

## 2. 评分维度与权重

| 维度 | 权重 | 满分 | 衡量什么 |
|------|------|------|----------|
| **Maintenance** 维护 | 28% | 30 | 更新活跃度、issue  backlog、是否归档、有无 CI |
| **Docs** 文档 | 28% | 25 | README 长度、是否含 LICENSE |
| **npm** 包分发 | 24% | 30 | 是否发布到 npm、周下载量、发布新鲜度、危险安装脚本 |
| **Ecosystem** 生态 | 20% | 15 | stars 对数分、是否发布 npm、是否声明 `dsh.bundle` |

加权总分 0–100，等级：**A ≥ 80 / B ≥ 60 / C ≥ 40 / D < 40**。
出现 **danger 安全红旗**时，等级强制封顶 D。

---

## 3. 各维度「好实践」清单

### 3.1 Maintenance（28%）— 项目在「活着」
- ✅ 最近 90 天内有 push（>180 天 −7，>365 天 −10）
- ✅ 未归档（`archived` 仓库 −8，且视为不再维护）
- ✅ 配置 CI（`.github/workflows` 存在 +1，证明有工程纪律）
- ✅ open issues 可控（>20 −2，>50 −3）
- ⚠️ 避免长期 0 更新后突然大改（评测管道基于快照变化触发重评，突变会重算）

### 3.2 Docs（28%）— 别人能「用起来」
- ✅ README ≥ 500 字符（<200 −8，<50 −15）
- ✅ 含 LICENSE 文件（缺失 −5）
- ✅ README 写明：做什么、怎么装（`帮我安装 https://github.com/...`）、怎么配置、权限要求
- ⚠️ 双语 README（en + zh）在出海生态中显著加分（生态以中文社区为主）

### 3.3 npm（24%）— 能「一键装」
- ✅ 发布到 npm（`dsh install <pkg>` 可消费）
- ✅ 周下载量越高越好（<100 −10，≥1000 满分基线）
- ✅ 最近 6 个月内发布过新版（>180 天 −4，>365 天 −8）
- ❌ **禁止危险安装脚本**：`curl ... | sh`、`/dev/tcp/`、`iex`、`base64 -d`、
  `powershell -enc` 等（命中直接 danger 红旗，等级封顶 D）

### 3.4 Ecosystem（20%）— 在「生态里」
- ✅ stars 越多越好（对数分，10★→+1.7，100★→+3.4，1000★→+5.1，上限 +7）
- ✅ 发布到 npm（+4）
- ✅ 声明 `dsh.bundle`（根目录 `dsh.bundle` / `dsh.bundle.json` / `dsh.bundle.yaml`，+4）
- 说明：`dsh.bundle` 是插件接口兼容性的声明文件，缺失会被打 warning 红旗

---

## 4. 安全红线（Flag 体系）

| 级别 | 触发条件 | 后果 |
|------|----------|------|
| 🔴 **danger** | 检测到危险安装脚本模式 | 等级强制封顶 D，发布 CVE 风格安全公告（`DSH-SA-YYYY-NNN`） |
| 🟡 **warning** | 缺失 `dsh.bundle` 声明 | 提示兼容性未确认 |
| 🔵 **info** | 仓库已归档 | 提示只读、不再维护 |

> 作者自查：`dsh-plugin-lint`（见 §6）可在发布前本地跑一遍，提前发现 danger/warning。

---

## 5. 发布前自检清单

- [ ] README ≥ 500 字，含安装 + 配置 + 权限说明
- [ ] 仓库根目录有 LICENSE
- [ ] 有 `.github/workflows`（哪怕只有 lint）
- [ ] 根目录有 `dsh.bundle` 声明
- [ ] 发布到了 npm（或明确声明「仅 GitHub 安装」）
- [ ] **没有** `curl|sh` / `iex` / `base64 -d` 类安装脚本
- [ ] 90 天内有 commit
- [ ] 跑过 `dsh-plugin-lint`，无 danger/warning

---

## 6. 如何获取你的质量分

### 方式一：徽章（README 展示）
```markdown
![DSH Quality](https://dshquality.com/api/v1/badge/owner/repo)
```

### 方式二：评估 API（自助，只读）
```bash
curl "https://dshquality.com/api/v1/evaluate?repo=owner/repo"
# 或 POST
curl -X POST https://dshquality.com/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{"repo":"owner/repo"}'
```
返回 `{ score, grade, dimensions, flags, details, badgeUrl }`。
已收录插件秒回缓存分；未收录插件实时抓取 GitHub + npm 计算（不落库）。

### 方式三：本地 lint（发布前）
```bash
npx dsh-plugin-lint ./my-plugin
```

---

## 7. 版本

- v1.0 — 对齐评分引擎权重（maintenance 28 / docs 28 / npm 24 / ecosystem 20），2026-08-18 校准。
- 本规范与 `https://dshquality.com/method` 页面、API `/api/v1/evaluate` 同源。
