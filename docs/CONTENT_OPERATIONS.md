# 内容更新操作手册

项目、案例、文章的内容源都在 `content/`。网页直接读取这些内容源；小程序通过同步产物写入云数据库。因此，不要直接在云数据库里手动修改公开内容，也不要编辑 `miniprogram/data/content.js` 或 `miniprogram/seed/` 中的生成文件。

## 一次性迁移

旧集合中的记录由云数据库自动生成 `_id`，无法和新的稳定 `_id` 对齐。要启用 Upsert，三个集合各需要做最后一次完整迁移：

1. 仅删除并重新创建 `programs`、`caseStudies`、`articles` 三个集合，不要动其他云开发资源。
2. 分别导入 `miniprogram/seed/programs.json`、`caseStudies.json`、`articles.json`。
3. 三次导入的冲突处理模式都选择 `Insert`。
4. 在微信开发者工具重新编译，确认项目、案例、笔记都能读取。

之后不需要再清空这三个集合。

## 日常新增或修改一条

1. 在对应的内容源中新增或修改记录：项目用 `content/programs.js`，案例用 `content/case-studies.js`，文章用 `content/articles.js`。
2. 运行 `node scripts/build-all.mjs`。
3. 找到对应单条文件：
   - 项目：`miniprogram/seed/programs/program-<id>.json`
   - 案例：`miniprogram/seed/caseStudies/case-<id>.json`
   - 文章：`miniprogram/seed/articles/article-<id>.json`
4. 在云开发控制台打开对应集合，导入这一条文件，冲突处理选择 `Upsert`。
5. 微信开发者工具重新编译；网页端则把内容源变更提交并推送到 GitHub。

`Upsert` 会根据 `_id` 更新已有记录；没有相同 `_id` 时才会新增，因此适合单条日常维护。

## 一次修改多条

运行同步后，导入该集合的全量文件，并选择 `Upsert`：

- `miniprogram/seed/programs.json`
- `miniprogram/seed/caseStudies.json`
- `miniprogram/seed/articles.json`

## 下架与恢复

不直接删除已公开记录。在该对象中加入：

```js
status: "archived"
```

重新同步并以 Upsert 导入该条文件后，它会从网页和小程序隐藏，但数据库仍保留历史。恢复时把状态改回 `published`，重复同样的同步和 Upsert 即可。

`draft` 与 `reviewing` 也不会在公开网页和小程序中展示。内容源中未填写 `status` 的历史记录会按 `published` 处理。

## ID 规则

发布后不要修改内容的 `id`。同步脚本会自动生成数据库主键：

- 项目：`program-<id>`
- 案例：`case-<id>`
- 文章：`article-<id>`

新建记录时只需保证业务 `id` 在自己的集合内不重复；不要手动填写 `_id`。
