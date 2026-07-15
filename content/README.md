# Shared Content

这里是 Web 与微信小程序共用的内容源。只编辑这三个文件：

- `programs.js`：学校项目
- `case-studies.js`：录取案例
- `articles.js`：干货笔记

网页直接加载这些文件。小程序通过项目根目录的同步脚本生成 `miniprogram/data/content.js` 和 `miniprogram/seed/*.json`，生成文件不要手工编辑。

内容更新流程：

1. 修改本目录中的源数据。
2. 运行 `node scripts/build-miniprogram-content.mjs`。
3. 同时检查 Web 和小程序预览。
4. 在同一个提交中提交源数据与生成结果。
