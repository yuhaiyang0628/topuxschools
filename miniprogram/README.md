# Top UX Schools 微信小程序

这是与网页共用内容字段的小程序工程。项目、案例和笔记在没有 AppID 或云环境时也能读取本地内容，因此可以先完成界面和内容验证。

## 本地内容模式

1. 在项目根目录运行 `node scripts/build-miniprogram-content.mjs`。
2. 用微信开发者工具导入 `miniprogram` 文件夹。
3. 当前 `project.config.json` 使用 `touristappid`，用于未接入正式 AppID 前的本地预览。

网页内容更新后，重新运行同步脚本即可刷新以下文件：

- `data/content.js`：小程序本地内容。
- `seed/programs.json`：云数据库项目种子数据（JSON Lines 格式）。
- `seed/caseStudies.json`：云数据库案例种子数据（JSON Lines 格式）。
- `seed/articles.json`：云数据库笔记种子数据（JSON Lines 格式）。
- `seed/programs/<_id>.json`、`seed/caseStudies/<_id>.json`、`seed/articles/<_id>.json`：每条内容各自的增量更新文件。

## 日常内容更新

同步脚本会为项目、案例、文章自动写入稳定数据库主键 `_id`，并默认写入 `status: "published"`。不要手动修改生成文件；只编辑 `content/` 内对应的内容源，然后运行同步脚本。

- 首次迁移：三个集合必须各自以最新全量 `seed/*.json` 文件重新导入一次，选择 `Insert`。这是为了让旧记录改用稳定 `_id`。
- 新增或修改一条：在云开发控制台导入对应的 `seed/<collection>/<id>.json`，冲突处理选择 `Upsert`。
- 一次修改多条：导入对应的全量 `seed/*.json`，冲突处理选择 `Upsert`。
- 下架一条：在内容源该对象加入 `status: "archived"`，同步后以 `Upsert` 导入该条文件。记录会保留在数据库中，但网页与小程序不再显示。

同步脚本只会生成或更新文件，不会自动删除旧的单条种子文件；请以当前全量文件作为内容清单。

## 接入云开发

等创建好云开发环境后，在 `data/config.js` 中填写环境 ID，并把 `contentMode` 改为 `cloud`。然后在微信开发者工具中部署 `cloudfunctions/content`，创建并导入三个集合：`programs`、`caseStudies`、`articles`。

小程序页面统一通过 `services/content.js` 访问内容。它会优先调用云函数；开发时云端暂时不可用则回退到本地内容，方便继续验证界面。

详细交接步骤见 [../docs/MINIPROGRAM_HANDOFF.md](../docs/MINIPROGRAM_HANDOFF.md)。
