/**
 * scripts/build-site.mjs — generate the static Quality Hub site from catalog.json.
 * Output: dist/*.html (+ plugin/<name>.html detail pages). Zero dependencies.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");
const DIST = join(ROOT, "docs");

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const gradeEmoji = { A: "🛡️", B: "✅", C: "⚠️", D: "🚨" };
function badge(g) { return '<span class="badge g' + g + '">' + (gradeEmoji[g] ?? "?") + " " + g + "</span>"; }
function daysAgo(iso) {
  if (!iso) return "?";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "today" : d === 1 ? "1d ago" : d + "d ago";
}

const layout = (title, body, active) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — DSH Plugin Quality Hub</title>
<meta name="description" content="Ratings, security signals and rankings for the DeepSeek Harness (DSH) plugin ecosystem.">
<style>
:root{--bg:#0f1115;--card:#171a21;--line:#262b36;--text:#e6e9ef;--muted:#8b93a5;--accent:#4f8cff;--good:#3fb950;--warn:#d29922;--bad:#f85149}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:1000px;margin:0 auto;padding:0 20px}
header{border-bottom:1px solid var(--line);padding:18px 0;margin-bottom:28px}
header .wrap{display:flex;align-items:baseline;gap:24px;flex-wrap:wrap}
.logo{font-size:19px;font-weight:700;color:var(--accent)}
nav{display:flex;gap:16px;flex-wrap:wrap}
nav a{color:var(--muted);text-decoration:none;font-size:14px}
nav a.on,nav a:hover{color:var(--accent)}
h1{font-size:26px;margin:6px 0 10px}
h2{font-size:19px;margin:26px 0 10px;color:var(--accent)}
p.sub{color:var(--muted);margin-bottom:14px}
table{width:100%;border-collapse:collapse;margin:10px 0 26px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--muted);font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:.04em}
td.num{white-space:nowrap}
.badge{padding:1px 7px;border-radius:10px;font-size:12px;font-weight:600;white-space:nowrap}
.gA{background:#12351d;color:var(--good)}.gB{background:#1f2b10;color:#9ecb3f}.gC{background:#332b0f;color:var(--warn)}.gD{background:#3b1216;color:var(--bad)}
a.pl{color:var(--text);text-decoration:none}.a.pl:hover{color:var(--accent)}
.flag{border:1px solid var(--bad);background:#2a1216;color:#ffb3b0;padding:2px 8px;border-radius:10px;font-size:12px;white-space:nowrap}
.note{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin:14px 0}
.muted{color:var(--muted)}
.signals{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:14px 0}
.sig{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.sig h3{font-size:13px;color:var(--muted);margin-bottom:4px}
.sig .pts{font-size:20px;font-weight:700}
.sig ul{list-style:none;margin-top:6px;font-size:13px;color:var(--muted)}
.sig li{padding:1px 0}
.btn{display:inline-block;background:var(--accent);color:#fff;padding:9px 18px;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 4px 0 0}
footer{border-top:1px solid var(--line);margin-top:50px;padding:22px 0;color:var(--muted);font-size:13px}
input[type=email]{padding:9px 12px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--text);min-width:260px}
button{padding:9px 18px;border-radius:8px;border:0;background:var(--accent);color:#fff;font-weight:600;cursor:pointer}
</style>
</head>
<body>
<header><div class="wrap"><div class="logo">DSH Plugin Quality Hub</div>
<nav>
<a href="index.html" class="${active === "index" ? "on" : ""}">Top Rated</a>
<a href="trending.html" class="${active === "trending" ? "on" : ""}">Trending</a>
<a href="security.html" class="${active === "security" ? "on" : ""}">Security Watch</a>
<a href="weekly.html" class="${active === "weekly" ? "on" : ""}">DSH Weekly</a>
<a href="subscribe.html" class="${active === "subscribe" ? "on" : ""}">Subscribe</a>
</nav></div></header>
<div class="wrap">
${body}
</div>
<footer><div class="wrap">DSH Plugin Quality Hub — independent ratings of the <a href="https://github.com/topics/dsh-plugin" style="color:var(--accent)">dsh-plugin</a> ecosystem. Data refreshes weekly. Not affiliated with DeepSeek. <span class="muted">Made with ♥ for the DSH community.</span></div></footer>
</body>
</html>`;

const navFor = (a) => a;

mkdirSync(DIST, { recursive: true });
mkdirSync(join(DIST, "plugin"), { recursive: true });
const catalog = JSON.parse(readFileSync(join(DATA, "catalog.json"), "utf8"));
const meta = JSON.parse(readFileSync(join(DATA, "meta.json"), "utf8"));

function row(p, i) {
  const flags = [];
  if (p.security.highRisk) flags.push('<span class="flag">dangerous install script</span>');
  if (p.npm.exists && !p.plausible) flags.push('<span class="flag">no dsh.bundle</span>');
  if (p.archived) flags.push('<span class="flag">archived</span>');
  return `<tr><td class="num">${i + 1}</td><td><a class="pl" href="plugin/${encodeURIComponent(p.repo)}.html">${esc(p.repo)}</a></td><td>${badge(p.score.grade)}</td><td class="num">${p.score.total}</td><td class="num">${p.stars}</td><td class="num">${daysAgo(p.pushedAt)}</td><td>${flags.join(" ")}</td></tr>`;
}

// ---- index: top rated ----
const top = catalog.slice(0, 30);
const indexBody = `<h1>Which DSH plugins are actually worth installing?</h1>
<p class="sub">Independent ratings of the <b>${catalog.length}</b> most-starred repos tagged ` + "dsh-plugin" + `. Scores (0-100, A-D) blend maintenance, docs, npm signals, ecosystem presence — with security flags that veto the grade. Generated ${new Date(meta.generatedAt).toUTCString()}. <a href="#method">How scoring works</a>.</p>
<table><tr><th>#</th><th>Plugin</th><th>Grade</th><th>Score</th><th>Stars</th><th>Push</th><th>Flags</th></tr>
${top.map(row).join("")}
</table>
<h2>Featured security &amp; memory tools</h2>
<div class="note">
<b><a href="https://github.com/863683348/dsh-plugin-gate">dsh-plugin-gate</a></b> — installation safety gate &amp; data-protection guard: <b>60 static signature rules</b> (31 high / 24 medium / 5 low) scan plugin sources for malicious install scripts, credential theft, persistence and network callbacks before <code>dsh plugin add</code>, plus <b>12 destructive-command patterns</b> and workspace-boundary checks that block accidental deletion (rm -rf /, rmdir /s /q, format, dd, mkfs).<br>
<b><a href="https://github.com/863683348/dsh-plugin-audit">dsh-audit</a></b> — the scoring engine behind this hub: 0-100 health scores (A-D), static security scan with grade veto, genuine-plugin verification against tag farming.<br>
<b><a href="https://github.com/863683348/dsh-memory-setup">dsh-memory-setup</a></b> — a local, auditable personal memory layer: preferences, project conventions, evidence-backed lessons that promote into standing rules, snapshots &amp; restore, 20+ agent tools.
</div>
<h2 id="method">How scoring works</h2>
<div class="note">Every plugin gets a 0-100 health score from four pure signals: <b>Maintenance</b> (30 — last push, stars, archive state), <b>Docs</b> (25 — README, description, license), <b>npm</b> (30 — package exists, publish recency, weekly downloads, dsh.bundle declaration), <b>Ecosystem</b> (15 — curated list membership). Grades: A 🛡️ 80+ · B ✅ 60+ · C ⚠️ 40+ · D 🚨 &lt;40 or any high flag. Install scripts that match dangerous patterns (curl|sh, /dev/tcp, base64 -d, iex, powershell -enc…) are flagged. All scores are explainable — every deduction carries a note on the detail page.</div>`;

// ---- trending ----
const byPush = [...catalog].sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt)).slice(0, 20);
const byStars = [...catalog].sort((a, b) => b.stars - a.stars).slice(0, 20);
const trendingBody = `<h1>Trending &amp; popular</h1>
<p class="sub">Recently active plugins and the most-starred repos in the dsh-plugin topic.</p>
<h2>Recently active</h2>
<table><tr><th>#</th><th>Plugin</th><th>Grade</th><th>Score</th><th>Stars</th><th>Last push</th></tr>
${byPush.map((p, i) => row(p, i)).join("")}
</table>
<h2>Most starred</h2>
<table><tr><th>#</th><th>Plugin</th><th>Grade</th><th>Score</th><th>Stars</th></tr>
${byStars.map((p, i) => `<tr><td class="num">${i + 1}</td><td><a class="pl" href="plugin/${encodeURIComponent(p.repo)}.html">${esc(p.repo)}</a></td><td>${badge(p.score.grade)}</td><td class="num">${p.score.total}</td><td class="num">${p.stars}</td></tr>`).join("")}
</table>`;

// ---- security watch ----
const watch = catalog.filter((p) => p.security.highRisk || p.npm.exists && !p.plausible || p.archived);
const highRisk = catalog.filter((p) => p.security.highRisk);
const securityBody = `<h1>Security watch</h1>
<p class="sub">Security signals and advisories for the dsh-plugin ecosystem: dangerous install scripts, missing dsh.bundle declarations, and archived repos. <b>${watch.length}</b> of ${catalog.length} flagged. Data refreshes weekly. <a href="rss.xml">RSS alerts</a>.</p>
${highRisk.length ? `<h2>⚠ High-risk advisories</h2>
${highRisk.map((p) => `<div class="note"><b><span class="flag">dangerous install script</span> ${esc(p.repo)}</b> — ${esc(p.security.findings.map((f) => f.script + " → " + (f.pattern || f.beacon)).join("; "))}<br><span class="muted">${esc(p.description).slice(0, 160)}</span> · <a href="plugin/${encodeURIComponent(p.repo)}.html">details</a></div>`).join("")}
</h2>` : ""}
${watch.length ? `<h2>Flagged plugins</h2><table><tr><th>Plugin</th><th>Grade</th><th>Issue</th><th>Details</th></tr>
${watch.map((p) => {
  const issues = [];
  if (p.security.highRisk) issues.push("dangerous install script (" + esc(p.security.findings.map((f) => f.script + " → " + (f.pattern || f.beacon)).join("; ")) + ")");
  if (p.npm.exists && !p.plausible) issues.push("npm package exists but does not declare dsh.bundle — may not install via dsh plugin add");
  if (p.archived) issues.push("repository is archived");
  return `<tr><td><a class="pl" href="plugin/${encodeURIComponent(p.repo)}.html">${esc(p.repo)}</a></td><td>${badge(p.score.grade)}</td><td><span class="flag">${esc(issues[0] ?? "flagged")}</span></td><td class="muted">${esc(p.description).slice(0, 120)}</td></tr>`;
}).join("")}
</table>` : `<div class="note">Nothing flagged in the top ${catalog.length} by stars. The long tail is where the risk lives — <a href="https://github.com/863683348/dsh-plugin-audit">dsh-audit</a> scans the full topic, not just the top 100.</div>`}
<div class="note">Heuristic only: pattern matching on npm install scripts and manifest declarations. It is not a substitute for a real code review — especially for long-tail plugins. For full-topic scanning with a deep static security scan, see the open-source <a href="https://github.com/863683348/dsh-plugin-audit">dsh-audit</a>.</div>`;


// ---- detail pages ----
for (const p of catalog) {
  const b = p.score.breakdown;
  const sig = (label, s) => `<div class="sig"><h3>${label}</h3><div class="pts">${s.points}/${s.weight}</div><ul>${(s.notes || []).map((n) => "<li>" + esc(n) + "</li>").join("")}</ul></div>`;
  const flags = (p.score.flags || []).map((f) => "<li><b>" + esc(f.kind) + "</b> (" + esc(f.severity) + "): " + esc(f.detail) + "</li>").join("");
  const body = `<h1>${esc(p.repo)} ${badge(p.score.grade)}</h1>
<p class="sub">Score <b>${p.score.total}/100</b> · ${p.stars} stars · pushed ${daysAgo(p.pushedAt)} · ${p.npm.exists ? "npm " + esc(p.npm.name) + "@" + esc(p.npm.version) : "no npm package"} ${p.npm.exists && p.npm.weeklyDownloads != null ? "· " + p.npm.weeklyDownloads + " downloads/wk" : ""} · ${p.curated ? "in curated list" : "not curated"} · ${p.plausible ? "dsh.bundle ✓" : "no dsh.bundle"}</p>
<p>${esc(p.description)}</p>
<p class="muted"><a href="${esc(p.url)}">GitHub</a> · license: ${esc(p.license || "none")} · topics: ${esc((p.topics || []).join(", "))}</p>
<div class="signals">${sig("Maintenance", b.maintenance)}${sig("Docs", b.docs)}${sig("npm", b.npm)}${sig("Ecosystem", b.ecosystem)}</div>
${flags ? `<h2>Flags</h2><ul>${flags}</ul>` : ""}
${p.security.findings.length ? `<h2>Install-script findings</h2><ul>${p.security.findings.map((f) => "<li>" + esc(f.script) + ": " + esc(f.pattern || f.beacon) + "</li>").join("")}</ul>` : ""}
<p class="muted"><a href="../index.html">← back to rankings</a></p>`;
  writeFileSync(join(DIST, "plugin", encodeURIComponent(p.repo) + ".html"), layout(p.repo, body, "index"));
}

// ---- weekly + subscribe ----
const weeklyBody = `<h1>DSH Weekly</h1>
<p class="sub">A short, opinionated digest of the DeepSeek Harness plugin ecosystem — new plugins, security notes, trends. Every week.</p>
<h2>Issue #001 — The backdoor that wasn't in the docs</h2>
<p class="muted">Draft — published soon. Full text lives in <code>weekly/001-first-issue.md</code>.</p>
<div class="note">This week: a real malicious plugin was found in the wild (credential theft + exfiltration), the topic passed 5,000 repos, and 26 of the top-100 npm packages don't declare dsh.bundle — tag farming is real. Full issue coming shortly.</div>
<p><a class="btn" href="subscribe.html">Get Issue #001 in your inbox</a></p>`;
const subscribeBody = `<h1>Subscribe to DSH Weekly</h1>
<p class="sub">One email a week: what's new in the DeepSeek Harness plugin ecosystem, which plugins are worth installing, and what to be careful about.</p>
<div class="note">📮 <b>How to subscribe:</b> enter your email below and hit Subscribe — it opens a pre-filled email to the editor (<b>dshweekly@example.com</b>) that confirms your subscription. Once a newsletter provider (Buttondown / Substack / Mailchimp) is wired up, this becomes a one-click signup. You can also grab the <a href="rss.xml">RSS feed</a> for new plugin alerts.</div>
<form action="mailto:dshweekly@example.com?subject=Subscribe%20to%20DSH%20Weekly&body=Please%20subscribe%20me%20to%20DSH%20Weekly." method="post" style="margin-top:12px">
<input type="email" name="email" placeholder="you@example.com" required>
<button type="submit">Subscribe</button>
</form>
<p class="muted" style="margin-top:8px">No spam. Unsubscribe anytime. One issue per week.</p>`;

writeFileSync(join(DIST, "index.html"), layout("Top Rated", indexBody, "index"));
writeFileSync(join(DIST, "trending.html"), layout("Trending", trendingBody, "trending"));
writeFileSync(join(DIST, "security.html"), layout("Security Watch", securityBody, "security"));
writeFileSync(join(DIST, "weekly.html"), layout("DSH Weekly", weeklyBody, "weekly"));
writeFileSync(join(DIST, "subscribe.html"), layout("Subscribe", subscribeBody, "subscribe"));
writeFileSync(join(DIST, "meta.txt"), JSON.stringify(meta, null, 1));
console.log("built " + (catalog.length + 5) + " pages (index/trending/security/weekly/subscribe + " + catalog.length + " details)");

// ---- RSS feed (new plugins, high scores, security signals) ----
function rssDate(iso) {
  if (!iso) return new Date().toUTCString();
  const d = new Date(iso);
  return isNaN(d) ? new Date().toUTCString() : d.toUTCString();
}
function generateRss() {
  const site = "https://863683348.github.io/dsh-plugin-quality-hub/";
  const items = [];
  // 1. Recently created plugins
  for (const p of [...catalog].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 8)) {
    items.push({
      title: "New plugin: " + p.repo + (p.score ? " (" + p.score.grade + " " + p.score.total + ")" : ""),
      link: site + "plugin/" + encodeURIComponent(p.repo) + ".html",
      guid: "new-" + p.repo + "-" + (p.createdAt || ""),
      date: p.createdAt,
      desc: (p.description || "").slice(0, 300) + (p.npm && p.npm.exists ? " — npm: " + p.npm.name + "@" + p.npm.version : "") + (p.stars != null ? " · " + p.stars + " stars" : "")
    });
  }
  // 2. High-risk security signals
  for (const p of catalog.filter((x) => x.security && x.security.highRisk)) {
    items.push({
      title: "⚠ Security alert: " + p.repo,
      link: site + "plugin/" + encodeURIComponent(p.repo) + ".html",
      guid: "sec-" + p.repo,
      date: p.pushedAt,
      desc: "Dangerous install script detected: " + (p.security.findings || []).map((f) => (f.script || "") + " -> " + (f.pattern || f.beacon || "")).join("; ") + " — " + (p.description || "").slice(0, 200)
    });
  }
  // 3. Top A-grade plugins
  for (const p of catalog.filter((x) => x.score && x.score.grade === "A").slice(0, 5)) {
    items.push({
      title: "Top rated: " + p.repo + " (A " + p.score.total + "/100)",
      link: site + "plugin/" + encodeURIComponent(p.repo) + ".html",
      guid: "top-" + p.repo,
      date: p.pushedAt,
      desc: (p.description || "").slice(0, 300) + (p.npm && p.npm.exists ? " — npm: " + p.npm.name + "@" + p.npm.version : "")
    });
  }
  items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>DSH Plugin Quality Hub — Alerts & New Plugins</title>
<link>${site}</link>
<description>Ratings, security signals and new-plugin alerts for the DeepSeek Harness (DSH) plugin ecosystem.</description>
<language>en</language>
<atom:link href="${site}rss.xml" rel="self" type="application/rss+xml"/>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.map((it) => `<item>
<title>${esc(it.title)}</title>
<link>${it.link}</link>
<guid isPermaLink="false">${esc(it.guid)}</guid>
<pubDate>${rssDate(it.date)}</pubDate>
<description>${esc(it.desc)}</description>
</item>`).join("\n")}
</channel>
</rss>
`;
  writeFileSync(join(DIST, "rss.xml"), xml);
  console.log("rss.xml written with " + items.length + " items");
}
generateRss();

