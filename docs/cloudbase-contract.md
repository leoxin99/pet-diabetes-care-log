# CloudBase 服务端契约草案

状态：设计草案，未创建云环境。

## 集合

- `communityProfiles`：微信身份映射、显示名、角色、状态。
- `posts` / `comments`：作者、物种、主题、正文、审核状态、风险标记与时间戳。
- `contentReports`：举报人、目标、原因、处理状态和 SLA 时间。
- `moderationActions`：操作者、目标、动作、原因和不可变时间戳。

## 云函数

- `submitPost` / `submitComment`：身份校验、长度校验、安全检查、统一待审。
- `toggleFavorite`：只能修改当前用户收藏关系。
- `reportContent`：创建举报；高风险类型立即隐藏目标。
- `deleteOwnContent`：仅作者或管理员可删除。
- `moderateContent`：仅 moderator/admin，必须写审核日志。
- `banProfile`：仅 admin，必须写原因和有效期。

## 权限原则

- 客户端只读已审核公开内容及自己的待审内容。
- 客户端不能直写 role、status、riskFlags 或 moderationActions。
- 照护记录集合不存在；社区云函数不接收本地健康时间线。
- 未完成主体、备案、隐私和运营 Gate 前，不创建生产环境或开放注册。
