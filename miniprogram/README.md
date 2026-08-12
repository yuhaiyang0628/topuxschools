# Top UX Schools 微信小程序

这是与网页共用内容字段的小程序工程。正式环境使用云数据库，本地只保留有限内容作为开发时的降级预览，避免内容增长推高安装包体积。

## 本地内容模式

1. 在项目根目录运行 `node scripts/build-miniprogram-content.mjs`。
2. 用微信开发者工具导入 `miniprogram` 文件夹。
3. 当前工程已绑定正式 AppID，并连接 `data/config.js` 中的云环境。

网页内容更新后，重新运行同步脚本即可刷新以下文件：

- `data/content.js`：小程序本地内容。
- `seed/programs.json`：云数据库项目种子数据（JSON Lines 格式）。
- `seed/caseStudies.json`：云数据库案例种子数据（JSON Lines 格式）。
- `seed/articles.json`：云数据库笔记种子数据（JSON Lines 格式）。
- 内容更新默认使用一个集合级 JSON Lines 批次，并在云开发控制台选择 `Upsert`；避免逐条导入记录。

## 日常内容更新

同步脚本会为项目、案例、文章自动写入稳定数据库主键 `_id`，并默认写入 `status: "published"`。不要手动修改生成文件；只编辑 `content/` 内对应的内容源，然后运行同步脚本。

- 首次迁移：三个集合必须各自以最新全量 `seed/*.json` 文件重新导入一次，选择 `Insert`。这是为了让旧记录改用稳定 `_id`。
- 新增或修改一条：在云开发控制台导入对应的 `seed/<collection>/<id>.json`，冲突处理选择 `Upsert`。
- 一次修改多条：生成一个只包含新增或修改记录的 JSON Lines 文件，导入对应集合，冲突处理选择 `Upsert`。不需要替换或重导整个集合。
- 下架一条：在内容源该对象加入 `status: "archived"`，同步后以 `Upsert` 导入该条文件。记录会保留在数据库中，但网页与小程序不再显示。

同步脚本只会生成或更新文件，不会自动删除旧的单条种子文件；请以当前全量文件作为内容清单。

## 接入云开发

当前内容环境已经接通。首次部署收藏和匿名行为统计时，需要在云开发数据库创建以下集合：

- `userWorkspaces`：用户收藏、案例/笔记收藏与选校单。
- `analyticsEvents`：搜索、收藏、分享、主动查看联系方式与投稿埋点。

两个集合都应设置为“所有用户不可读写”，客户端只通过 `content` 云函数访问。`content` 云函数已部署时，创建集合后无需再次部署，重新编译小程序即可测试。`consultations` 只供历史咨询表单兼容使用，当前公开版本不需要创建。

当前公开版本不主动收集联系方式或申请背景。用户是否复制微信号、查看二维码并添加好友，完全由用户决定；如后续恢复表单或新增其他个人信息收集，再同步更新微信公众平台的《小程序用户隐私保护指引》。

主动联系入口统一读取 `data/config.js` 中的 `contactWechat`、`contactWechatQr`、`contactName` 和 `contactBio`。补充微信号后，将二维码图片放入小程序资源目录，并把包内路径（例如 `/assets/contact/wechat-qr.jpg`）写入 `contactWechatQr`；选校单、项目、案例、笔记和答疑页会同时更新。

## 文章图片

新增文章图片不进入小程序安装包。管理员在内容后台编辑文章时点击“添加配图”，图片会上传到 CloudBase 云存储，并在数据库文章记录中保存 `fileID`。小程序打开文章时由 `content` 云函数生成短期签名 HTTPS 地址，因此普通用户不需要获得云存储写权限。

如果云函数已经配置 `GITHUB_TOKEN` 和 `GITHUB_REPO`，同一张图片会自动写入 `web/assets/articles/cloud/<article-id>/` 并触发网页内容同步。网页使用 GitHub / Netlify 发布后的稳定资源路径，不依赖会过期的云存储临时链接。

现有 UW 和 TUD 系列图片是迁移前的历史兼容资源，位于 `article-package/assets/article-mini/` 文章分包。`scripts/build-article-images.mjs` 只处理白名单内的这 34 张图片，未来新增图片不会被打进小程序。`project.config.json` 继续排除高清图和 seed 文件。

云存储可以保持当前私有权限；写操作仅由管理员后台发起，读链接由云函数生成。部署更新后的 `content` 云函数后，管理员上传图片功能才会生效。

小程序页面统一通过 `services/content.js` 访问内容。它会优先调用云函数；开发时云端暂时不可用则回退到本地内容，方便继续验证界面。

详细交接步骤见 [../docs/MINIPROGRAM_HANDOFF.md](../docs/MINIPROGRAM_HANDOFF.md)。
