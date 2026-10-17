# 主题契约

## 文件职责

| 文件 | 作用 |
| --- | --- |
| `<slug>.html`（根目录） | 页面结构、SEO、暗号入口、答题与结果容器 |
| `assets/js/quizzes.js` | 公共引擎的题库与结果配置，键名必须等于 slug |
| `assets/js/quiz-engine.js` | 公共答题逻辑，新增主题不改它 |
| `assets/js/background.js` | 动态背景形状与数量，新增主题只加形状池 |
| `assets/css/site.css` | 主题 token、按钮、选项和交互样式 |
| `assets/icons/<slug>.svg` 等 | 独立 favicon；`favicon.ico` 全站共用 |
| `index.html` | 目录卡片、主题数量、站点 SEO |
| `quiz-passwords.md`（根目录） | 本地暗号清单，已被 `.gitignore` 忽略 |

不要新建页面子目录；不要新增测试页到 `assets/` 或其他目录。

## 页面骨架

以 `crush.html` 为模板复制，保持以下结构：

```html
<body class="flex flex-col text-ink" data-theme="<theme>" data-quiz="<slug>" data-shape="heart">
  <div class="veil" aria-hidden="true"></div>
  <main class="mx-auto flex w-full max-w-[680px] flex-1 flex-col px-5 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-8">
    <div class="my-auto w-full py-6 sm:py-10">
      <section id="gate" class="w-full text-center">...</section>
      <section id="quiz" class="w-full" hidden>...</section>
      <section id="result" class="w-full text-center" hidden>...</section>
    </div>
  </main>
  <footer class="w-full px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-2 text-center text-xs text-muted">
    <p class="mx-auto max-w-[620px] leading-5">本测试仅供娱乐与自我参考，不构成心理评估或情感建议。请勿将测试结果作为现实关系决策的唯一依据。</p>
  </footer>
  <script src="assets/js/quizzes.js?v=pass1"></script>
  <script src="assets/vendor/echarts.min.js"></script>
  <script src="assets/js/quiz-engine.js?v=radar4"></script>
  <script src="assets/js/background.js?v=theme6"></script>
</body>
```

页面必须保留：

- `#gateForm`、`#password`、`#gateHint`；提示文案固定为“需要输入暗号才能进入开始测试”。
- 4 个 `[data-option]` 按钮、`#prev`、`#question`、`#progress`、`#barFill`。
- `#result` 内的 `#visual`、`#score`、`#resultTitle`、`#resultText`、`#resultExtra`、`#copy`、`#restart`。
- 测试页内不要加 `href="index.html"`、返回目录或返回首页。

页面高度固定为 `100dvh`，`body` 不使用 `min-h-*`；内容超出时由页面滚动，`footer` 紧接 `main` 之后随内容滚动；切换题目、入口页或结果页时用 `window.scrollTo` 回到顶部。

## 题库配置

在 `assets/js/quizzes.js` 的 `window.QUIZZES` 中增加：

```js
slug: {
  mode: 'radar',
  password: '1234',
  unit: '综合指数',
  dimensions: [
    { name: '维度一' },
    { name: '维度二' },
    { name: '维度三' },
    { name: '维度四' },
    { name: '维度五' },
    { name: '维度六' }
  ],
  questions: [
    { t: '一句可以被“符合程度”回答的陈述。', d: 0 }
  ],
  bands: [
    { min: 0, title: '低分段标题', text: '解释。', advice: '建议。' }
  ]
}
```

约束：

- `password` 为 4 位数字，全局唯一，不连续、不重复；同时写入根目录 `quiz-passwords.md`。
- `dimensions` 必须正好 6 个，名称短、能作为雷达轴标签。
- `questions` 默认 30 题（6 个维度 × 每个维度 5 题）；历史主题可以保留 18～20 题。`d` 取 0～5，六个维度都要覆盖，分布尽量均匀。
- 题干是陈述句，使用引擎固定的“完全符合 / 比较符合 / 不太符合 / 完全不符合”选项；不要写需要多选或排序的题。
- 同主题内不要重复题干；与其他主题的题干重合度不得过高，不允许整套复制。
- 题目和结果文案要贴合主题，不要使用无法验证的医学、心理诊断结论。

### 结果模式

引擎支持以下 `mode`，按主题需要选一个：

| mode | 额外字段 | 结果标题 |
| --- | --- | --- |
| `radar`（默认） | `unit`、`bands` | 按总分取 `bands` 档位 |
| `meter` | `unit`、`bands` | 与 `radar` 相同，用于指数型主题 |
| `stage` | `stages` | 按总分取阶段，`stages` 项含 `name` |
| `type` | `types`（6 项） | 取雷达最高维度对应的类型 |
| `tags` | `dimensions[].text`、`resultTitle`、`note` | 取最高的两个维度组合 |
| `balance` | `balance.you/ta/even`、`note` | 对比你与 TA 的三维均值 |

所有模式都使用同一套六边形雷达图；不要改成条形图、饼图或仪表盘。新主题默认使用 `tags` 模式，并给每个维度补上 `text`。

## 主题 token

在 `assets/css/site.css` 增加完整 token：

```css
[data-theme="<theme>"] {
  --accent: #e58aa4;
  --accent-deep: #b45d76;
  --accent-soft: rgba(247, 208, 222, 0.72);
  --accent-line: #efb6c7;
  --bg-1: #fffaf5;
  --bg-2: #ffe9f0;
  --glow-1: rgba(246, 190, 210, 0.62);
  --glow-2: rgba(255, 226, 196, 0.58);
  --particles: #eaa0b6,#f6cdb4,#e3c6ee,#f3b8c8,#f7e0c8;
}
```

- 按钮 token 已在公共 `body` 中定义为 `var(--accent)` 和 `var(--accent-deep)`，主题块通常不需要重复声明；只有主按钮文字对比度不足时，才覆盖 `--btn-primary-fg`。
- 背景只由 `--bg-1/--bg-2/--glow-1/--glow-2` 与动态粒子组成，不引入静态背景图。
- `--particles` 提供 4～6 个同主题颜色；不要使用纯黑或高饱和荧光色。
- 主按钮必须使用主题色；次按钮保持半透明白底 + 主题描边。按钮尺寸、圆角、边框和字重由公共 CSS 控制，不要在页面里另写一套。

## 动态背景

在 `assets/js/background.js` 的 `shapePools` 中增加主题键，键名与 `data-theme` 一致：

```js
shapePools = {
  <theme>: ['heart', 'petal', 'sparkle', 'dot']
};
```

可选形状：`dot`、`heart`、`star`、`sparkle`、`petal`、`bubble`、`ring`、`diamond`、`coin`、`spark`、`shard`。每类主题选 4～6 种，`data-shape` 写其中一个作为兜底。

## 图标

- `assets/icons/<slug>.svg`：64×64 视图框，圆角 16 的渐变底 + 主题图形，颜色取自主题 token。
- `<slug>-32.png`、`<slug>-180.png`：由 SVG 渲染，分别用于浏览器标签与 Apple Touch Icon。
- 页面 head 中同时引用 `favicon.ico`、`<slug>.svg`、`<slug>-32.png`、`<slug>-180.png`。
- 根目录不要再生成 `favicon.ico`。

## SEO

每个测试页必须具备并保持主题一致：

- `<title>`：`主题关键词：N 题说明｜趣味测试`。
- `meta description`、`meta keywords`、`meta theme-color`。
- `og:type`、`og:locale`、`og:site_name`、`og:title`、`og:description`。
- `twitter:card`、`twitter:title`、`twitter:description`。
- `lang="zh-CN"`、`viewport`、`robots`。

新增非爱情主题时，首页品牌文案可从“爱情趣味测试”收敛为“趣味测试”，但只改与新增主题直接相关的标题、描述和导航文案。

## 首页分组与卡片

首页按大主题分组。每个大主题的开头使用与首页顶部一致的标题区：上方英文眉题、居中放大的 `<h2>`、下方一句说明，然后紧跟该组的卡片网格；卡片标题使用 `<h3>`。爱情组固定第一（`id="group-love"`），其余大主题按“金钱与财富、运气与机遇、人格与内在、社交与人际、职场与成长、生活方式与脑洞”的顺序排在后面。没有页面的主题不要生成卡片或死链。

标题区结构：

```html
<header class="text-center">
  <p class="text-[11px] tracking-[0.3em] text-[#7890a8]">LOVE QUIZ</p>
  <h2 id="group-love" class="mt-4 text-[clamp(28px,5vw,46px)] font-semibold leading-tight">爱情</h2>
  <p class="mt-3 text-sm text-[#7890a8] sm:text-base">从心动、暗恋到相处方式，挑一个最想知道的答案。</p>
</header>
```

在对应大主题的网格 `section` 末尾追加：

```html
<a href="<slug>.html" style="--accent:#e58aa4;--accent-deep:#b45d76;--card:rgba(247,208,222,.5)" class="flex min-h-[172px] flex-col justify-between rounded-[28px] border border-white/60 bg-[var(--card)] p-5 backdrop-blur-xl transition-colors hover:bg-white/70 sm:min-h-[216px] sm:p-7">
  <div>
    <p class="text-[11px] tracking-[0.2em] text-[var(--accent-deep)]">TAG · 20 题</p>
    <h3 class="mt-3 text-2xl font-semibold">主题标题</h3>
    <p class="mt-2 text-sm leading-6 text-[#6f8199]">一句结果导向的描述。</p>
  </div>
  <span class="mt-6 text-xs text-[#7d93aa]">约 2 分钟 · 六维雷达</span>
</a>
```

卡片不要箭头图标，不要阴影。新增后同步更新首页标题、description、OG/Twitter 和“N 个”主题数量。

## 暗号清单

根目录 `quiz-passwords.md` 保持以下格式，并在 `.gitignore` 中忽略：

```md
| 页面 | 主题 | 暗号 |
| --- | --- | --- |
| <slug>.html | 主题名 | 1234 |
```

每次新增主题都要追加一行；批量新增时同样逐行补齐。不要把暗号写进 HTML、JS 注释、README 或提交信息。
