#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repo = 'C:/worktmp/dsh-plugin-quality-hub';
const blogDir = path.join(repo, 'app/public/images/blog');
const postsFile = path.join(repo, 'app/src/data/blog/posts.ts');

// 1. Check/Create blog images directory
if (!fs.existsSync(blogDir)) {
  fs.mkdirSync(blogDir, { recursive: true });
  console.log('✓ Created blog images directory');
}

// 2. Generate blog hero SVGs
const postsContent = fs.readFileSync(postsFile, 'utf8');
const slugs = [...postsContent.matchAll(/slug: '([^']+)'/g)].map(m => m[1]);
const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

slugs.forEach((slug, i) => {
  const svgPath = path.join(blogDir, `${slug}.svg`);
  if (!fs.existsSync(svgPath)) {
    const color = colors[i % colors.length];
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).substring(0, 50);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="${color}"/>
      <text x="600" y="280" font-family="system-ui, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${title}</text>
      <text x="600" y="340" font-family="system-ui, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.8">dshquality.com</text>
    </svg>`;
    fs.writeFileSync(svgPath, svg);
    console.log(`✓ Generated ${slug}.svg`);
  } else {
    console.log(`  ✓ ${slug}.svg exists`);
  }
});

console.log(`\nGenerated ${slugs.length} blog hero images`);

// 3. Stage all changes
try {
  execSync('git add -A', { cwd: repo, stdio: 'inherit' });
  console.log('✓ Staged all changes');
} catch (e) {
  console.log('⚠ Git add failed:', e.message);
}

// 4. Check status
try {
  const status = execSync('git status --short', { cwd: repo, encoding: 'utf8' });
  console.log('\n=== Git Status ===');
  console.log(status || 'Clean');
} catch (e) {
  console.log('⚠ Status check failed:', e.message);
}

// 5. Commit
try {
  execSync('git commit -m "feat(seo): P0-P2 improvements - score threshold, blog CTAs, similar plugins, OG images"', { cwd: repo, stdio: 'inherit' });
  console.log('✓ Committed');
} catch (e) {
  console.log('⚠ Commit skipped (no changes or failed)');
}

// 6. Push
try {
  execSync('git push origin main', { cwd: repo, stdio: 'inherit' });
  console.log('✓ Pushed to GitHub');
} catch (e) {
  console.log('⚠ Push failed:', e.message);
}
