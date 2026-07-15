# 内容字段与审核约定

这份约定让网页、小程序、云数据库和未来内容后台使用同一套字段。当前网页数据已经覆盖基础字段；新增字段可从云端后台开始补齐，不必立即回填历史内容。

## 项目 programs

必须保留：

- `id`：稳定唯一标识，用于跨端跳转和云端更新。
- `rank`、`region`、`country`：排序与筛选。
- `school`、`schoolCn`、`program`、`programShort`：列表与详情展示。
- `length`、`tuition`、`location`、`ielts`、`toefl`、`gre`、`portfolio`、`deadline`：申请比较。
- `website`、`note`、`lastVerified`：官网核验与时效管理。
- `tags`、`stem`、`stemNote`：快速筛选。

建议新增：

- `status`：`published`、`reviewing`、`archived`。
- `verifiedBy`：最后核验者。
- `nextReviewAt`：下次检查日期，优先用于截止时间与语言要求。
- `updatedAt`：内容更新时间。

## 案例 caseStudies

当前公开字段：

- `id`、`region`、`school`、`schoolCn`、`program`、`result`、`year`。
- `background`、`diy`、`gpa`、`language`、`work`、`internships`。
- `admits`、`tags`、`summary`、`story`。

每个新投稿必须新增审核字段：

- `status`：默认 `draft`，审核后才可 `published`。
- `visibility`：`anonymous`、`schoolOnly`、`public`，决定可展示程度。
- `consentPublic`：投稿者确认允许公开。
- `contactPermission`：是否允许你回访或补充提问。
- `submittedAt`、`updatedAt`：运营追踪。

避免保存身份证号、地址、私人联系方式、完整成绩单、未经允许的作品集链接等不必要的个人信息。

## 笔记 articles

必须保留：

- `id`、`category`、`title`、`excerpt`、`date`、`readTime`、`body`。

建议新增：

- `status`：`draft`、`published`、`archived`。
- `cover`：未来如果添加封面图，保存云存储文件 ID，而不是临时链接。
- `updatedAt`、`publishedAt`：排序与更新提示。
- `relatedProgramIds`、`relatedCaseIds`：让文章可以关联回项目和案例。

## 更新规则

1. `id` 一经发布不再改动。
2. 删除内容时优先改为 `archived`，不要直接物理删除。
3. 云端集合对客户端关闭写入，所有发布动作经由后台或受限云函数完成。
4. 项目更新优先覆盖截止日期、语言要求、学费和官网链接；每次更新都刷新 `lastVerified`。
