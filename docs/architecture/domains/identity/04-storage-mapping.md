# identity：Java 私有存储设计

以下为目标逻辑表，不是已生成迁移；新 MySQL 库独立于旧业务库。

| 表 | 关键字段 | 键与约束 |
| --- | --- | --- |
| account | account_id UUID、status、access_version BIGINT、created_at/updated_at UTC | PK account_id；状态变更与会话限制事务一致 |
| password_identity | id、account_id、normalized_username、password_hash、hash_version、version | UNIQUE account_id 与 normalized_username；无明文密码 |
| wechat_identity | id、account_id、受控平台身份引用 | 平台身份唯一；按迁移清单建，不无依据新增绑定 |
| session | id、account_id、credential_digest、expires_at、revoked_at、device_id | 凭据摘要唯一；账户/到期索引，禁止原 token 普通存储 |
| access_grant | account_id、purpose、version、status、statement_version | 仅必要授权/访问记录；不保存领域事实/确认资格 |

字段长度、加密/哈希、过期/保留策略与精确 DDL 在初始化前核定；旧会话 TTL 不自动沿用为新承诺。账号关联可在云端模块内建必要约束，不给本地业务表建 MySQL 镜像。

原 idn_data_request/stage/export 等全链路状态只保留迁移审计，不直接迁为活跃云端流程。尚未完成的旧权利请求必须单列处理，不能因移除模块静默丢弃。
