# Top UX Schools

Top UX Schools 是一个面向中文申请者的 UX / HCI 申请资源库，包含学校列表、录取案例、干货笔记和交流入口。当前采用一个仓库管理 Web 与微信小程序两端。

- `web/`: Web 源码与页面入口
- `web/index.html`: 页面结构
- `web/styles.css`: 视觉样式
- `content/`: Web 与小程序共用的内容源
- `content/programs.js`: 项目数据
- `content/case-studies.js`: 录取案例数据
- `content/articles.js`: 干货笔记数据
- `web/notes.html`: 全部干货笔记页面
- `web/notes-page.js`: 干货笔记页面渲染
- `web/app.js`: 筛选、搜索、分页、卡片和详情面板交互
- `miniprogram/`: 微信小程序工程，复用现有内容字段
- `scripts/build-miniprogram-content.mjs`: 将网页数据同步为小程序本地数据和云数据库种子数据

## 目录结构

```text
topuxschools/
├── web/                                          # Web 源码
├── content/                                      # 两端共用的内容源
├── miniprogram/                                  # 微信小程序工程
├── scripts/                                      # 双端构建与同步脚本
└── docs/                                         # 字段、审核与交接文档
```

Netlify 使用 `netlify.toml` 执行 Web 构建，将 `web/` 和 `content/` 组装到 `dist/`，因此线上仍然从根域名提供 `index.html`。

## 内容维护

学校项目继续维护在 `content/programs.js`。新增内容时只需要在对应数据文件末尾复制一条对象，再填写字段：

- 新增录取案例：编辑 `content/case-studies.js`，填写最终选择、Offer／拒信状态 Tag、背景、成绩与申请方式。学校和国家搜索以 Offer 为准，项目搜索以最终选择项目为准。
- 新增笔记：编辑 `content/articles.js`，填写分类、标题、摘要、日期与正文段落。

首页案例默认显示全部区域，点击同一个区域标签可以取消筛选；案例页每页显示 6 条。首页干货笔记右侧的 `Read more` 会进入 `notes.html`，集中展示全部笔记。

这些文件采用“共享内容数据 + 两端页面渲染”分离的结构。网页直接读取 `content/`，小程序通过同步脚本生成本地数据或云数据库种子，不要直接编辑生成文件。

### 持续更新数据库

项目、案例和文章现在使用同一套增量更新方式。同步脚本会自动为每条内容生成固定 `_id`，并输出：

- 全量导入文件：`miniprogram/seed/programs.json`、`caseStudies.json`、`articles.json`。
- 单条更新文件：`miniprogram/seed/programs/`、`caseStudies/`、`articles/` 中对应 `_id` 命名的 JSON 文件。

第一次采用这套机制时，三个云数据库集合需要分别以新的全量文件重新导入一次，并选择 `Insert`。之后不要再清空集合：新增或修改一条内容时，导入其单条文件并选择 `Upsert`；一次改很多条时，导入全量文件并选择 `Upsert`。需要下架时在内容源加入 `status: "archived"`，再用 Upsert 导入该条记录即可。

网页仍然需要把内容源变更推送到 GitHub，才会触发线上网站更新；小程序内容则通过相应的云数据库 Upsert 更新。

## 微信小程序

小程序工程已准备在 `miniprogram/`。在没有 AppID 和云开发环境时，可以使用本地内容预览；接入后可切换到云函数和云数据库，方便持续更新案例和笔记。

```bash
node scripts/build-all.mjs
```

这条命令会同时生成 Web 的 `dist/` 和小程序的本地内容、云数据库种子数据。

详细交接见 [docs/MINIPROGRAM_HANDOFF.md](docs/MINIPROGRAM_HANDOFF.md)，字段约定见 [docs/CONTENT_SCHEMA.md](docs/CONTENT_SCHEMA.md)。
日常新增、修改、下架的操作步骤见 [docs/CONTENT_OPERATIONS.md](docs/CONTENT_OPERATIONS.md)。
管理员直接在小程序中维护三类内容的接入说明见 [docs/ADMIN_CONTENT_BACKEND.md](docs/ADMIN_CONTENT_BACKEND.md)。

## 本地预览

先在项目根目录生成 Web 产物：

```bash
node scripts/build-web.mjs
python3 -m http.server 4173 --directory dist
```

然后访问：

```text
http://localhost:4173
```

## GitHub 工作流程

日常开发不要直接在 `main` 分支上改动。每次做一个明确任务时，从最新的 `main` 建一个新分支：

```bash
git pull origin main
git checkout -b feature/short-task-name
```

完成修改后检查变更：

```bash
git status
git diff
```

提交并推送：

```bash
git add .
git commit -m "Describe the change"
git push origin feature/short-task-name
```

然后在 GitHub 上创建 Pull Request，检查无误后合并到 `main`。

推荐分支命名：

- `feature/add-school-filter`
- `feature/school-detail-page`
- `fix/mobile-navigation`
- `content/update-program-data`
- `seo/add-sitemap`

## 发布建议

这个项目目前是纯静态网站，适合以下发布方式：

- GitHub Pages：最简单，适合早期公开预览。
- Netlify：适合绑定自定义域名和表单。
- Vercel：适合之后升级到 React / Next.js 时继续使用。

早期建议先用 GitHub Pages 或 Netlify。等网站结构稳定、需要更多动态页面或 SEO 控制时，再考虑迁移到 Next.js + Vercel。

## 上线前检查

- `hello@topuxschools.com` 改成你实际使用的咨询邮箱、表单链接或微信联系入口。
- `content/programs.js` 中的项目数据需要逐条按官网校验。
- 检查移动端导航、项目筛选、案例搜索和详情面板是否正常。
- 通过 `node scripts/build-all.mjs` 确认 Web 与小程序内容产物同时更新。
