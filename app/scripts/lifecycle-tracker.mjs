// scripts/lifecycle-tracker.mjs — 插件生命周期追踪
// 监控仓库活跃度、维护者响应时间、更新频率

import { writeFileSync, join } from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error('❌ 需要 GITHUB_TOKEN 环境变量');
  process.exit(1);
}

const headers = {
  'Accept': 'application/vnd.github.v3+json',
  'Authorization': `token ${GITHUB_TOKEN}`,
  'User-Agent': 'DSH-Quality-Lifecycle',
};

async function fetch(url, opts = {}) {
  const res = await fetch(url, { ...headers, ...opts });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function getPluginLifecycle(fullName) {
  const [owner, repo] = fullName.split('/');
  
  const repoData = await fetch(`https://api.github.com/repos/${fullName}`);
  const commits = await fetch(`https://api.github.com/repos/${fullName}/commits?per_page=10`);
  const issues = await fetch(`https://api.github.com/repos/${fullName}/issues?state=all&sort=created&per_page=20`);
  
  const lastPush = new Date(repoData.pushed_at);
  const daysSincePush = Math.floor((Date.now() - lastPush) / (1000 * 60 * 60 * 24));
  
  const recentCommits = commits.length;
  const commitFrequency = recentCommits / 7;
  
  const openIssues = issues.filter(i => i.state === 'open');
  let avgResponseTime = null;
  if (openIssues.length > 0) {
    const responseTimes = openIssues
      .filter(i => i.comments > 0 && i.created_at)
      .map(i => {
        const firstComment = i.comments > 0 ? new Date(i.comments[0]?.created_at || i.created_at) : null;
        return firstComment ? (firstComment - new Date(i.created_at)) / (1000 * 60 * 60 * 24) : null;
      })
      .filter(t => t !== null && t > 0);
    if (responseTimes.length > 0) {
      avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }
  }
  
  return {
    name: repo,
    owner,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    lastPushDaysAgo: daysSincePush,
    commitFrequency,
    openIssues: openIssues.length,
    avgIssueResponseDays: avgResponseTime,
    health: daysSincePush < 30 && commitFrequency > 0.5 ? 'active' : daysSincePush < 90 ? 'stale' : 'abandoned',
  };
}

async function trackTopPlugins(count = 20) {
  console.log(`📊 追踪 Top ${count} 插件生命周期...`);
  
  const url = `https://api.github.com/search/repositories?q=dsh-plugin&sort=stars&order=desc&per_page=${count}`;
  const data = await fetch(url);
  
  const results = [];
  for (const repo of data.items) {
    try {
      const lifecycle = await getPluginLifecycle(repo.full_name);
      results.push(lifecycle);
      console.log(`  ✓ ${repo.full_name}: ${lifecycle.health} (${lifecycle.lastPushDaysAgo} 天前推送)`);
    } catch (err) {
      console.error(`  ✗ ${repo.full_name}: ${err.message}`);
    }
  }
  
  const report = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    active: results.filter(r => r.health === 'active').length,
    stale: results.filter(r => r.health === 'stale').length,
    abandoned: results.filter(r => r.health === 'abandoned').length,
    plugins: results.sort((a, b) => b.stars - a.stars),
  };
  
  console.log('\n📈 汇总:');
  console.log(`  活跃: ${report.active}`);
  console.log(`  停滞: ${report.stale}`);
  console.log(`  废弃: ${report.abandoned}`);
  
  const output = join(process.cwd(), 'scripts', 'lifecycle-report.json');
  writeFileSync(output, JSON.stringify(report, null, 2));
  console.log(`\n💾 报告已保存: ${output}`);
  
  return report;
}

async function main() {
  const count = parseInt(process.argv[2]) || 20;
  await trackTopPlugins(count);
}

main().catch(console.error);
告已保存: ${output}`);
  
  return report;
}

async function main() {
  const count = parseInt(process.argv[2]) || 20;
  await trackTopPlugins(count);
}

main().catch(console.error);
