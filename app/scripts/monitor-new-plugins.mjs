// scripts/monitor-new-plugins.mjs — 监控 dsh-plugin 新仓库，自动生成博客选题
// 用法: node scripts/monitor-new-plugins.mjs [--dry-run]
// 输出: 生成 SEO2026/day{N}/dshquality-new-plugins-day{N}.md

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error('❌ 需要 GITHUB_TOKEN 环境变量');
  process.exit(1);
}

const headers = {
  'Accept': 'application/vnd.github.v3+json',
  'Authorization': `token ${GITHUB_TOKEN}`,
  'User-Agent': 'DSH-Quality-Monitor',
};

async function fetch(url, opts = {}) {
  const res = await fetch(url, { ...headers, ...opts });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function getNewPlugins(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const url = `https://api.github.com/search/repositories?q=dsh-plugin+created:>=${since}&sort=created&order=desc&per_page=30`;
  const data = await fetch(url);
  return data.items.filter(r => r.stargazers_count >= 50); // 只关注有一定关注的
}

function generateIdeas(plugins) {
  if (plugins.length === 0) return [];
  
  const ideas = [];
  const categories = {
    'vision': plugins.filter(p => /vision|image|screenshot|ocr/i.test(p.description || '')),
    'security': plugins.filter(p => /security|scanner|audit|safe/i.test(p.description || '')),
    'multi-agent': plugins.filter(p => /multi|swarm|agent|workflow/i.test(p.description || '')),
    'memory': plugins.filter(p => /memory|rag|knowledge|wiki/i.test(p.description || '')),
  };
  
  for (const [cat, plgs] of Object.entries(categories)) {
    if (plgs.length > 0) {
      ideas.push({
        category: cat,
        count: plgs.length,
        plugins: plgs.slice(0, 3).map(p => ({ name: p.full_name, stars: p.stargazers_count })),
      });
    }
  }
  
  return ideas;
}

function generateBlogPost(ideas, day) {
  const lines = [];
  lines.push(`# DSH 新插件监控 - Day ${day}`);
  lines.push(`日期: ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  
  for (const idea of ideas) {
    lines.push(`## ${idea.category.toUpperCase()} 类目新插件 (${idea.count} 个)`);
    lines.push('');
    for (const p of idea.plugins) {
      lines.push(`- [${p.name}](https://github.com/${p.name}) ⭐${p.stars}`);
    }
    lines.push('');
  }
  
  lines.push('---');
  lines.push('建议博客选题:');
  for (const idea of ideas) {
    lines.push(`- ${idea.category} 插件测评: ${idea.plugins.map(p => p.name.split('/')[1]).join(', ')}`);
  }
  
  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('🔍 扫描近期新增 DSH 插件...');
  
  try {
    const plugins = await getNewPlugins(7);
    console.log(`✅ 找到 ${plugins.length} 个高星新插件`);
    
    if (plugins.length === 0) {
      console.log('ℹ️ 近期无高星新插件，无需生成博客');
      return;
    }
    
    const ideas = generateIdeas(plugins);
    
    if (dryRun) {
      console.log('\n📋 生成选题 (dry-run):');
      console.log(JSON.stringify(ideas, null, 2));
      return;
    }
    
    // 获取当前 day
    const dayFile = join(process.cwd(), 'SEO2026', 'day15', '_dispatch-status.json');
    let day = 15;
    if (existsSync(dayFile)) {
      const status = JSON.parse(readFileSync(dayFile, 'utf-8'));
      day = status.day || 15;
    }
    
    const output = join(process.cwd(), 'SEO2026', `day${day}`, `dshquality-new-plugins-day${day}.md`);
    writeFileSync(output, generateBlogPost(ideas, day));
    console.log(`✅ 已生成: ${output}`);
    
  } catch (err) {
    console.error('❌ 监控失败:', err.message);
    process.exit(1);
  }
}

main();
