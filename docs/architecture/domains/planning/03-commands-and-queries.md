# planning：本地命令与公开能力

| 命令/查询 | 输入/前置 | 结果 |
| --- | --- | --- |
| planning.goal.create/patch | 类型、衡量、周期；expectedVersion | GoalRevision，不创建虚构周计划 |
| planning.week.patch-draft | weekStartDate、expectedVersion、逐项变更 | 新 DraftRevision，旧审查失效，生效指针保持 |
| planning.week.review | 最新草案、渠道、规则/来源指纹 | RULES 本地审查；AI 输入由客户端冻结，返回后另行接纳 |
| planning.week.accept-ai-candidate | 任务/输入摘要、草案/来源/规则版本 | 最新候选或 SOURCE_STALE；不发布 |
| planning.week.publish | selectedItemIds、expectedVersions、审查引用、显式确认 | 未来可调范围 Publication，不改保护范围 |
| planning.goal.pause/request-resume/archive | 预期版本、生效时点、影响范围 | 状态历史及明确项目影响；恢复不直接重新执行旧项 |
| planning.adjustment.merge | 最新确认 basis、逐项三方差异、用户冲突选择 | 新工作草案，需重新审查发布 |
| get-week-plan/get-plan-history/get-applicable-baseline | 目标/周/日期、历史引用 | 逐项生效修订、原基准、保护与覆盖 |
| protect-baseline / evaluate-fitness-restrictions | 同一 tx、事实时间/类型/范围；证据快照 | 稳定保护引用或显式冲突；策略评估 |

所有写用例遵守[本地共同协议](../../02-local-transactions.md)。protect-baseline 只作为可信本地应用协作能力，不直接暴露页面写库入口。与事实保存同一事务，不能提前独立提交。

SOURCE_STALE、REVIEW_REQUIRED、PROTECTED_RANGE、VERSION_CONFLICT、RULE_COVERAGE_INSUFFICIENT、INFORMATION_REQUIRED 均保留原草案/生效计划。发布必须再次实时验证 refs/tokens/策略和确认，不只信任缓存 READY 标记。

GoalChanged/PlanDraftChanged/PlanConfirmed/PlanItemLocked 为本地变化通知；不上传为 Java 可执行领域事件。网络只传最终数据批次或显式 AI 请求。
