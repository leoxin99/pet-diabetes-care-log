# 糖宠照护

面向糖尿病犬猫家长的 local-first 照护记录工具：用较少步骤记录已经发生的进食、测量、治疗与日常观察，并整理为便于复诊沟通的事实材料。

> 糖宠照护用于记录、整理和沟通辅助，不提供诊断、治疗方案或个体化治疗量建议。宠物健康与治疗问题请咨询执业兽医。

当前版本：`0.7.0-alpha.1`。犬猫记录主流程已实现；专业资料、微信小程序和社区仍处于带发布门禁的原型阶段，尚未完成真实用户测试或兽医审核。

![糖宠照护今日页](docs/assets/today-desktop.png)

## 已实现能力

- 犬猫多宠档案、当前宠物切换，以及记录、计划、趋势、分析、CSV 和报告按 `petId` 隔离。
- schema v0.5 与 `v0.3 → v0.5` 无损迁移；旧键保留用于回滚。
- 通用已执行治疗记录：胰岛素、口服药和其他治疗均需主动确认，不预填名称或治疗量。
- 自定义日期与记录类型筛选；“有记录日期覆盖”只描述数据，不代表健康或照护评分。
- 资料库审核门禁：只有来源可追溯、兽医已审核且未过复审期的原创摘要可公开；当前没有正式文章。
- 邀请制社区治理原型：新帖统一待审，高风险医学表达不可提前公开，提供收藏、举报和作者删除演示。
- Taro 微信小程序技术原型：今日、记录、14 天事实摘要和资料四页可编译，照护记录默认只写本机微信存储。

## 本地运行

```bash
npm install
npm run dev
```

微信小程序原型：

```bash
npm run typecheck:weapp
npm run build:weapp
```

然后在微信开发者工具中导入 `apps/weapp`，项目配置使用 `touristappid`，不代表已有正式 AppID 或发布资格。

## 验证

```bash
npm run lint
npm run safety
npm run audit:web
npm test
npm run build
npm run test:e2e
npm run typecheck:weapp
npm run build:weapp
```

最新事实结果见 [测试报告](docs/test-report.md)。Web 生产依赖审计为 0 漏洞；小程序原型的 Taro 上游依赖仍有未解决安全告警，因此不得提交正式发布。

## 数据与隐私

- Web 照护数据保存在 `localStorage` 键 `pet-diabetes-care-log:v0.5`；旧 `v0.3` 键迁移后不删除。
- 小程序照护数据保存在本机微信存储，不因使用资料或社区自动上传。
- 社区本机治理原型使用独立存储键，不读取或拼接照护记录。
- 无广告、分析 SDK 或真实健康数据；Demo 全部为合成数据。

## 工程结构

```text
apps/weapp                 Taro + React 18 小程序原型
packages/domain            v0.5 schema、筛选、分析纯函数
packages/content           资料内容契约与审核门禁
packages/platform-adapters Web / WeChat 存储适配契约
src                        React 19 + Vite Web 应用
docs                       研究、审核、治理与交接证据
```

更多信息：

- [架构与数据流](docs/architecture.md)
- [用户任务测试方案](docs/user-task-test-protocol.md)
- [兽医字段审核矩阵](docs/vet-field-review.md)
- [资料发布治理](docs/content-governance.md)
- [小程序可行性](docs/weapp-feasibility.md)
- [社区治理](docs/community-governance.md)
- [交接与 checkpoint](docs/handoff-2026-07-17.md)

## 未完成 Gate

- 6 名犬猫照护者任务测试与 2 名专业审核者尚未招募完成。
- 猫专属临床字段和正式资料文章不得在兽医签署前加入。
- 小程序未完成开发者工具导入、iOS/Android 真机、主体、类目、备案和隐私审核。
- 社区没有真实账号、CloudBase、图片安全能力、运营 Owner 或 20–30 人邀请测试。
