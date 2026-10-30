# 深度内容预览1

日期：2026-10-30。仅本地审核，未提交、未推送、未部署。

## 版本与范围

- 基线：e7ed0dcee365d8c8e99472fada9d4828b9149e0f。
- 分支：codex/headcanon-deep-content。
- 目录：C:/Users/Freeman/Documents/New project/output/headcanon-deep-content-review。
- 入口：http://127.0.0.1:3018/guides/headcanon-generator-prompts。
- 启动：DEEP_CONTENT_REVIEW=1，Next dev --webpack，127.0.0.1:3018。
- 页面标题、顶部版本栏、design/versions.json 使用同一版本名。
- 之前的预览目录保留。现有正式站及支付、积分、模型配置不变。

## 审核页面

| 页面 | 本轮变化 |
| --- | --- |
| /guides/how-to-write-a-character-headcanon | 三组原创输入、初稿、问题诊断、改稿、短场景与解释；OOC 修改表和检查项 |
| /guides/relationship-headcanon-ideas | 三种情境分别比较友情、恋爱、竞争，合计九个案例 |
| /relationship-headcanon-generator | 三个不同的短案例；精简重复字段说明；链接完整指南 |
| /guides/how-to-create-an-oc-headcanon | 同一个 OC 的起始事实、六字段工作表、后续场景和连续性记录 |
| /fandom/jujutsu-kaisen/gojo-satoru | 两个官方来源、适用版本、解读与原创场景分层；四个不同方向的设定 |
| /guides/headcanon-generator-prompts | 新增十组真实字段示例，复制及载入既有表单；240 字符 Scene 限制 |

新指南通过指南索引、首页指南列表、More options、相关指南、关系工具页和站点地图获得内链。
未新增 ship/couple/OTP 等同义词页面，未虚构多人功能、输出格式、剧透过滤或原作验证能力。

## 文案处理

按 humanizer 流程逐段复核。删除旧指南泛泛而谈的重复段落，以及 Gojo 页重复的孤独、玩笑和眼罩解释。
保留具体动作、不同角色的目标、场景后果。正文不反复自辩；原创示例署名集中在文末，角色页来源与解读各说明一次。
教学中的初稿问题保留，因为它们是改稿过程的一部分。必要的功能上限保留在对应 FAQ。
新增英文正文不使用破折号，不新增虚构数据、评价或作者资历。

## 来源核对

2026-10-30 实际读取官方页面，使用概括而非复制原文：

- https://jujutsukaisen.jp/character/shibuyajihen.php ：Gojo 是教师及培养下一代的目标。
- https://jujutsukaisen.jp/episodes/07.php ：第 7 集中将修行中的 Yuji 带至与 Jogo 的交战现场。

页面限定早期 TV 动画至第一季第 7 集；提前提示外链官网含后续篇章。教室道具、对话、习惯和四个延伸设定为本站原创示例。

## 验证与边界

- npm run test：25/25 通过。覆盖日期、Article/FAQ、canonical、sitemap、三组完整改稿、九个关系案例、工作表六字段和十组预填参数的真实 parser 往返。
- npm run lint、npm run typecheck、npm run build：执行结果见本轮交付。
- Chrome 桌面与 390 x 844 手机宽度检查：六个内容页面及指南索引各一个 H1，无页面横向溢出，无破图。
- 真实浏览器点击示例：Nell/Arun、Relationship、Romance / ship、Fluff 和完整 Scene 正确载入；未点击生成或购买。
- 复制按钮显示 Copied；自动化下载事件等待超时，下载落盘未确认，不将其算作通过。该按钮复用原有 WritingActions，无新增导出逻辑。
- 桌面三列表格在手机上转为逐行块状阅读，保留 table/row/columnheader/rowheader/cell 语义和标题。
- 预览主动 noindex；正式元数据使用真实域名。未申请 GSC 收录。
- 本地未启动 commerce Worker，因此 /api/state 返回 503；本轮不以它判断线上服务状态，也没有用正式账户或积分补测。

## 候选页面检查

另以无预览标记的本地生产构建执行 website-prelaunch-check 候选检查。
六个目标页面均返回 200，未发现该六页的 FAIL 或 blocking WARN。
优化告警包括既有 og:image 缺失、单语言 hreflang、图标链接的空文本判定，以及正文比例/关键词标题匹配提示；本轮不以堆词或扩充空段落消除分数提示。

整站检查 summary.blocking=true，不能据此声称完整发布门禁通过：

- 旧合同和路由发现把 /guides/[slug]、/fandom/[fandom-slug] 及角色占位路径按真实 URL 抓取，产生 404 和 sitemap 一致性告警。
- /share/[character-slug] 的占位页面触发内容量告警。
- 三个既有动态专题 URL 在检查器路由清单中缺失。

这些项目与本轮内容页的实际 200 响应分开记录。正式发布前应解决检查器的动态路由展开与门禁证据，不能复用本次结果宣称已获准上线。

## 浏览器截图

- output/deep-content-review-proofs/desktop-worked-example.png
- output/deep-content-review-proofs/mobile-relationships.png

运行日志保留在本目录 .next-preview.*.log，均不进入版本控制。截图属于本地审核证据。
