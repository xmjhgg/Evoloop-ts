# planning：仓储与本地结构

来源为 [34 张旧可复制表字段基线](../../../migration/legacy-schema/planning.md)，保留目标、草案 manifest、项目修订、审查/意见、发布、保护、共享选择、调整依据和未来暂停历史。

| 端口 | 原子约束/索引目标 |
| --- | --- |
| GoalRepository | 同账户稳定目标与不可变 GoalRevision；状态生效历史不覆盖 |
| WeekPlanRepository | 唯一 account/goal/week；非空 slotKey 稳定项目；当前草案/发布指针显式 |
| PlanReviewRepository | 绑定完整草案/来源指纹、规则、渠道、意见与覆盖；不能手改状态获资格 |
| BaselineProtectionRepository | 稳定项目/用户日期总量保护、原/补充引用链；事实写入一起提交 |
| PlanningSourceRepository | 适用发布与保护的日/周来源，草案编辑不污染已适用计划 token |

跨域仅 ID/修订引用，不 ORM 级联装载 execution/review。字段级输入与旧唯一键见基线，原 MySQL 索引/可空唯一键不可原样声称三端可用；新实现使用稳定头/当前指针/唯一槽并验证。

批准的全局规则选择迁为客户端可识别的只读版本化策略/配置来源，不保留云端 MySQL 业务规则选择锁；批准流程和分发机制仍待明确，不能离线自行启用未批准参数。公开 FITNESS_RULES 版本参与审查指纹。

三存储适配对发布/事实竞争、首个摄入冻结、跨周睡眠保护、批次捕获原子性运行同一契约。新 SQL/索引和迁移未生成。
