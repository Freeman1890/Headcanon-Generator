# 关键词内页预览1

日期：2026-10-24。状态：仅本地审核，未提交、推送或部署。

## 入口与范围

本地地址使用 127.0.0.1，避免本机 localhost 解析造成的导航超时。

| 页面 | 审核地址 | 搜索意图 |
| --- | --- | --- |
| Naruto | http://127.0.0.1:3010/fandom/naruto-headcanon-generator | 火影忍者角色的同人习惯、日常与关系灵感 |
| Danganronpa | http://127.0.0.1:3010/fandom/danganronpa-headcanon-generator | 弹丸论破角色日常、校园 AU 与关系灵感 |
| PHIGHTING! | http://127.0.0.1:3010/fandom/phighting-headcanon-generator | 角色的队伍日常、装备习惯与搭档灵感 |
| 关系页 | http://127.0.0.1:3010/relationship-headcanon-generator | 友情、配对、情侣、对手等同一大类关系需求 |
| OC 页 | http://127.0.0.1:3010/oc-headcanon-generator | 原创角色设定 |
| 多角色页 | http://127.0.0.1:3010/multiple-character-headcanon-generator | 两个人物的互动；明确当前不支持整队批量生成 |
| 主工具 | http://127.0.0.1:3010/ | 保留原有三种模式和主要操作 |

新专题各有 3 条原创示例、3 个场景开头、3 条问答与来源说明。示例标明为同人创作，不冒充官方设定。没有新增逐角色薄页面。

首页、关系页、OC 页、多角色页、随机角色页、写作提示页和关系指南已同步调整文案与内链。random / AI / ship / couple / two people 等近义表达不各建一页；friendship / fluff / scenario 通过可选参数承接。竞品品牌导航、NSFW、版本号词和无法辨认的截图词不纳入本轮新页。

本轮是基于用户已批准方向的内容实现，不等于已完成实时 SERP、KGR 或排名机会验证。

## 功能与风格

- 保留白底、灰色正文、靛蓝操作色和既有导航、输入表单、结果流程。新设置使用折叠区，不替换主要交互。
- 关系类型支持 Any / Friendship / Romance / Rivals；语气支持 Any / Fluff；Scene 上限 240 字符。
- 新参数进入真正的服务端提示词，校验后才可能调用模型和扣积分。默认请求仍保持旧的规范化输入结构，不改变已有幂等请求哈希。
- 角色入口只预填姓名、作品和场景，不自动生成、不扣积分。明确指定新作品的入口不会混入旧草稿的人物。
- 新内容及修改后的说明按 humanizer 润色，保留事实和不确定性，不堆同义词、夸大效果或声称保证不剧透。
- 三个新地址含完整主题词。Title、H1、描述、canonical、Open Graph、CollectionPage / BreadcrumbList / FAQPage 与首页入口已配置。sitemap 通过既有 FANDOM_HUBS 映射自动收录新地址。

## 验证证据

- `npm run prelaunch`：通过。前端 7 项测试、ESLint、TypeScript，后端构建、绑定类型生成、TypeScript 与 7 项测试通过。
- 后端测试用真实本地 Worker 和模拟供应商响应，覆盖新参数传递、非法参数拒绝、计费、请求重放、失败返还和账户隔离。没有真实支付、发信或 Kie API 消耗。
- `npm run cf:build`：Cloudflare Pages 适配目标已成功构建；这是本地构建，不是部署。
- Chrome 实测：三个专题、三组角色入口、草稿恢复、新作品清空旧人物、模式与参数选择；桌面 1440px、手机 390px/375px。375px 的长按钮溢出已修复。
- 浏览器连接在收尾截图与恢复默认 viewport 时超时，未能确认默认尺寸恢复或最终标签停留状态。已有截图与交互证据保留，本地审核 URL 可直接打开。
- 最终目标构建的首页 HTML 没有审核版本栏或 noindex，包含新增作品入口；生成的 sitemap 共 29 个 URL，包含三个完整主题词新地址。
- 审核截图与日志：`output/keyword-review/`，不纳入 Git。

## 不能混淆的检查状态

候选页面检查保留原始结果于 `output/keyword-review/onpage-review.json`。该检查的 summary 为 FAIL，不能当作已通过发布门禁。原因分开处理：

1. 本地审核主动开启 `KEYWORD_REVIEW=1`，添加中文版本栏与 noindex；与正式合同的可收录意图不同。这不是正式站已被改成 noindex。发布构建不能开启此变量。
2. 检查器把 `[fandom-slug]`、`[character-slug]` 和 `[slug]` 模板字面量当成真实 URL，产生 404、sitemap 不一致和分享页内容量告警。这些不是新增专题实际地址的响应结果；发布前仍需用具体验收 URL 解决检查范围，不能忽略门禁结果直接发布。
3. 开发模式冷编译的响应时间不代表线上 CWV。存在 OG 图片、单语言 hreflang、开发工具空锚点和文字/代码比等优化提示，本轮未为凑分改动既有设计。
4. Chrome 沉浸式翻译扩展曾向 html 添加 `data-immersive-translate-page-theme` 导致开发态 hydration 提示。沿用用户此前决定，不屏蔽提示、不更改浏览器扩展设置。
5. 当前环境拒绝了生产模式本地 `npm run start`；没有绕过该限制。浏览器证据来自开发预览，生产证据仅为目标构建成功。

真实模型是否始终遵循友情、语气或剧透边界仍需后续付费样本确认，不做保证。正式域名、抓取、支付与线上新参数均未在本轮发布验收。

## 内容来源边界

- Naruto 官方角色背景：https://naruto-official.com/en/news/01_1743
- Danganronpa 官方简介：https://www.danganronpa.com/pages/sp/en/
- Danganronpa 官方角色名录：https://www.danganronpa.com/reload/character/dangan01.html
- PHIGHTING! 角色资料：https://phighting.wiki/Sword 与 https://phighting.wiki/Boombox/Dialogue

资料用于名称和背景核对，不用于证明原创示例中的习惯。PHIGHTING! 部分 wiki 直连返回 403，使用可读页面和索引片段核对基础人物信息，没有绕过访问限制，也未据此增加复杂设定或数值结论。

## 隔离与后续

当前改动在独立 `codex/headcanon-keyword-pages` 工作树，基于已发布的 a153ad8。原始 D 盘项目已有改动和上一付费工作树均未覆盖。依赖版本不升级，本地缺少模型/邮件/收款密钥且业务开关关闭。

审核通过后才按 deploy-site 的 GitHub main → Cloudflare Builds → 正式域名链路发布，并重新做正式构建候选门禁与线上验收。本文件不是发布许可或成功上线凭证。
