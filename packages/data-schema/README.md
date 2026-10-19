# data-schema

状态：已实现 documents-v1 的集合白名单、外层行/变化 Schema 与 TableRowMap。当前采用[聚合文档封装](../../docs/architecture/adr/ADR-004-document-storage-baseline.md)，不宣称旧 95 表行映射或升级转换已完成；复制入口不引用核心。

职责：本地业务结构、强类型行、迁移登记与受限 replication 元数据。

依赖边界：kernel/Schema 工具；replication 禁止间接装入业务核心。

[工程约束](../../docs/engineering/dependency-rules.md) · [领域设计](../../docs/architecture/domains/README.md) · [未来检查](../../docs/engineering/quality-gates.md)
