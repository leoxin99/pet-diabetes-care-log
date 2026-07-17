# 微信小程序可行性结论

状态：技术原型可编译，正式发布不可行性 Gate 尚未解除。

## 已完成

- `apps/weapp` 使用 Taro 4.2.1 + React 18，Web 保持 React 19。
- 今日、记录、14 天事实摘要、资料四页已实现。
- 复用 domain/content 契约，并通过 `mini.compile.include` 转译共享 TypeScript。
- 本机微信存储保存档案与记录，不包含照护数据网络请求代码。
- 独立 TypeScript 门禁与 `taro build --type weapp` 通过。

## 平台替换

| Web 能力 | 小程序方案 |
| --- | --- |
| React Router | app/page config 与 tabBar |
| localStorage | WeChat storage adapter |
| Chart.js | 后续 Canvas 适配器 |
| Blob 下载 | 后续本机文件/长图能力 |
| window.print | 后续 Canvas 长图；云端 PDF 需单独授权 |
| React.lazy | 小程序页面配置，不直接复用 |

## 未完成与阻塞

- 未在微信开发者工具导入，未进行 iOS/Android 真机 smoke。
- Canvas 趋势图、长图导出、旧备份导入和首屏性能尚未完成。
- 使用 `touristappid`，主体、类目、域名、备案和隐私指引均未确认。
- Taro 上游依赖审计仍有 14 项生产告警（10 中等、1 高危、3 严重），正式提交被安全 Gate 阻塞。

## 建议考察顺序

1. 升级或替换存在告警的 Taro 依赖并重新编译。
2. 微信开发者工具完成四流程 smoke 与网络面板检查。
3. 在 iOS/Android 各至少一台真机验证离线、重启、犬猫切换和首屏性能。
4. 确认主体与类目后再评估 CloudBase、订阅消息和社区备案。
