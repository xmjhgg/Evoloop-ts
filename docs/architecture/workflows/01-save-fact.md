# 本地事实保存与原基准

```mermaid
sequenceDiagram
  actor U as 用户
  participant F as Feature/Gateway
  participant R as local-runtime
  participant E as execution
  participant P as planning
  participant T as 同一本地事务
  participant S as Java sync
  U->>F: 明确保存训练实际
  F->>R: 稳定本地命令与预期版本
  R->>T: 开始 UnitOfWork / 命令幂等核对
  R->>E: execute(tx, context, command)
  E->>P: 获取并保护发生时适用基准
  P->>T: 保存原修订引用及保护
  E->>T: 保存事实/修订/明细/来源与失效
  R->>T: 保存结果回执/意图/数据变化/待同步批次
  T-->>R: 可靠提交成功
  R-->>F: 本地已保存，返回事实身份
  F-->>U: 刷新本地查询
  R->>S: 空闲/前台/联网后异步上传批次
  S-->>R: 幂等存储回执
```

自主事实无基准时不创建假目标。任何本地写失败整体回滚，不单独提交保护或提前显示成功；云端断网/AI 失败发生在业务事务外，不回滚事实。纠正保留同 factId/原基准，旧新归属范围都变化，review 的相关确认需更新，未来计划保持。

验收目标：已发布计划 → 事实保存 → 原基准可追溯 → 相关结论需更新 → 重启可读 → 批次重试不重复。单纯自主训练成功不能替代该闭环。
