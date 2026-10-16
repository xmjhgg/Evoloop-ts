# execution：本地命令、查询与错误

| 命令/能力 | 关键输入与结果 |
| --- | --- |
| execution.training.record/correct/remove | 状态、实际时间/时长/明细/感受；可选稳定计划引用；纠正同 factId/expectedVersion |
| execution.learning.record/correct/remove | 内容、同单位数量/片段、文字成果与真实日期，不填假健康字段 |
| execution.sleep.start/finish/record/correct/remove | 开始/真实起床、provisional 与版本；finish 不新建另一个事实 |
| execution.food-draft.create/patch/accept-candidate | 图片证据、个人说明、草案版本、输入摘要/来源；不产生摄入 |
| execution.intake.confirm | 显式本人确认、草案版本、个人份量/未知、原事实版本（纠正时） |
| execution.meal.remove | 误记 factId/expectedVersion；同事实退出小计一次 |
| get-facts/get-fact-history/get-intake-summary | 日期/类型/目标引用、游标；当前事实、原基准、覆盖/未知、所有空日 token |
| read-fitness-evidence | 自主/其他目标的适用证据与 TRAINING 空日 token，不回调 planning |

共同信封、幂等及事务见[本地协议](../../02-local-transactions.md)。保存训练/摄入时调用 planning.protect-baseline，与事实/修订/来源/失效/队列一并提交。客户端命令结果含 factId、version、revisionId、baselineRefs、影响日期与本地提交引用；同步状态独立查询。

本地 ExecutionFactChanged/Corrected/Removed/FoodIntakeConfirmed 通知 review 刷新；FOOD_DRAFT 变化不增加 FACT_DAY，也不使未受影响的摄入确认失效。返回 VERSION_CONFLICT、SOURCE_STALE、PORTION_REQUIRED、FACT_REMOVED、BASELINE_CONFLICT 等结构错误，UI 保留原输入。

AI 与营养外部调用都在事务外；结果接纳时重新核验输入、授权与版本。拒绝 AI/图片用途仍可手工保存；供应商失败不撤销可靠事实。Java 不提供上述命令 HTTP 接口。
