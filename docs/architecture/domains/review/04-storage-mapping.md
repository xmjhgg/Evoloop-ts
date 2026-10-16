# review：仓储与结构

来源为 [26 张旧可复制表字段基线](../../../migration/legacy-schema/review.md)。保留 document/day/week subtype、组合修订/slot、不可变组件、typed 指标/覆盖/判断、人工修订、确认与当前头、来源 refs/tokens、生成关联和调整建议/提交。

| 仓储 | 约束 |
| --- | --- |
| DailyConclusionRepository | account/date 唯一，日 subtype 与 document 一对一 |
| GoalWeeklyReviewRepository | account/goal/week 唯一，周 subtype 与 document 一对一 |
| ReviewComponentRepository | 不可变组件/来源/人工引用；manifest 指向完整同账户内容 |
| ScopeConfirmationRepository | document/slot 当前确认头；组件替换清对应头，其他组件保留但查询仍核验 |
| AdjustmentSuggestionRepository | 原/新值、依据、逐周提交、防重复 patch 记录 |
| ReviewSourceRepository | DAILY/GOAL_WEEK 与 MANUAL 语义分开；空日逻辑 0 |

删除/纠正事实由原所有域更新 token；review 事务建立失效标识或查询即时发现过期，不能因为事件没消费继续返回最新确认。保留原人工条目，禁止 AI 结果全根覆盖。

generation_request/slot 在客户端只表示本地输入、组件和云端 taskId 的关联，云端供应商任务在 Java ai 自己的表中保存，不以此复制完整本地业务表。旧导出/隐私工作表按迁移清单保全审计，不带入首期业务云模块。

三存储均需验证唯一根、同事务确认/来源、无自我失效与引用闭包。物理迁移/查询索引尚未实现。
