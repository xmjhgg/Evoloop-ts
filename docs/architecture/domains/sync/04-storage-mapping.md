# sync：MySQL 容器与文件映射

| 目标表 | 关键字段 | 唯一/事务要求 |
| --- | --- | --- |
| sync_account_head | account_id、head_version、root_snapshot_id、updated_at | PK account；头锁与批次共同提交 |
| sync_batch | account_id、batch_id、sequence、expected_head、protocol/payload_version、canonical_payload、digest | UNIQUE account/batch 和 account/sequence；载荷不可变 |
| sync_receipt | account_id、batch_id、input_digest、outcome、stored_sequence/current_head、error_code | UNIQUE account/batch；保留原终态；不推进失败头 |
| sync_snapshot | snapshot_id、account_id、base_sequence、schema_version、manifest_digest、range、status | 只 COMPLETE 可读恢复；根唯一由 account_head 控制 |
| sync_snapshot_chunk | snapshot_id、chunk_no、digest、size、controlled_storage_key、status | UNIQUE snapshot/chunk；清单齐全后发布 |
| sync_attachment | account_id、attachment_id、digest、size、storage_key、status | 仅通用载荷；不解释 Meal/训练/复盘身份 |

BIGINT/精确值在 API 按字符串，MySQL 内部可用合适物理类型，溢出/精度需协议样本验证。JSON/BLOB 选择与大小/分块限制待定；不能把载荷逻辑表名拼接成 MySQL 业务表 CRUD。

文件先暂存和验摘要，数据库清单最后原子发布完整状态；崩溃残片按技术维护清理，不能让不完整内容成为恢复基线。基础备份/保留策略另定，不扩成业务备份模块。以上表尚无 DDL、事务实现或真实数据库证据。
