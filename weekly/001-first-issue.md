# DSH Weekly #001 — The backdoor that wasn't in the docs

> Date: 2026-08-17 · By the DSH Plugin Quality Hub
> A short, opinionated digest of the DeepSeek Harness plugin ecosystem.

## 1. Security: the first real backdoor found in the wild

A developer reviewing a "memory" plugin before installing it found code that **reads local credentials, steals environment variables, and ships them to an external server** — with zero mention in the docs. Installing a plugin means granting third-party code full access to your file system, env vars, and network.

**The takeaway:** never install a DSH plugin you haven't vetted. The three cheapest checks:
1. Does the npm package (or repo) declare `dsh.bundle` in package.json? (That's the "official plugin" badge — installable via `dsh plugin add`.)
2. Is there a `cordis.patch.yml`? (The plugin's wiring diagram.)
3. Are there install scripts (`install`/`postinstall`)? Watch for `curl|sh`, `/dev/tcp`, `base64 -d`, `Invoke-Expression`, `powershell -enc` — those are red flags.

Related discussion: [third-party security audit of the plugin model](https://github.com/deepseek-ai/deepseek-harness/discussions/454), [sandbox escape + unauthenticated RPC reports](https://github.com/deepseek-ai/deepseek-harness/discussions/451).

## 2. The topic passed 5,000 repos — and tag farming is real

Three days after launch the `dsh-plugin` topic had **4,300+ repos** (peak growth **99/hour**), and now passes 5,000. But the numbers are noisy:
- **0-1 star repos are the majority**; only ~2% pass 100 stars.
- Old, unrelated projects keep getting tagged `dsh-plugin` for the traffic.
- In our top-100-by-stars sample, **26 of 78 npm-published packages don't declare `dsh.bundle`** — likely not installable as plugins at all.

The "which plugins are worth installing?" question has no good answer yet — that's exactly why we built this hub.

## 3. Plugins worth a look this week

| Plugin | Stars | Grade | Why |
|---|---|---|---|
| [dsh-vision-router](https://github.com/ysr666/dsh-vision-router) | 592 | A | Vision model routing for DSH |
| [dsh-browser](https://github.com/Lum1104/dsh-browser) | 242 | A | Headed browser capability (SSRF-safe navigation, a11y clicking) |
| [dsh-context](https://github.com/bowenliang123/dsh-context) | 179 | A | Context management |
| [dsh-ads](https://github.com/Nagi-ovo/dsh-ads) | 479 | A* | DSH as a 2005 portal — parody ads and popups (fun; *no dsh.bundle, GitHub-only) |
| [open-design](https://open-design.ai/zh/agents/deepseek-harness-design/) | 87k | — | The design-generation giant, with its own DSH plugin family |

## 4. What we shipped

- **[dsh-audit](https://github.com/863683348/dsh-plugin-audit)** (npm `dsh-audit`) — v0.4: full-topic scoring (0-100, A-D), static security scan with grade veto, and genuine-plugin verification (tag-farming filter caps score at C).
- **[dsh-plugin-gate](https://github.com/863683348/dsh-plugin-gate)** — the installation safety gate & data-protection guard: **60 static signature rules** (31 high / 24 medium / 5 low) scan plugin sources for malicious install scripts, credential theft, persistence and network callbacks before `dsh plugin add`, plus **12 destructive-command patterns** (`rm -rf /`, `rmdir /s /q`, `format`, `dd`, `mkfs`) plus workspace-boundary checks — the "anti-accidental-deletion" guard that would have stopped the 400 GB wipe reported this week.
- **[dsh-plugin-verify](https://github.com/863683348/dsh-plugin-verify)** — evidence-based verification toolkit for agents.
- This hub — rankings refresh weekly from live data.

## 5. Numbers of the week

- DSH repo stars: ~113k (42h to 100k — fastest in GitHub history)
- Plugins tagged `dsh-plugin`: 5,000+
- Top-100 sample: 5×A · 33×B · 59×C · 3×D

---

*Full disclosure: this newsletter is run by the maintainers of dsh-audit / the Quality Hub. Ratings are algorithmic; disagreements welcome. Reply and tell us what we got wrong.*
