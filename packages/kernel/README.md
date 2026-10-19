# kernel

状态：已实现规范 JSON/SHA-256、精确十进制计算、上海业务日期、UTC 时间和结构化错误；纯 ES2022 编译，不加载 Node/DOM 类型。见[验证记录](../../docs/verification/20261017-local-core-cloud.md)。

职责：纯 ID、精确数值/单位、业务日期、UTC 时间和错误基础类型。

依赖边界：仅审查过的纯计算库；禁止 UI/平台/Node/DOM。

[工程约束](../../docs/engineering/dependency-rules.md) · [领域设计](../../docs/architecture/domains/README.md) · [未来检查](../../docs/engineering/quality-gates.md)
