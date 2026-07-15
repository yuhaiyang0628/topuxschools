# Top UX Schools 微信小程序

这是与网页共用内容字段的小程序工程。项目、案例和笔记在没有 AppID 或云环境时也能读取本地内容，因此可以先完成界面和内容验证。

## 本地内容模式

1. 在项目根目录运行 `node scripts/build-miniprogram-content.mjs`。
2. 用微信开发者工具导入 `miniprogram` 文件夹。
3. 当前 `project.config.json` 使用 `touristappid`，用于未接入正式 AppID 前的本地预览。

网页内容更新后，重新运行同步脚本即可刷新以下文件：

- `data/content.js`：小程序本地内容。
- `seed/programs.json`：云数据库项目种子数据。
- `seed/caseStudies.json`：云数据库案例种子数据。
- `seed/articles.json`：云数据库笔记种子数据。

## 接入云开发

等创建好云开发环境后，在 `data/config.js` 中填写环境 ID，并把 `contentMode` 改为 `cloud`。然后在微信开发者工具中部署 `cloudfunctions/content`，创建并导入三个集合：`programs`、`caseStudies`、`articles`。

小程序页面统一通过 `services/content.js` 访问内容。它会优先调用云函数；开发时云端暂时不可用则回退到本地内容，方便继续验证界面。

详细交接步骤见 [../docs/MINIPROGRAM_HANDOFF.md](../docs/MINIPROGRAM_HANDOFF.md)。
