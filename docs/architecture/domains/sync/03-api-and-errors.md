# sync：目标 API 与响应

目标前缀 `/api/v2/sync` 与旧 `/api/v1/sync` 区分；协议最终冻结后再生成 OpenAPI，不原位改变旧接口含义。

| 方法/路径 | 请求 | 响应 |
| --- | --- | --- |
| GET /capabilities | 会话/客户端协议能力 | 支持协议/载荷版本、限制与当前头 |
| POST /batches | SyncBatch 不可变规范载荷 | STORED+sequence 或 CONFLICT+currentHeadVersion 或 REJECTED+code |
| GET /batches?afterSequence=... | 连续游标、有限范围 | PullEnvelope 列表、nextSequence、headVersion；缺保留段提示恢复基线 |
| POST /snapshots | baseSequence、结构版本、分块/范围清单 | 临时上传标识 |
| POST /snapshots/{id}/complete | 全部分块摘要与预期当前基线 | COMPLETE 或明确失败，未完整不得恢复 |
| GET /snapshots/{id} | 本人会话 | 完整清单/受控下载与附件完整性 |
| POST /roots | 首次导入来源摘要与初始完整快照 | 仅未建立同步根时初始化；语义实现前冻结 |

错误码建议：SYNC_VERSION_CONFLICT、BATCH_ID_REUSED、PAYLOAD_INVALID、DIGEST_MISMATCH、PAYLOAD_VERSION_UNSUPPORTED、SEQUENCE_UNAVAILABLE、SNAPSHOT_INCOMPLETE、ROOT_ALREADY_EXISTS、SESSION_EXPIRED、ACCOUNT_DISABLED。HTTP 状态与 code 映射在契约定稿时固定，客户端不得靠模糊文案判断重试。

所有者来自会话；即使请求携带 userId 也仅核对一致，不能切换目标账户。业务来源错误由客户端导入器报告，Java 不增加领域校验错误码/规则执行。
