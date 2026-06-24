# Top UX Schools

Top UX Schools 是一个静态网站 MVP，用来整理、筛选和展示 HCI / UX / Human-Computer Interaction 相关项目。

- `index.html`: 页面结构
- `styles.css`: 视觉样式
- `programs.js`: 项目数据
- `app.js`: 筛选、搜索、详情面板交互

## 本地预览

直接打开 `index.html`，或在项目根目录运行：

```bash
python3 -m http.server 4173
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

- `mailto:hello@example.com` 改成你的咨询邮箱或表单链接。
- `programs.js` 中的项目数据需要逐条按官网校验。
- 首页品牌名如仍为 `HCI COMPASS`，需要替换成最终站名。
- 检查移动端导航、筛选、搜索和详情面板是否正常。
