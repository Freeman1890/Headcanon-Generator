# 两轮内页发布前检查

检查日期：2026-10-24。范围：三个作品专题、六个写作工具，以及相关已有页和生成后端。保留现有界面与 $9.90 / 100 积分包，不增加订阅。

## 已处理

- 统一 `cf:dry-run` 现在同时覆盖生成后端和 Pages 前端；`predeploy` 不重复运行后端检查。
- 前端 TypeScript 排除本地 `output` 验收产物，避免把临时 API 探针误编译进产品。
- 文本下载将临时链接加入 DOM，触发后移除。
- 原生成接口固定写死 Gemini，现按白名单读取 `KIE_MODEL`，正式配置选用 Kie 的 `deepseek-v4-1-flash`。保留旧 Gemini 协议以便受控回滚，不做自动跨模型回退。
- 对明确的、未收到输出或计费信号的 503，只在原 45 秒预算内重试一次；不重试网络超时、部分输出、已有输出用量或已计费响应。持续失败释放预留积分，重放原请求不会再调用供应商。
- 新模型使用 Kie 官方 Responses 接口，关闭额外思考，要求五条 JSON 结果，每条最多 800 字符。不发送该模型不支持的 `max_output_tokens`，不把字符约束称为硬 token 上限。

## 模型决定与真实证据

用户已明确授权在 Kie 内选择成本不高于原方案的文本模型。

Kie 模型页在本次检查时显示：Gemini 兼容接口监控成功率 38%，Haiku 65%，DeepSeek 100%。这些是供应商自报的短时窗口，不是长期可用性保证。Gemini 实际调用遇到 503 和超时，Haiku 调用遇到 429，未将它们作为本次正式模型。

当前公开单价为每百万 tokens：

| 模型 | 输入 | 输出 |
| --- | --- | --- |
| Gemini 3.8 Flash | $0.225 | $1.125 |
| DeepSeek V4.1 Flash | $0.12 | $0.475 |

不按缓存、充值赠送或未确认折扣估算。DeepSeek 两项单价均更低，按相同输入输出量约比原示例成本低 55%。实际费用仍以使用量和供应商账单为准。

使用正式 Kie 密钥、最终服务端解析函数进行四次最小真实测试：

| 输出类型 | 有效结果数 | 输入 tokens | 输出 tokens | 供应商返回积分 |
| --- | --- | --- | --- | --- |
| 角色设定 | 5 | 408 | 177 | 0.03 |
| 场景前提 | 5 | 419 | 386 | 0.05 |
| 双人对话 | 5 | 436 | 376 | 0.05 |
| 剧情大纲 | 5 | 435 | 344 | 0.04 |

本次这些探针没有通过用户积分账户、创建支付、购买积分或发邮件。它们消费了少量现有 Kie 额度，不代表完成了真实付款验收。样本为原创虚构人物及一般受众场景；五结果结构、去重、长度和不返回思考内容均通过最终解析器。

官方来源：
- https://kie.ai/gemini-3-8-flash?model=gemini-3-8-flash-openai
- https://kie.ai/claude-haiku-5-5
- https://kie.ai/deepseek-v4-1-Flash
- https://kie.ai/api/docs-proxy/market/deepseek-v4-1-flash?theme=light

## 页面与门禁

使用已安装上线前检查的原始 `run_page_checks` 和 `summarize`，直接检查 sitemap 中全部 35 个真实地址，不复制或放宽规则。结果为 blocking=false：1624 PASS、185 优化 WARN、90 NOT_APPLICABLE，无 FAIL。动态模板仍由完整源码门禁覆盖；没有把 `[slug]` 字面量伪装成应返回 200 的页面。

最终完整门禁、精确 commit、receipt、前后端 Cloudflare 构建记录与正式域名验收保存在本地 `output/content-review/`。只能在这些证据齐全后声明已上线。

浏览器下载事件曾未返回：下载链接的 DOM 处理已改善，但不能将未确认落盘写成已完成端到端下载验收。已有两轮桌面、手机和表单证据保留；本轮不改版式。剩余纯优化提示不会通过堆文案或虚构信息消除。

## 正式发布合同

- 仓库：Freeman1890/Headcanon-Generator，生产分支 main。
- Pages：headcanon-generator；根目录为空；构建 `npm run cf:build`，产物 `.vercel/output/static`。
- 后端：headcanon-commerce；根目录 `/commerce`；构建 `npm run build`，部署 `npm run cf:deploy`。
- 前端服务绑定 `HEADCANON_COMMERCE` 指向该后端；两项均由同一 main 提交触发 Cloudflare Builds。
- 正式域名：https://headcanongenerator.run；www 永久跳转并保留路径和查询。
- 回滚基线：main a153ad8b9030985728b087e82f687233fe916179；Pages 8b292bc7-f664-4dc4-97a3-7b044dceed6e；后端 7376f7d6-a5c0-441b-b2ab-01d762f98848。
- 不使用本地 Wrangler 生产部署，不提交 GSC。
