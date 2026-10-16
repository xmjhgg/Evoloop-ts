# profile：本地命令、查询与变化

共同信封/事务见[本地协议](../../02-local-transactions.md)。以下是目标稳定命令名，commandVersion 初始化时登记；不是云端 HTTP 路由。

| 命令/查询 | 关键输入 | 输出与变化 |
| --- | --- | --- |
| profile.condition.edit | expectedVersion、section、updateMask、typed values | profile/section version、revisionId、changed；CONDITIONS token |
| profile.measurement.create/correct/remove | 观测时间、指标/单位；纠正/删除带 factId/expectedVersion | 同 factId 最新修订；旧新日 BODY_DAY |
| profile.body-state.create/correct/remove | 日期/时间、自述；预期版本 | 日期槽及状态修订；冲突无部分提交 |
| get-condition-snapshot | category、CURRENT_FOR_PLANNING 或 HISTORICAL_AT | 所需分区及不可变引用、token、未知/缺失 |
| get-body-observations | 日期范围、类型、游标 | 带单位/时间/覆盖的事实与空日 token |
| get-profile-history | 对象、修订或历史时间 | 当前指针及只读历史，不套当前条件覆盖旧计划 |

创建事实的 ID 由注入 ID 源生成并在本地意图中固定，重试/重放不重新生成不同事实。读取时核验账户归属和用途范围；跨账号不泄露对象。条件和观测变化通过本地 ProfileConditionsChanged/BodyObservationChanged 通知，但最终发布/确认仍直接验证 token。

VERSION_CONFLICT、BODY_STATE_DAY_OCCUPIED、EMPTY_MEASUREMENT、EMPTY_BODY_STATE、FIELD_NOT_APPLICABLE 是本地业务/输入错误；Gateway 转成字段/冲突提示，不伪装 HTTP 保存失败。不因云端断网拒绝已初始化账户的合法本地手工保存。
