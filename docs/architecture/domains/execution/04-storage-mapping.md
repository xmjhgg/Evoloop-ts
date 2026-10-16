# execution：仓储与数据映射

来源为 [19 张旧可复制表字段基线](../../../migration/legacy-schema/execution.md)。事实/修订、原基准引用、训练动作/组、学习片段、睡眠、餐、草案、食物行/份量/营养/照片证据及范围 token 保留。

| 仓储 | 本地约束 |
| --- | --- |
| ExecutionFactRepository | 强类型事实头/修订/明细；每事实只有一个当前指针，同账户引用完整 |
| FoodDraftRepository | 当前草案、输入指纹、图片集合及候选；确认事实唯一关联，修正绑定原 factId |
| IntakeQueryRepository | 只读当前有效确认摄入；同 factId 不重复、多目标引用去重；保留未知/单位 |
| ExecutionSourceRepository | FACT_DAY 的旧/新归属范围与 FOOD_DRAFT 独立更新 |
| AttachmentPort | 客户端业务关联和清单；文件由平台管理，不把临时上传 URL 当业务身份 |

行到领域的 mapper 留在 storage-*，不以 JSON 万能实体替代专属模型。SQLite/日志/IndexedDB 的主键、唯一确认、引用闭包和查询索引须等价。纠正移日的原保护链不删除，新日补充引用在同一事务建立。

旧 nutrition_lookup_job、导出/清理工作表不复制为新业务云模块；待处理来源与旧作业审计按迁移清单保全。照片原文与结构化关联分别校验，未含原文时备份/同步明确不完整。字段基线并不证明文件/SQL/IndexedDB 已实现。
