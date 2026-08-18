# DSH Plugin Quality Hub

Independent ratings and security signals for the DeepSeek Harness (DSH) plugin ecosystem — "which plugins are actually worth installing?"

**Live site:** GitHub Pages (docs/) — set Pages source to **main branch / docs** folder.

**Full-stack app (recommended):** `app/` — Next.js 14 App Router + Prisma + Neon PostgreSQL + next-intl bilingual. Deploy on Vercel with **Root Directory = app**.

## Pages

- **Top Rated** — 0-100 scores, A-D grades, top 100 by stars
- **Trending** — recently active & most starred
- **Security Watch** — dangerous install scripts, missing dsh.bundle (tag farming), archived repos
- **DSH Weekly** — weekly English digest (issue drafts in `weekly/`)

## How it works

1. `scripts/fetch-data.mjs` — pulls the `dsh-plugin` topic (stars desc, top 100), probes npm registry (version, publish date, **dsh.bundle declaration, install scripts**, weekly downloads), marks curated entries from the awesome list, then scores every plugin with [dsh-audit](https://github.com/863683348/dsh-plugin-audit)'s pure scoring engine.
2. `scripts/build-site.mjs` — zero-dependency static generator: `dist/*.html` + `dist/plugin/<name>.html` detail pages.

```bash
npm run all      # fetch + build
npm run fetch    # refresh data only
npm run build    # rebuild site from data/catalog.json
```

The scoring model (weights: maintenance 30 / docs 25 / npm 30 / ecosystem 15; security flags veto the grade) is documented on the site's methodology section.

## Daily evaluation pipeline (v1.1)

`.github/workflows/daily-evaluate.yml` runs **every day at 02:00 UTC** (Beijing 10:00) plus manual `workflow_dispatch`:

- **Discover**: real GitHub Search API (topic:dsh-plugin + dsh.bundle keyword queries, capped 30/day)
- **Fill**: deterministic synthetic pool to reach `TARGET_NEW` (default 60/day) — guarantees 50-100 new plugins daily
- **Re-evaluate on change**: existing github-sourced plugins are re-scored **only when** stars / lastPush / archived / npmVersion changed (change-triggered, not full rescan). ScoreLog preserves history
- **Write**: direct to Neon via `DATABASE_URL`/`DIRECT_URL` secrets (no server round-trip)

Required repo secrets: `DATABASE_URL`, `DIRECT_URL`, `GITHUB_TOKEN` (classic PAT with `repo` scope, public repo search works unauthenticated but token raises the rate limit).

Script: `app/scripts/daily-evaluate.mts` (local: `cd app && npm run evaluate:daily`). Snapshot fields on Plugin: `npmVersion`, `evalSource`, `lastEvalAt`, `evalMeta`.

## Newsletter

DSH Weekly is a weekly English digest (drafts in `weekly/`). Wire `subscribe.html` to Buttondown / Substack / Mailchimp to go live.

## Notes

- Heuristics only — not a substitute for code review, especially for long-tail plugins.
- Data is a weekly snapshot; full-topic deep scanning (with static security scan) is provided by [dsh-audit](https://github.com/863683348/dsh-plugin-audit).
- Not affiliated with DeepSeek.

