# storage-indexeddb

状态：已实现 IndexedDB 账户存储、严格 readwrite 事务、摘要及代际比较，独立 DOM 类型配置；业务纯包不加载 DOM。当前用 fake-indexeddb 验证等价与重启，真实浏览器多标签/配额/驱逐仍待验收。

职责：H5 事务、仓储、查询索引与升级。

依赖边界：本地端口/结构；多标签写协调与配额故障必须验证。

[工程约束](../../docs/engineering/dependency-rules.md) · [领域设计](../../docs/architecture/domains/README.md) · [未来检查](../../docs/engineering/quality-gates.md)
