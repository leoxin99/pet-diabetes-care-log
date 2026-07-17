# 专业资料发布治理

## 发布流程

`权威来源选题 → 中文原创摘要 → 主张/来源逐条映射 → 执业兽医审核 → 产品安全审核 → reviewed 发布 → 到期复审或 retired`

代码门禁位于 `packages/content/src/articles.ts`。只有同时满足以下条件的文章会出现在正式文章列表：

- `status === "reviewed"`；
- reviewer、reviewedAt、nextReviewAt 完整；
- 审核日期不晚于当前时间且复审日期未过期；
- 至少一个可追溯来源。

## 首批来源目录

- AAHA 犬猫糖尿病管理资料。
- AAHA 2026 猫糖尿病指南。
- MSD Veterinary Manual 犬猫糖尿病资料。
- Cornell Feline Health Center 猫糖尿病资料。

当前只展示来源导航，没有一篇正文通过专业审核。产品不按用户记录推荐文章，不提供治疗决策树、剂量计算或个体化解释。

## 审核证据

每篇文章发布前需保存：主张编号、中文主张、来源 URL、来源段落定位、审核者姓名/资质、审核日期、修改意见、下一次复审日期。社区帖子不能作为专业资料来源。
