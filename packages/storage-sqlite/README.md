# storage-sqlite

状态：已实现账户隔离的原子状态仓储与代际比较，同连接 BEGIN IMMEDIATE 事务由 SqlitePort 注入。真实 SQLite 文件的保存、重启、跨客户端同步已验证。SQLCipher/Keychain 连接尚待 iOS 平台装配，不将 SQLite 测试称为加密设备验收。

职责：本地 SQLite/SQLCipher 仓储、事务、映射与升级。

依赖边界：本地端口/结构；SQLCipher/Keychain 平台连接由 mobile 注入。

[工程约束](../../docs/engineering/dependency-rules.md) · [领域设计](../../docs/architecture/domains/README.md) · [未来检查](../../docs/engineering/quality-gates.md)
