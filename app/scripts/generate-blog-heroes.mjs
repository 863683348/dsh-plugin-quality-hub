// 为博客文章批量生成 openGraph SVG hero 图片
const fs = require('fs');
const path = require('path');

const POSTS = [
  { slug: 'dsh-plugin-security-scanner-guide', title: 'DSH Plugin Security Scanner Guide', color: '#ef4444' },
  { slug: 'dsh-plugin-ecosystem-explosion-analysis', title: 'DSH Plugin Ecosystem Explosion', color: '#3b82f6' },
  { slug: 'how-install-script-scanning-works', title: 'How Install Script Scanning Works', color: '#f59e0b' },
  { slug: 'deepseek-harness-everything-is-a-plugin', title: 'DeepSeek Harness 101', color: '#10b981' },
  { slug: 'dsh-cli-journey-rc7-road-to-1.0', title: 'DSH CLI Journey', color: '#8b5cf6' },
  { slug: 'landlock-sandboxing-plugin-isolation', title: 'Landlock Sandboxing', color: '#06b6d4' },
  { slug: 'dangerous-install-script-explained', title: 'Dangerous Install Script Explained', color: '#f97316' },
  { slug: 'why-independent-plugin-scoring-beats-self-reported-ratings', title: 'Why Independent Scoring Matters', color: '#84cc16' },
  { slug: 'dsh-quality-score-decoded', title: 'DSH Quality Score Decoded', color: '#a855f7' },
  { slug: 'install-dsh-plugins-safely-windows', title: 'Install DSH Plugins Safely', color: '#22c55e' },
  { slug: 'plugin-supply-chain-security-team-enforcement', title: 'Plugin Supply Chain Security', color: '#ec4899' },
];

function generateSVG(post) {
  const { title, slug, color } = post;
  const shortTitle = title.length > 40 ? title.slice(0, 37) + '...' : title;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${color};stop-opacity:0.2" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#accent)" opacity="0.3"/>
  <circle cx="1050" cy="100" r="200" fill="${color}" opacity="0.1"/>
  <circle cx="150" cy="550" r="150" fill="${color}" opacity="0.08"/>
  <text x="80" y="240" font-family="system-ui,-apple-system,sans-serif" font-size="48" font-weight="700" fill="#f8fafc">${shortTitle}</text>
  <text x="80" y="300" font-family="system-ui,-apple-system,sans-serif" font-size="24" fill="#94a3b8">DSH Quality Blog</text>
  <rect x="80" y="340" width="60" height="4" rx="2" fill="${color}"/>
  <text x="80" y="580" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="#64748b">dshquality.com</text>
</svg>`;
}

const outDir = 'C:/worktmp/dsh-plugin-quality-hub/app/public/images/blog';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const post of POSTS) {
  const svg = generateSVG(post);
  const filename = `${post.slug}.svg`;
  fs.writeFileSync(path.join(outDir, filename), svg, 'utf8');
  console.log('✓ ' + filename);
}

console.log('\nGenerated ' + POSTS.length + ' SVGs');
