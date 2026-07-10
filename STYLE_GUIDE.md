# Headcanon Generator style guide

这份文档用于复用本站的前端风格。下次做新工具站时，可以把它作为设计参考交给 Codex。

## 风格定位

- 类型：轻量工具站，内容辅助型产品。
- 气质：清爽、克制、安静，有一点创作感，但不要像营销落地页。
- 第一屏：直接给用户可操作的工具，不做大段品牌介绍。
- 适用场景：AI 小工具、创作辅助、SEO 内容工具、轻 SaaS 原型。

## Design tokens（设计变量）

颜色：

- 主背景：`white` / `slate-50`
- 深色背景：`slate-950` / `slate-900`
- 主文字：`slate-900`
- 次级文字：`slate-600` / `slate-500`
- 边框：`slate-200`
- 深色边框：`slate-800`
- 强调色：`indigo-600`
- 强调 hover：`indigo-500`
- 成功状态：`emerald-500`
- 警告状态：`amber-500`

圆角：

- 普通按钮：`rounded-lg`
- 大按钮和输入框：`rounded-xl`
- 卡片：`rounded-xl`

阴影：

- 卡片默认只用轻阴影：`shadow-sm`
- 主按钮可用轻微彩色阴影：`shadow-lg shadow-indigo-500/25`
- 不使用大面积浮夸阴影。

字体：

- 使用系统 sans 字体。
- 标题用 `font-bold` 或 `font-semibold`。
- 正文保持 `text-sm` 到 `text-base`。
- 不用负字距。

## Layout patterns（布局模式）

整体结构：

1. Sticky navigation（吸顶导航）
2. Hero tool area（首屏工具区）
3. Results / examples（结果或示例区）
4. Feature cards（功能说明卡片）
5. FAQ and long-form SEO content（问答和长文 SEO 内容）
6. Footer（页脚）

页面宽度：

- 主内容最大宽度：`max-w-6xl`
- 文章/内页最大宽度：`max-w-2xl` 到 `max-w-3xl`
- 横向留白：`px-4 sm:px-6 lg:px-8`

区块间距：

- 大区块上下间距：`py-20`
- 卡片网格间距：`gap-6` 或 `gap-8`
- 内页正文卡片间距：`mt-6`

## Components（组件）

Button（按钮）：

- 主操作按钮使用 `primary`：靛蓝背景、白字。
- 次级操作按钮使用 `secondary`：白底、细边框。
- 按钮内有图标时使用 lucide 图标。
- 不用过多文字解释按钮，按钮文案要短。

Input（输入框）：

- 高度以 `h-14` 为主。
- 使用白色半透明背景和轻边框。
- placeholder（占位文案）保持直接，例如 `Character name`。

Card（卡片）：

- 用于结果、示例、FAQ 外的独立信息块。
- 卡片只包一层，不要卡片套卡片。
- 默认白底、slate 边框、轻阴影。

Accordion（折叠面板）：

- 用于 FAQ。
- 问题文案要像真人会问的问题，不要像营销话术。

## Page sections（页面区块）

Hero section（首屏区）：

- H1 直接写工具名。
- 副标题一句话说明用途。
- 表单放在第一屏中央。
- 背景可以使用非常轻的渐变和网格，但不要使用装饰性光球。

Showcase section（展示区）：

- 展示生成结果和精选示例。
- 保留复制、分享等明确操作。
- 示例内容要能直接被用户使用或改写。

Feature section（功能区）：

- 每张卡只讲一个具体用途。
- 文案要像产品说明，不要夸大。
- 避免 "powerful", "unlock", "revolutionize" 这类 AI 味或广告味词。

SEO section（SEO 内容区）：

- FAQ 放前面，长文放后面。
- 长文用短段落。
- 内容要具体，给用户真实帮助。
- 不要写泛泛的总结段。

Fandom detail page（角色内容页）：

- 每页必须有独立 title、description、canonical、H1。
- H1 用完整文本，例如 `Raiden Shogun headcanon for Genshin Impact`。
- 内容结构建议：
  - summary（简短说明）
  - main headcanon（核心同人设定）
  - why it fits（为什么适合这个角色）
  - writing prompts（写作提示）

## Writing style（文案风格）

原则：

- 短句优先。
- 具体优先。
- 少用抽象形容词。
- 少用三连排比。
- 不用 em dash / en dash（长破折号 / 短破折号）。
- 不写 "This tool empowers creators..." 这类模板句。

推荐语气：

- 像一个懂创作的普通人。
- 允许轻微主观，但不要油腻。
- 解释功能时直接说能做什么。

示例：

```text
Enter a character and fandom. Get a short headcanon you can build from.
```

不要写：

```text
Unlock limitless creative possibilities with our powerful AI-driven character inspiration platform.
```

## Interaction rules（交互规则）

- 工具站第一屏必须可直接使用。
- 不要把核心功能藏到 landing page（营销页）后面。
- 复制、分享、生成这类操作要保留清晰按钮。
- 不为了 SEO 改掉用户已经熟悉的交互。
- 内链可以加，但不能让现有按钮行为变得模糊。

## Reuse prompt（复用提示词）

下次做新网站时，可以直接把这段给 Codex：

```text
使用 headcanon-generator 的前端风格做这个网站：清爽、克制、轻工具感，浅色 SaaS 风格，slate 灰作为主色，indigo 作为强调色。第一屏直接放可用工具，不做营销型 hero。使用 sticky navigation、居中的工具表单、结果卡片、功能卡片、FAQ 和简短 SEO 长文。按钮、输入框、卡片沿用 rounded-lg / rounded-xl、细边框、轻阴影。文案要自然具体，避免 AI 味、夸张宣传、长破折号和空泛总结。不要改变核心交互来凑 SEO。
```

如果是偏内容工具站，再追加：

```text
内容页采用“内容页矩阵 + 工具转化”的结构。每个内容页都要有独立 title、description、canonical、H1、summary、核心内容、使用场景、FAQ 或 prompts，并在合适位置引导用户回到工具继续生成。
```

## Do not copy（不要照搬的部分）

- 不要复用 Headcanon Generator 的具体角色内容到无关站点。
- 不要复用 `G-L1SQ5EQQ4Q` 这类项目专属统计 ID。
- 不要复用具体域名、sitemap URL、Cloudflare 项目名。
- 不要为了保持风格而牺牲新项目的主题表达。
