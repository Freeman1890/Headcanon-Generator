# 深度内容预览1：发布复查范围

2026-10-30，用户授权检查、修复并发布。此前审核记录是检查时的历史快照，最终门禁和线上结果保存在仓库外：
C:/Users/Freeman/Documents/New project/output/headcanon-deep-release-20261030。

## 已定位并修复

- 检查器将 Next App Router 动态模板误当作真实 URL。现在与 Pages Router 一致，只自动发现静态 URL；动态页面必须由项目合同提供具体地址。新增两项回归测试，检查器 49 项测试通过。没有降低页面索引、内容或 sitemap 检查要求。
- 本项目合同改为所有现有指南、作品聚合与角色示范页的具体路径。分享页通过既有 noindex 规则和回归测试处理，不把模板占位符提交给 SEO 抓取器。
- 为工作表导出增加确定性回归测试：点击处理器生成的 UTF-8 内容、文件名、临时链接与清理行为，以及空文本禁用状态。浏览器自动化的下载事件超时不作为产品导出失败的依据；浏览器实际落盘仍是手动验收项。

## 发布约束

- 正式域名：https://headcanongenerator.run/。
- 只通过本地 Git → GitHub main → Cloudflare Builds；Pages 前端和关联 commerce Worker 均核对精确提交。
- 本轮不修改模型、支付、邮件、数据库或密钥，不执行付款或付费生成。
- DEEP_CONTENT_REVIEW 只用于本地版本名、noindex 和独立开发缓存，生产不设置该开关。
- 统一门禁通过且 receipt 对应最终 commit/tree 后才推送。
- 既有 og:image、单语言 hreflang 和图标锚文本的优化提示不通过堆词或改写无关模板消除。

## 验收项

完整源码门禁包含前端测试、lint、类型检查，commerce 构建/类型/测试，以及 Cloudflare 目标构建和本地 provider dry-run。
候选页面复核 canonical、可索引状态、结构化数据、链接和具体路由，解析完整 summary.blocking。
发布后核对 main SHA、Pages 构建/域名绑定、关联 Worker 版本、HTTPS/永久跳转、六个改动页面、sitemap、robots 和匿名 /api/state。
最终结果由仓库外 gate、onpage、post-launch 和完成记录说明；本文件不预先宣称门禁或上线成功。
