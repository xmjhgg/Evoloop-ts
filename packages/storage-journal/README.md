# storage-journal

状态：已实现不可变状态段、规范摘要和原子提交标记；文件与跨写者锁由 JournalFiles 注入。真实文件写入、重启及段写完/标记未写时故障恢复已验证。当前保留旧段，不静默删除；微信原生文件系统与断电仍待真机验收。

职责：微信不可变事务段、校验和、检查点、索引、仓储与断写恢复。

依赖边界：本地端口/结构；文件 API 由 miniapp/platform/weapp 注入。

[工程约束](../../docs/engineering/dependency-rules.md) · [领域设计](../../docs/architecture/domains/README.md) · [未来检查](../../docs/engineering/quality-gates.md)
