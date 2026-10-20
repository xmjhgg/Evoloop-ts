# 架构设计

- [01 整体架构](01-system-architecture.md)
- [02 本地事务与跨域协作](02-local-transactions.md)
- [03 同步、冲突与恢复](03-sync-and-recovery.md)
- [领域设计总览](domains/README.md)
- [跨域流程](workflows/README.md)
- [ADR-001 Java 云服务](adr/ADR-001-java-cloud.md)
- [ADR-002 客户端事务与来源](adr/ADR-002-local-consistency.md)
- [ADR-003 数据批次同步](adr/ADR-003-data-replication.md)
- [ADR-006 确定性复盘派生与版本](adr/ADR-006-deterministic-review-derivation.md)

原规范阅读副本：[14](../migration/legacy/技术架构/14_新项目共享核心重构说明_20261016.md)、[15](../migration/legacy/技术架构/15_新项目工程目录与代码分工规范_20261016.md)。这些副本包含原 Node/Fastify 选择；本工程以 ADR-001 中记录的用户决定替代运行技术，其余职责约束保持。
