# profile：本地仓储与结构映射

来源为 [16 张旧可复制表字段基线](../../../migration/legacy-schema/profile.md)。逐字段类型、可空性、主键、唯一键与同域引用保留在该基线；它不是新 SQLite DDL。

| 仓储端口 | 保存模型/约束 |
| --- | --- |
| ProfileRepository | 根、三类分区、完整修订与作息组件；user_id 根唯一；未改组件引用不变 |
| BodyMeasurementRepository | 稳定事实头、当前修订、观测值和部位；历史只追加，按日期/时间分页 |
| DailyBodyStateRepository | 日状态头/修订和账户日期唯一槽；纠正移槽原子检查 |
| ProfileSourceRepository | CONDITIONS/BODY_DAY 范围版本，空范围逻辑 0 |

SQLite 行映射、日志索引和 IndexedDB 索引必须实现同一强类型端口；Row 不进入 domain。每行保留 account/user 归属，根指针引用存在且同账户的修订。测量值不因 TEXT 物理存储而按字典序比较；单位、精度与未知独立。

事务覆盖根/修订/日期槽/token/回执/本地意图/变化批次。日状态移日冲突整体回滚。旧 profile 数据请求工作表不随原后端搬入本域，按[旧数据分类](../../../migration/old-to-new-map.md)保留迁移证据与待处理事项。

新物理结构、索引与升级需 data-schema 与三适配器在代码阶段确定并实测；本轮只有字段级迁移输入和端口设计，无建表或数据导入。
