import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERNAME = process.env.GITHUB_REPOSITORY_OWNER || process.env.GITHUB_USERNAME || 'CXY037';
const TOKEN = process.env.GITHUB_TOKEN;

const headers = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'Profile-Readme-Generator'
};
if (TOKEN) {
  headers['Authorization'] = `Bearer ${TOKEN}`;
}

const CATEGORY_CONFIG = [
  {
    tag: 'cat-wechat',
    title: '💬 微信与小程序生态',
    description: '微信备份导出、公众号数据采集、小程序解包与生态工具'
  },
  {
    tag: 'cat-ai-data',
    title: '🤖 AI 智能体与数据解析',
    description: '大模型应用、智能体交易、PDF 深度解析与 MCP 服务'
  },
  {
    tag: 'cat-network-sec',
    title: '🌐 网络穿透与通信安全',
    description: 'TLS 协议混淆、内网穿透、数据加密与安全代理工具'
  },
  {
    tag: 'cat-php-swoole',
    title: '🐘 PHP & EasySwoole 生态',
    description: 'Swoole 协程框架、IDE Helper 与高性能微服务模板'
  },
  {
    tag: 'cat-tools',
    title: '🛠️ 实用工具与趣味开源',
    description: '学术助手、信息分析与桌面虚拟宠物'
  }
];

async function fetchAllRepos() {
  const repos = [];
  let page = 1;
  while (true) {
    const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&page=${page}&sort=updated`, { headers });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to fetch repos: ${err}`);
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    repos.push(...data);
    if (data.length < 100) break;
    page++;
  }
  // Exclude self profile repo and dmca blocked repos
  return repos.filter(r => r.name.toLowerCase() !== USERNAME.toLowerCase() && !r.disabled);
}

function renderRepoRow(repo) {
  const nameLink = `**[${repo.name}](${repo.html_url})**`;
  const isFork = repo.fork ? ' 🔀 `Fork`' : ' 🌟 `Original`';
  const lang = repo.language ? `\`${repo.language}\`` : '`-`';
  const stars = repo.stargazers_count > 0 ? ` ⭐ ${repo.stargazers_count}` : '';
  const desc = (repo.description || '').replace(/\|/g, '/');

  // Filter out cat- tags for cleaner visual topics
  const displayTopics = (repo.topics || [])
    .filter(t => !t.startsWith('cat-'))
    .map(t => `\`${t}\``)
    .join(' ');

  return `| ${nameLink}${isFork} | ${lang} | ${desc} | ${displayTopics || '-'} |${stars ? ` ${stars} |` : ''}`;
}

async function main() {
  console.log(`Generating Profile README for user ${USERNAME}...`);
  const allRepos = await fetchAllRepos();
  console.log(`Fetched ${allRepos.length} public repositories.`);

  const categoryMap = new Map();
  CATEGORY_CONFIG.forEach(c => categoryMap.set(c.tag, []));
  const uncategorized = [];

  for (const repo of allRepos) {
    const topics = repo.topics || [];
    let matched = false;
    for (const c of CATEGORY_CONFIG) {
      if (topics.includes(c.tag)) {
        categoryMap.get(c.tag).push(repo);
        matched = true;
        break;
      }
    }
    if (!matched) {
      uncategorized.push(repo);
    }
  }

  let content = `# 🚀 Hi there, I'm CXY037 👋\n\n`;
  content += `> 💻 专注于 **AI 智能体**、**微信生态**、**网络通信与穿透**、**Swoole 协程**开发。\n`;
  content += `> ⚡ 本项目导航由 **GitHub Actions + Topics 标签** 每日全自动同步更新。\n\n`;
  content += `---\n\n`;
  content += `## 📂 项目资产与分类导航\n\n`;

  for (const c of CATEGORY_CONFIG) {
    const items = categoryMap.get(c.tag) || [];
    if (items.length === 0) continue;

    content += `### ${c.title}\n`;
    content += `*${c.description}*\n\n`;
    content += `| 仓库名 | 主要语言 | 简介 | 核心标签 |\n`;
    content += `| :--- | :---: | :--- | :--- |\n`;
    items.forEach(repo => {
      content += renderRepoRow(repo) + '\n';
    });
    content += '\n';
  }

  if (uncategorized.length > 0) {
    content += `### 📦 其他仓库与实验项目\n\n`;
    content += `| 仓库名 | 主要语言 | 简介 | 核心标签 |\n`;
    content += `| :--- | :---: | :--- | :--- |\n`;
    uncategorized.forEach(repo => {
      content += renderRepoRow(repo) + '\n';
    });
    content += '\n';
  }

  content += `---\n\n`;
  content += `### 🛠️ 技术统计与概览\n\n`;
  content += `<p align="left">\n`;
  content += `  <img src="https://github-readme-stats.vercel.app/api?username=${USERNAME}&show_icons=true&theme=radical&hide_border=true" height="150" alt="GitHub Stats" />\n`;
  content += `  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${USERNAME}&layout=compact&theme=radical&hide_border=true" height="150" alt="Top Languages" />\n`;
  content += `</p>\n\n`;
  content += `*⏱️ 最近自动更新时间 (UTC): ${new Date().toISOString().replace('T', ' ').substring(0, 19)}*\n`;

  const targetPath = path.resolve(__dirname, '../README.md');
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`Profile README successfully written to ${targetPath}`);
}

main().catch(err => {
  console.error('Error generating readme:', err);
  process.exit(1);
});
