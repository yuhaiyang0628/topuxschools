# HCI Programs Site

这是一个可以当天上线的静态 MVP：

- `index.html`: 页面结构
- `styles.css`: 视觉样式
- `programs.js`: 项目数据
- `app.js`: 筛选、搜索、详情面板交互

## 本地预览

直接打开 `index.html`，或在当前目录运行：

```bash
python3 -m http.server 4173
```

然后访问：

```text
http://localhost:4173
```

## 今天上线的最快方式

1. 注册或登录 Netlify。
2. 进入 Add new site。
3. 选择 Deploy manually。
4. 上传整个 `hci-programs-site` 文件夹。
5. 在 Domain settings 里绑定已经注册好的域名。
6. 到你的域名服务商后台，把 DNS 指向 Netlify 给出的记录。

## 上线前需要替换

- `mailto:hello@example.com` 改成你的咨询邮箱或表单链接。
- `programs.js` 中的项目数据需要逐条按官网校验。
- 首页品牌名 `HCI COMPASS` 可替换成你的最终站名。
