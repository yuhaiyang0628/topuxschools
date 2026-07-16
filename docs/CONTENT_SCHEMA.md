# 内容字段与审核约定

这份约定让网页、小程序、云数据库和未来内容后台使用同一套字段。当前网页数据已经覆盖基础字段；新增字段可从云端后台开始补齐，不必立即回填历史内容。

## 项目 programs

必须保留：

- `id`：稳定业务标识，用于跨端跳转。
- `_id`：数据库稳定主键，由同步脚本自动生成（格式为 `program-<id>`），用于 CloudBase Upsert；发布后不可修改。
- `rank`、`region`、`country`：排序与筛选。
- `school`、`schoolCn`、`program`、`programShort`：列表与详情展示。
- `length`、`tuition`、`location`、`ielts`、`toefl`、`gre`、`portfolio`、`deadline`：申请比较。
- `website`、`note`、`lastVerified`：官网核验与时效管理。
- `tags`、`stem`、`stemNote`：快速筛选。

建议新增：

- `status`：`published`、`reviewing`、`archived`。只有 `published` 会公开展示；其他状态会从网页和小程序隐藏，但保留历史记录。
- `verifiedBy`：最后核验者。
- `nextReviewAt`：下次检查日期，优先用于截止时间与语言要求。
- `updatedAt`：内容更新时间。

## 案例 caseStudies

当前公开字段：

- `id`、`_id`、`year`、`title`：业务标识、数据库稳定主键、申请季与“最终选择学校简称 + 项目简称”标题。案例的 `_id` 格式为 `case-<id>`。
- `selected`：最终选择的学校 Tag 与项目 Tag。最终选择必定也是一项 Offer。
- `outcomes`：每个申请学校的状态 Tag；`selected`、`offer`、`rejected`、`pending` 分别对应深绿色、浅绿色、红色与灰色。
- `regions`：由 Offer 与最终选择推导出的地区数组。一个案例可同时属于多个地区。
- `background`、`gpa`、`language`、`applicationMethods`：公开背景信息和六种作品集／文书申请方式。
- `supportServices`：例如选校服务等内部保留服务记录，当前不作为公开筛选标签。
- `searchTerms`：学校全称、中文名、缩写、国家和最终选择项目全称／缩写的搜索索引。拒信不会进入该索引。
- `CASE_TAG_CATALOG`：由项目库自动生成的学校与项目独立 Tag 池，供未来内容后台录入使用；它不限制学校和项目的任意组合。

录取案例的搜索规则：

1. 学校和国家只要出现在 Offer 或最终选择中，就应命中案例；拒信不应影响搜索结果和地区归属。
2. 所有 Offer 目前只展示学校 Tag，避免卡片因学校与项目成对展示而过于拥挤。
3. 项目 Tag 仅用于最终选择标题，但应同时保存全称、缩写和常用关键词，以支持部分关键词搜索。
4. 申请列表中未出现在 Offer 且未标记为 `pending` 的学校，才记录为 `rejected`。

每个新投稿必须新增审核字段：

- `status`：默认 `draft`，审核后才可 `published`；只有 `published` 会公开展示，`draft`、`reviewing`、`archived` 都会自动从两端隐藏。
- `visibility`：`anonymous`、`schoolOnly`、`public`，决定可展示程度。
- `consentPublic`：投稿者确认允许公开。
- `contactPermission`：是否允许你回访或补充提问。
- `submittedAt`、`updatedAt`：运营追踪。

避免保存身份证号、地址、私人联系方式、完整成绩单、未经允许的作品集链接等不必要的个人信息。

## 笔记 articles

必须保留：

- `id`、`_id`、`category`、`title`、`excerpt`、`date`、`readTime`、`body`。文章的 `_id` 格式为 `article-<id>`。

建议新增：

- `status`：`draft`、`published`、`archived`。
- `cover`：未来如果添加封面图，保存云存储文件 ID，而不是临时链接。
- `updatedAt`、`publishedAt`：排序与更新提示。
- `relatedProgramIds`、`relatedCaseIds`：让文章可以关联回项目和案例。

## 更新规则

1. `id` 与 `_id` 一经发布不再改动。
2. 删除内容时优先改为 `archived`，不要直接物理删除；同步并以 Upsert 导入后，它会从两端隐藏。
3. 云端集合对客户端关闭写入，所有发布动作经由后台或受限云函数完成。
4. 项目更新优先覆盖截止日期、语言要求、学费和官网链接；每次更新都刷新 `lastVerified`。
