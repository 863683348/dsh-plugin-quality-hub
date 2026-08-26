#!/usr/bin/env node
/**
 * Generate SVG hero images for blog posts
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '../../public/images/blog');
const POSTS_FILE = path.join(__dirname, '../../src/data/blog/posts.ts');

// Ensure directory exists
if (!fs.existsSync(BLOG_DIR)) {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
  console.log('Created blog images directory');
}

// Read blog posts
const postsContent = fs.readFileSync(POSTS_FILE, 'utf8');
const slugMatches = postsContent.match(/slug: '([^']+)'/g) || [];
const slugs = slugMatches.map(m => {
  const match = m.match(/slug: '([^']+)'/);
  return match ? match[1] : null;
}).filter(Boolean);

console.log(`Found ${slugs.length} blog posts`);

// Generate SVG for each slug
slugs.forEach(slug => {
  const svgPath = path.join(BLOG_DIR, `${slug}.svg`);
  if (fs.existsSync(svgPath)) {
    console.log(`  ✓ ${slug}.svg already exists`);
    return;
  }

  // Generate a simple colored SVG
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const color = colors[slug.length % colors.length];
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.8"/>
      <stop offset="100%" style="stop-color:${color};stop-opacity:1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">${title.substring(0, 50)}</text>
  <text x="600" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.8">dshquality.com</text>
</svg>`;

  fs.writeFileSync(svgPath, svg);
  console.log(`  ✓ Generated ${slug}.svg`);
});

console.log('\nDone!');
