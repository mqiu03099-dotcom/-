---
name: quweiceshi-theme
description: 在 D:\giteeContent\quweiceshi 中新增或修改一个或多个主题的趣味测试页面。用户给出一个测试主题（如爱情、金钱、运气、人格）并要求按现有风格做成可访问页面时使用；包括根目录 HTML、题库配置、主题配色、动态背景、图标、SEO、首页入口和本地暗号清单。
---

# 趣味测试主题生成

## 产出

每个主题都产出同一套东西：根目录 `<slug>.html`、共享试题配置、主题样式、背景形状、独立图标与 SEO、首页入口卡片，以及根目录 `quiz-passwords.md` 中的暗号记录。

## 先读

- `references/theme-contract.md`：文件职责、配置字段、页面骨架和样式 token。
- `references/quality-gates.md`：交付前必须执行的静态与浏览器检查。

只读当前任务需要的部分，不要一次加载无关主题的完整题库。

用户只给出主题名时，默认直接完成整套页面；只有 slug、暗号冲突或缺少必要素材时才询问，不要把设计细节反问给用户。

## 工作流

1. 选一个未使用的小写英文 slug 和一个未使用的 4 位数字暗号；先查 `quiz-passwords.md`、`assets/js/quizzes.js` 与 `assets/js/love-questions.js`。
2. 从 `crush.html` 复制页面骨架。`love.html` 是独立实现，只维护、不作为新主题模板。
3. 在 `assets/js/quizzes.js` 增加配置：6 个维度，默认每个维度 5 题、共 30 题；结果模式与文案按主题新写，不整套复用。
4. 在 `assets/css/site.css` 增加该主题的 token；在 `assets/js/background.js` 的 `shapePools` 增加 4～6 种符合主题的形状。
5. 生成 `assets/icons/<slug>.svg`、`<slug>-32.png`、`<slug>-180.png`；`favicon.ico` 全站共用，不要放到根目录。
6. 在 `index.html` 对应的大主题分组内增加入口卡片，并同步更新标题、description、OG/Twitter 和页面里的主题数量。
7. 把暗号追加到根目录 `quiz-passwords.md`。该文件已被 `.gitignore` 忽略，不提交。
8. 运行 `node quweiceshi-theme/scripts/check-theme.mjs <slug>`，再按 `quality-gates.md` 做浏览器检查。

## 硬性规则

- 路由保持扁平：页面只能是 `index.html` 或 `<slug>.html`。测试页内不得出现“返回首页 / 返回目录”入口。
- 优先使用 TailwindCSS；卡片是半透明高斯模糊的玻璃质感，整体圆润、扁平，不要卡片阴影，不要出场动画。
- 首页按大主题分组：每个大主题使用与页面顶部标题一致的居中标题区，上方英文眉题、居中放大的 `<h2>`、下方一句说明；卡片标题使用 `<h3>` 并紧跟标题区。爱情组固定第一，其余大主题依次排在后面。没有页面的主题不要生成卡片或死链。
- 同一分类可以一次批量新增多个主题：共用该分类的配色与形状池，但 slug、标题、维度、30 道题目、SEO 和图标必须逐个独立生成。
- 页面外层用 `min-height: 100dvh` 的纵向 flex 布局，由浏览器负责整页滚动；`main` 保持 `flex: 1 0 auto`（内容长时自然撑开），footer 用 `margin-top: auto`，内容不满贴底、内容超出跟随文档流；隐藏滚动条但保留滚动能力；切换题目或结果时用 `window.scrollTo({ top: 0 })` 回顶。
- 必须适配手机、平板和 PC。暗号输入框与所有主要按钮高度统一为 48px，触控区域不小于 48px。
- 结果固定使用六边形 ECharts 雷达图，解释文案放在图表下方；不替换成其他图表。新主题优先使用 `tags` 模式，仍由同一套雷达图渲染。
- 每题 4 个选项。引擎按 `(optionIndex + questionIndex) % 4` 轮换选项位置，必须保证一直点同一位置不会稳定得到最高分或最低分。
- 主按钮用主题色，次按钮为半透明白底加主题描边；结构、尺寸、圆角和字重全站一致，只允许颜色不同。
- “上一题”使用项目已有右箭头 SVG 旋转 180°，图标与 12px 加粗文字同尺寸；首页卡片不要箭头图标。
- 正文整体偏粗，正文基准 `font-weight: 500`，标题、按钮、标签使用更粗字重。
- hover 和 active 只用透明度、颜色或 1px 位移，不得闪烁；移动端点击要有一次轻微缩放反馈，切换下一题后不得残留选中边框。
- 页脚只保留测试免责声明，不写“由某人提供技术支持”、邮箱或联系方式。
- 每个主题都要有独立的浏览器标签图标、`title`、`description`、`keywords`、OG/Twitter 元信息，文案与主题一致。
- 动态背景使用 `--particles` 中的主题色，元素数量由 `background.js` 统一控制（约 26～60 个），不要另起一套动画。

## 验证

静态检查必须通过：

```powershell
node quweiceshi-theme/scripts/check-theme.mjs <slug>
```

浏览器检查至少覆盖 390px、820px、1440px 三个宽度，确认暗号错误提示、答题、结果雷达图、页脚、无横向滚动、无控制台报错。

## 交付说明

最终说明实际改动的文件、执行过的检查及结果、未执行的检查和已知限制。暗号只写入本地 `quiz-passwords.md`，不要在回复中公开完整清单。

## 项目约束

- 遵守仓库 `AGENTS.md`：中文沟通、最小差异、不擅自扩大需求。
- 临时脚本、截图和测试产物只放 `local/`；`quiz-passwords.md` 不提交。
- 未经明确要求，不执行 `git add`、`commit`、`push`，不运行 ESLint、前端 build 或 typecheck。
- 完成后检查 `git diff`、`git diff --ignore-all-space` 和 `git diff --check`，确认没有无关格式变化。
