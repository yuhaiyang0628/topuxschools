# 小程序内容后台

内容后台是一个不出现在底部导航的管理页面。只有管理员微信账号能在“答疑”页看到“运营后台”入口；所有新增、修改、下架都经由云函数完成，客户端没有数据库写权限。

## 已实现的能力

- 项目、案例、文章的列表、新增、修改和下架。
- 案例保存时自动生成最终选择标题、Offer / 拒信状态、地区、搜索词、稳定 `id` 与 `_id`。
- 下架是 `archived`，不会物理删除，随时可恢复。
- 管理员保存成功后先写入云数据库；网页同步失败不会回滚已保存的云端内容。
- 配置 GitHub 环境变量后，云函数会提交对应 `content/*.js` 文件；现有 Netlify Git 集成会自动发布网页。也可额外配置 Build Hook。

## 第一次启用管理员

1. 在微信开发者工具中，对 `cloudfunctions/content` 右键，选择“上传并部署：云端安装依赖”。
2. 编译小程序，打开“答疑”页；在开发者工具 Console 中找到日志 `Current admin identity`，其中的 `openId` 就是当前微信账号的管理员标识。
3. 云开发控制台打开“云函数 → content → 函数配置 → 环境变量”，新增：

   ```text
   ADMIN_OPENIDS=你的 openId
   ```

   多位管理员可用英文逗号分隔。保存后重新编译小程序；“答疑”页会出现“运营后台”按钮。

不要把 OpenID 写进小程序代码。云函数通过 `cloud.getWXContext()` 获得调用者身份，客户端无法伪造该值。[CloudBase 的小程序云函数身份说明](https://docs.cloudbase.net/recipes/add-cloud-function-wechat-miniprogram)

## 自动更新网页

当前网站仍由 GitHub 内容源构建。因此，管理员保存后若要同步网页，需要在 `content` 云函数的环境变量中配置：

```text
GITHUB_TOKEN=GitHub Fine-grained Personal Access Token
GITHUB_REPO=yuhaiyang0628/topuxschools
GITHUB_BRANCH=main
```

`GITHUB_TOKEN` 仅授予该仓库的 `Contents: Read and write` 权限。它只能填在云函数环境变量中，绝不能放进 `data/config.js`、Git 仓库或聊天消息。CloudBase 环境变量可供函数以 `process.env` 读取，适合存放这类凭证。[CloudBase 环境变量说明](https://docs.cloudbase.net/cloud-function/function-configuration/env)

仓库被云函数提交后，Netlify 若已开启 Git 自动部署，会自动构建网站。若你希望额外强制触发构建，可再添加：

```text
NETLIFY_BUILD_HOOK=你的 Netlify Build Hook 地址
```

启用 GitHub 同步后，云数据库成为项目、案例和文章的内容唯一来源。不要同时在本地 `content/` 文件中手动修改同一条记录；需要在本地继续开发时，先从 GitHub 拉取最新改动。

## 运营注意

- 新案例的 Offer 学校请尽量输入项目库中的英文全称、中文名或已有缩写，例如 `CMU`、`UW`、`UCL`。系统会据此推导地区、国家和搜索词。
- `draft`、`reviewing`、`archived` 都不会公开展示；只有 `published` 对用户可见。
- “下架”不会物理删除。若以后确实需要永久删除，应先备份后在云控制台单独处理。
