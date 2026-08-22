---
title: "DSH 插件安全与隐私最佳实践（2026）"
description: "插件就是代码——而代码可能泄露密钥、外传提示词或悄悄回连。基于 dshquality.com Security Watch 的 DSH 安全插件指南 + 安全检查清单。"
tags: [dsh, 安全, 隐私, 插件]
canonical: https://dshquality.com/zh/blog/security-dsh-plugins-2026
lang: zh
---

# DSH 插件安全与隐私最佳实践（2026）

安装插件就是安装代码。在一个**每天新增几十个插件**的生态里，这些代码往往出自陌生人之手。本文覆盖 **DeepSeek Harness 生态中最安全的插件**、如何识别高风险插件，以及 dshquality.com **Security Watch** 运行的安全检查。

## 为什么插件安全比你想象的更重要

- **插件持有你 harness 的凭据**——恶意插件能读取你的提示词、API 密钥和本地文件
- **供应链风险真实存在**——6000+ 仓库，几乎没有治理，没有自动化审查
- **提示词泄漏是隐形的**——你的提示词就是你的知识产权；"回连"的插件会悄无声息地外传

## 最安全的安全类插件（A 级，已审查）

### 🔐 密钥管理
1. **agent-ecosystem/secret-transpiler-22** — *91/100 (A)*。运行时转译密钥引用，而不是在配置里存明文——把密钥挡在文件和日志之外的核心构件。
2. **agent-ecosystem/log-exporter-13** — *89/100 (A)*。受控、可选的日志导出，结构化输出——远比"自动上传一切"的插件安全。

### 🧪 安全测试与 QA
3. **vostride/agent-qa** — *90/100 (A)*。用自然语言写测试，得到自动化 QA harness——抓回归的纪律同样能抓住插件更新后的意外行为变化。
4. **devflow/schema-validator** — *91/100 (A)*。校验工具链输入的数据——在边界做 schema 强制是廉价的注入防护层。

### 👁️ 上下文与隐私可见性
5. **bowenliang123/dsh-context** — *90/100 (A)*。上下文仪表盘意味着你能*看到* agent 持有什么——在外发之前先审计。
6. **deepseek-harness/analytics** — *93/100 (A)*。官方组织出品的本地优先会话分析——不靠第三方遥测也能掌握用量。

## dshquality.com 如何筛查插件（Security Watch）

库中每个插件都用透明模型打分，发现以下情况即打标：

| 标记 | 含义 |
|------|------|
| `no_license` | 无许可证——法律灰色地带，不要依赖 |
| `no_description` | 无 README/描述——无法评估 |
| `suspicious_network` | 超出预期 API 用量的网络调用 |
| `stale` | 90+ 天无提交——无人维护的风险 |
| `minified` | 混淆代码——无法审计 |

安全公告以 **CVE 风格**发布（如 `DSH-SA-2026-001`），见 [Security Watch 页面](https://dshquality.com/security)。

## 安装任何 DSH 插件前的安全检查清单

1. **查分数与标记**——D 级或带标记的插件直接排除
2. **读代码**——花 30 分钟读代码，胜过 3 个月后悔
3. **优先官方组织仓库**（`deepseek-harness/*`）做核心工作流
4. **锁定版本**——不要自动更新你依赖的密钥相关插件
5. **审计网络访问**——本地操作不应该需要回连
6. **保留备份**——`deepseek-harness/backup-tool` 是生态最高分插件，自有道理

## FAQ

**A 级插件能完全信任吗？** A 级意味着透明、文档齐全、活跃维护，不意味着"安全专家审计过"——代码仍是开源的，重要部分自己读。

**如何举报恶意插件？** 使用 dshquality.com 的联系表单——Security Watch 会跟踪并发布公告。

**官方插件有加分吗？** 评分模型不给组织加分——官方插件分高是因为文档和维护确实更好。
