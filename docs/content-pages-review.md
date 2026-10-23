# 关键词内页预览2

日期：2026-10-24。状态：本地审核，未提交、推送或部署。

## 审核入口

版本名、页面标题前缀、顶部版本栏与 `design/versions.json` 一致。

| 页面 | 审核地址 | 用途与费用 |
| --- | --- | --- |
| 首页 | http://127.0.0.1:3012/ | 保留原有三个生成模式；增加工具入口 |
| 设定模板 | http://127.0.0.1:3012/headcanon-template | 免费填写、保存两种角色草稿、复制和文本导出 |
| OC 问题 | http://127.0.0.1:3012/oc-questions-generator | 免费，从 40 道原创问题中按分类抽取五题 |
| 场景设定 | http://127.0.0.1:3012/scenario-headcanon-generator | AI 生成五个场景前提，一次一积分 |
| 虚构对话 | http://127.0.0.1:3012/incorrect-quotes-generator | AI 生成五组双人短对话，一次一积分，不冒充官方台词 |
| 随机桥段 | http://127.0.0.1:3012/random-trope-generator | 免费，从 30 个桥段及原创场景例子中抽取五项 |
| 同人剧情 | http://127.0.0.1:3012/fanfiction-plot-generator | AI 生成五个简短大纲，一次一积分，不承诺完整章节 |

本地环境禁用真实发信、生成和购买。免费功能可直接操作，三个 AI 工具可查看表单、示例、错误与空状态；点击生成会提示此处不可用、不扣积分。正式环境沿用现有 $9.90 / 100 积分包，不增加订阅或新套餐。

## 关键词如何落到页面

- headcanon generator、head canon generator、maker、random 和拼写变体由首页及已有页面承接，不为词序和拼写分别建页。
- character / OC / AI / relationship / ship / couple / two people / multiple 等沿用相应已有页面和模式。多角色说明仍明确当前关系模式是两个人，不声称能生成整队。
- headcanon、meaning、what are headcanons、define、anime 等解释型需求补入已有定义指南，而非再建重复定义页。
- headcanon prompts 与写作灵感补入已有 writing prompt 页面，提供六个可复制的原创提示。
- headcanon template、OC worksheet template 合并在模板页；OC questions / OC quiz 类自问需求由问题页承接，不伪装为人格测试。
- scenario / OC scenario / couple situations 合并在场景页；incorrect quotes / character dialogue 合并在虚构对话页。
- random trope 与 fanfiction plot 分别提供桥段抽取和简短大纲工具，功能与输出不同。
- 不做第三、第四类中的竞品品牌导航、无关词、成人内容、版本号拼接及截图中无法确认的截断词。

这些是基于已批准关键词方向的实现，不代表已重新完成实时搜索结果、KGR 或排名机会验证。

## 与上一轮的关系

当前工作目录为 `output/headcanon-content-pages`，分支 `codex/headcanon-content-pages`。从已发布基线 a153ad8 建立独立工作区，保留了“关键词内页预览1”的改动及三个作品专题：

- `/fandom/naruto-headcanon-generator`
- `/fandom/danganronpa-headcanon-generator`
- `/fandom/phighting-headcanon-generator`

它们也可在端口 3012 查看。原 `output/headcanon-keyword-pages` 及端口 3010 保留；收尾比对其当前 tracked diff 与 `preview1.patch` 一致。`output/headcanon-paid` 仍干净。没有覆盖原 D 盘项目的改动。

## 内容和实现

- 复用现有导航、按钮、账户、积分、服务端供应商和支付流程，保持白底、灰色正文、靛蓝操作色及原主工具交互。
- 新页先放可用工具，再放原创示例、使用边界、问答和相关链接。内容按 humanizer 润色，不堆同义词，不把猜测称作官方事实。
- 免费资源不调用模型。模板存储在本机浏览器，两种角色类型各有独立草稿，不承诺跨设备同步。
- 三个 AI 输出类型进入真正的服务端提示词；复用现有预留积分、幂等请求和失败返还逻辑。原默认请求的规范化结构与哈希保持兼容。
- 每种工具有独立待确认请求键，网络状态不明时优先查原请求，不直接发新请求重复扣费。
- 配置了六页 Title、描述、H1、canonical、Open Graph 品牌图片、面包屑、可见问答及对应结构化数据。首页与相关内容提供正常内链。
- 隐私页补充免费本地草稿和新增 AI 内容类型；条款保持原价格、积分包和无订阅规则。

## 已完成的验证

- `npm run prelaunch` 通过：前端 7 项测试、ESLint、TypeScript；后端构建、类型生成、TypeScript 与 11 项测试通过，共 18 项测试。
- 后端使用本地真实 Worker 和模拟供应商，验证三种新增任务的不同提示词、五结果响应、请求重放、跨类型冲突、余额变化、非法输入不扣费及原失败返还流程。没有真实支付、邮件或 Kie 调用。
- `npm run cf:build` 最终构建通过，包括最后的标题、分享图片、隐私、条款和 OC 缩写说明。仅本地构建，不是上线。
- 正常构建的本地站点地图共 35 个 URL，包含六个新页和上一轮三个专题。审核版本的 noindex 与中文版本栏仅由 `CONTENT_REVIEW=1` 开启，发布时不得设置此变量。
- Chrome 实测模板切换、两份独立草稿、刷新恢复、清空和撤销，复制按钮显示成功；问题及桥段分类切换和抽取五项正常，复制状态正常。
- Chrome 实测双角色场景、对话的第二姓名必填、三个工具的本地生成禁用提示。付费示例与真实结果区分离，不把示例当成成功生成。
- 已观察桌面和 390 / 375px 手机布局、菜单展开、长按钮换行与表单。六页均在 Chrome 打开，保存了桌面、手机截图。最终新开审核首页截图为正常桌面宽度。
- `git diff --check` 通过；密钥、依赖、构建产物及本地截图日志均被 Git 忽略；未改依赖锁文件。

## 尚未确认与发布门禁

1. 浏览器控制间歇超时。下载按钮已点击，但下载事件未返回，未确认文件实际落盘；不能声称导出已端到端验收。复制仅确认界面成功提示，未独立读回剪贴板内容。浏览器内部下载页受工具安全策略阻止后没有绕过。
2. 真实模型的三个新增输出质量、真实付费用户全链路仍未验收。本轮使用模拟响应验证协议和计费，不把模拟文本当作模型效果。
3. 原始候选检查为 FAIL：1061 PASS、114 WARN、67 NOT_APPLICABLE、9 MANUAL_PENDING、3 FAIL。三项失败均为 `/fandom/[fandom-slug]`、`/fandom/[fandom-slug]/[character-slug]`、`/guides/[slug]` 字面模板 URL 的 404。六个实际新页没有 FAIL，但全站门禁不能写成已通过。
4. 单语言 hreflang、标题词在 H2 的字面匹配、文字/代码比等仍有规则提示，不为消除分数提示填充正文。完整原始结果在 `output/content-review/onpage-candidate.json`。
5. 发布前需要用实际动态页面实例明确路由验收范围，完成剩余浏览器检查与正常发布构建，再按 deploy-site 的 GitHub main → Cloudflare Builds → 正式域名链路操作。当前没有发布授权，不执行任何远端发布。

截图与检查日志位于 `output/content-review/`；旧版本清单、源码和审核入口保留供对比。
