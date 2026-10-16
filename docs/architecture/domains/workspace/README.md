# workspace：本地组合查询

workspace 位于 `client-business-core/src/workspace/queries`，没有业务聚合、可编辑事实或云端模块。

| 查询 | 组合的公开来源 | 输出边界 |
| --- | --- | --- |
| get-today-workspace | planning 适用修订/保护；execution 事实/小计/覆盖；profile 观测；review 同日日结论 | 稳定身份、原基准、当前事实、目标分段、未知/覆盖/新鲜度 |
| get-plan-workspace | 目标、周草案、当前适用项目、审查和历史 | 不自动生成草案或发布，不用最新处方盖掉原基准 |
| get-review-workspace | 日/周根、组件、来源/范围确认、公开事实和计划快照 | 不新建第二个结论、不累加重复共享事实 |
| get-profile-workspace | 条件/身体摘要、客户端当前账户/用途快照 | 不读取密码/云端会话表，不强制健康字段 |

查询通过共享一致读取边界取得多域快照；必要时返回 readVersion/来源集合。普通只读投影可重建，但标为最新确认时必须即时核验。UI 布局、展开、导航和文案转换归 client-model/Screen，不进入 workspace。

同步状态由 local-runtime 单独提供，客户端 Gateway 将其与业务查询组合，不让 workspace 依赖 local-runtime 形成环。身份/AI 技术状态通过显式 OnlineGateway 获取，业务页面默认本地。

追溯 UC-COM-008/011、UC-FIT-008/022。验收 WS-N01：今日/复盘同根与 factId；WS-N02：共享摄入/睡眠总览只计一次；WS-N03：离线与保存后订阅刷新；WS-N04：单位/未知/覆盖和局部用途范围保持。全部未实施；页面交互另按[页面地图](../../../engineering/page-map.md)验证。
