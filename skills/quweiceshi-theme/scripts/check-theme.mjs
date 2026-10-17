#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const slug = process.argv[2];
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function run(code) {
  const context = { window: {} };
  vm.runInNewContext(code, context, { timeout: 2000 });
  return context;
}

if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('用法: node skills/quweiceshi-theme/scripts/check-theme.mjs <slug>');
  process.exit(2);
}

const pagePath = slug + '.html';
if (!exists(pagePath)) {
  console.error('页面不存在: ' + pagePath);
  process.exit(1);
}

const html = read(pagePath);
const quizzes = run(read('assets/js/quizzes.js')).window.QUIZZES || {};
const isLove = slug === 'love';
const cfg = isLove ? null : quizzes[slug];
const theme = (html.match(/data-theme="([^"]+)"/) || [])[1] || '';

if (!isLove && !cfg) {
  fail('assets/js/quizzes.js 中没有 ' + slug + ' 配置');
}

if (!theme) fail('body 缺少 data-theme');
if (!isLove && !html.includes('data-quiz="' + slug + '"')) fail('body 缺少 data-quiz="' + slug + '"');
if (!isLove && !/data-shape="[^"]+"/.test(html)) fail('body 缺少 data-shape');

if (cfg) {
  if (!/^\d{4}$/.test(cfg.password || '')) fail('暗号必须是 4 位数字');
  if (!Array.isArray(cfg.dimensions) || cfg.dimensions.length !== 6) {
    fail('dimensions 必须是 6 个');
  } else {
    cfg.dimensions.forEach((item, index) => {
      if (!item || !item.name) fail('第 ' + (index + 1) + ' 个维度缺少 name');
    });
  }

  if (!Array.isArray(cfg.questions) || cfg.questions.length < 18 || cfg.questions.length > 30) {
    fail('questions 必须是 18～30 题');
  } else {
    const covered = new Set();
    const seen = new Set();
    cfg.questions.forEach((question, index) => {
      if (!question || typeof question.t !== 'string' || !question.t.trim()) {
        fail('第 ' + (index + 1) + ' 题缺少题干');
      }
      if (!Number.isInteger(question.d) || question.d < 0 || question.d > 5) {
        fail('第 ' + (index + 1) + ' 题的 d 必须在 0～5 之间');
      } else {
        covered.add(question.d);
      }
      if (question && seen.has(question.t)) fail('第 ' + (index + 1) + ' 题与前面的题干重复');
      if (question) seen.add(question.t);
    });
    if (covered.size !== 6) fail('六个维度没有全部覆盖');

    for (let option = 0; option < 4; option += 1) {
      let total = 0;
      cfg.questions.forEach((_, index) => {
        total += 4 - ((option + index) % 4);
      });
      const count = cfg.questions.length;
      if (total === count * 4 || total === count) {
        fail('一直选第 ' + (option + 1) + ' 个选项会得到极端分');
      }
    }
  }

  const mode = cfg.mode || 'radar';
  if (mode === 'radar' || mode === 'meter') {
    if (!Array.isArray(cfg.bands) || !cfg.bands.length || cfg.bands[0].min !== 0) {
      fail('bands 必须从 min: 0 开始');
    }
  } else if (mode === 'stage') {
    if (!Array.isArray(cfg.stages) || !cfg.stages.length || cfg.stages[0].min !== 0) {
      fail('stages 必须从 min: 0 开始');
    }
  } else if (mode === 'type') {
    if (!Array.isArray(cfg.types) || cfg.types.length !== 6) fail('type 模式必须有 6 个 types');
  } else if (mode === 'tags') {
    if (!cfg.dimensions || cfg.dimensions.some((item) => !item.text)) {
      fail('tags 模式的每个维度都要有 text');
    }
  } else if (mode === 'balance') {
    if (!cfg.balance || !cfg.balance.even || !cfg.balance.you || !cfg.balance.ta) {
      fail('balance 模式缺少 even/you/ta');
    }
  } else {
    fail('不支持的结果模式: ' + mode);
  }
}

const loveSource = read('assets/js/love-questions.js');
const loveContext = {};
vm.runInNewContext(loveSource + '\n;globalThis.__love={ACCESS_PASSWORD};', loveContext, { timeout: 2000 });
const lovePassword = loveContext.__love.ACCESS_PASSWORD;
const allPasswords = [lovePassword, ...Object.values(quizzes).map((item) => item.password)];
if (new Set(allPasswords).size !== allPasswords.length) fail('存在重复暗号');
allPasswords.forEach((password) => {
  if (/(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/.test(password)) {
    fail('暗号过于连续: ' + password);
  }
});

if (cfg) {
  for (const [key, item] of Object.entries(quizzes)) {
    if (key === slug) continue;
    if (!Array.isArray(item.questions)) continue;
    const current = cfg.questions.map((question) => question.t);
    const other = item.questions.map((question) => question.t);
    const shared = current.filter((text) => other.includes(text)).length;
    if (shared === current.length && shared === other.length) fail('题目与 ' + key + ' 完全相同');
    else if (shared / Math.max(current.length, other.length) > 0.6) warn('题目与 ' + key + ' 重合较多');
  }
}

const requiredMeta = [
  ['title', /<title>[^<]+<\/title>/],
  ['description', /name="description" content="[^"]+"/],
  ['keywords', /name="keywords" content="[^"]+"/],
  ['theme-color', /name="theme-color" content="[^"]+"/],
  ['og:title', /property="og:title" content="[^"]+"/],
  ['og:description', /property="og:description" content="[^"]+"/],
  ['og:type', /property="og:type" content="[^"]+"/],
  ['og:site_name', /property="og:site_name" content="[^"]+"/],
  ['twitter:card', /name="twitter:card" content="[^"]+"/],
  ['twitter:title', /name="twitter:title" content="[^"]+"/],
  ['twitter:description', /name="twitter:description" content="[^"]+"/]
];
requiredMeta.forEach(([name, pattern]) => {
  if (!pattern.test(html)) fail('缺少 SEO 字段: ' + name);
});

const iconFiles = ['assets/icons/favicon.ico', 'assets/icons/' + slug + '.svg', 'assets/icons/' + slug + '-32.png', 'assets/icons/' + slug + '-180.png'];
iconFiles.forEach((file) => {
  if (!exists(file)) fail('缺少图标文件: ' + file);
  if (!html.includes(file)) fail('页面没有引用图标: ' + file);
});

if (theme && !isLove) {
  const css = read('assets/css/site.css');
  const block = css.match(new RegExp('\\[data-theme="' + theme + '"\\]\\s*\\{([\\s\\S]*?)\\}'));
  if (!block) fail('site.css 缺少 [data-theme="' + theme + '"]');
  else {
    ['--accent', '--accent-deep', '--accent-soft', '--accent-line', '--bg-1', '--bg-2', '--glow-1', '--glow-2', '--particles'].forEach((token) => {
      if (!block[1].includes(token)) fail('主题 token 缺少 ' + token);
    });
  }

  const background = read('assets/js/background.js');
  if (!new RegExp('\\b' + theme + ':\\s*\\[').test(background)) {
    fail('background.js 的 shapePools 缺少 ' + theme);
  }
}

if (!html.includes('assets/css/site.css')) fail('页面没有引用 site.css');
if (!html.includes('assets/vendor/tailwind.js')) fail('页面没有引用 Tailwind');
if (!html.includes('assets/vendor/echarts.min.js')) fail('页面没有引用 ECharts');
if (!isLove && !html.includes('assets/js/quizzes.js')) fail('页面没有引用 quizzes.js');
if (!isLove && !html.includes('assets/js/quiz-engine.js')) fail('页面没有引用 quiz-engine.js');
if (!html.includes('assets/js/background.js')) fail('页面没有引用 background.js');
if (!html.includes('需要输入暗号才能进入开始测试')) fail('缺少暗号提示文案');

const footer = (html.match(/<footer[\s\S]*?<\/footer>/) || [])[0] || '';
if (!footer.includes('本测试仅供娱乐与自我参考')) fail('页脚缺少测试免责声明');
if (/潇洒哥|2939561428|mailto:|技术支持/.test(footer)) fail('页脚仍包含支持者或联系方式');
if (/href="index\.html"/.test(html)) fail('测试页不能包含返回首页链接');
if (/返回目录|返回首页/.test(html)) fail('测试页不能包含返回目录入口');
if (html.includes('assets/backgrounds/')) warn('页面仍引用旧静态背景图');

const assetRefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((ref) => !/^(https?:|data:|#|mailto:|javascript:)/.test(ref))
  .map((ref) => ref.split('?')[0]);
assetRefs.forEach((ref) => {
  if (!exists(ref)) fail('本地资源不存在: ' + ref);
});

const index = read('index.html');
if (!index.includes('href="' + slug + '.html"')) fail('index.html 缺少 ' + slug + ' 卡片');
const cards = new Set([...index.matchAll(/href="([a-z0-9-]+)\.html"/g)].map((match) => match[1]));
const countSources = [
  (index.match(/<title>([^<]*)<\/title>/) || [])[1] || '',
  (index.match(/name="description" content="([^"]*)"/) || [])[1] || '',
  (index.match(/<header[\s\S]*?<\/header>/) || [])[0] || ''
];
countSources.forEach((source) => {
  [...source.matchAll(/(\d+)\s*个/g)].map((match) => Number(match[1])).forEach((count) => {
    if (count !== cards.size) fail('index.html 主题数量写的是 ' + count + '，实际卡片 ' + cards.size + ' 个');
  });
});

const passwordFile = 'quiz-passwords.md';
if (!exists(passwordFile)) {
  fail('缺少根目录 quiz-passwords.md');
} else {
  const rows = read(passwordFile);
  const rowMatch = rows.match(new RegExp('\\|\\s*' + slug + '\\.html\\s*\\|[^|]*\\|\\s*(\\d{4})\\s*\\|'));
  if (!rowMatch) fail('quiz-passwords.md 缺少 ' + slug + ' 的暗号记录');
  else if (cfg && rowMatch[1] !== cfg.password) fail('quiz-passwords.md 中的暗号与配置不一致');
  if (isLove && rowMatch && rowMatch[1] !== lovePassword) fail('quiz-passwords.md 中的暗号与 love 配置不一致');
}

if (errors.length) {
  console.error('FAIL ' + slug);
  errors.forEach((message) => console.error('- ' + message));
  if (warnings.length) warnings.forEach((message) => console.error('! ' + message));
  process.exit(1);
}

console.log('PASS ' + slug + ' | ' + (cfg ? cfg.questions.length + ' 题 | 6 维' : '独立实现') + (warnings.length ? ' | ' + warnings.length + ' 条提示' : ''));
warnings.forEach((message) => console.log('! ' + message));
