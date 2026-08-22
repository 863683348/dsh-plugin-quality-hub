# dsh-plugin-lint

Zero-dependency quality linter for **DSH (DeepSeek Harness) plugins**.

It mirrors the exact 4-dimension scoring model used by
[dshquality.com](https://dshquality.com) so plugin authors can run the same
judgment locally, before submitting:

| Dimension | Weight | What it checks |
|-----------|--------|----------------|
| docs | 28% | README presence/length, install & usage sections, LICENSE |
| maintenance | 28% | CI workflows, commit recency (< 90 days), no committed junk |
| npm | 24% | package.json fields, entry point, publish hygiene (files whitelist) |
| ecosystem | 20% | repository field, dsh-related keywords, real plugin export |

## Install / Run

No dependencies — just Node 18+.

```bash
# single-file run (no install needed)
node bin/dsh-plugin-lint.js ../my-dsh-plugin

# JSON output (for CI / badge automation)
node bin/dsh-plugin-lint.js ../my-dsh-plugin --json

# or install globally
npm i -g dsh-plugin-lint
dsh-plugin-lint ../my-dsh-plugin
```

## Example output

```
  dsh-plugin-lint — C:/dev/my-dsh-plugin
  Quality: A (92/100)

  docs         28/28  PASS
  maintenance  22/28  WARN
    - ci-workflow
  npm          24/24  PASS
  ecosystem    20/20  PASS
```

Exit codes: `0` report generated · `2` usage / directory error.

## Why

dshquality.com evaluates 380+ plugins on a transparent, explainable model.
This linter puts that same rubric in the author's hands, so a plugin can
arrive at the ecosystem already "grade-A shaped" — and badge-ready:

```markdown
![DSH Quality A](https://dshquality.com/api/v1/badge/owner/repo)
```

## License

MIT
