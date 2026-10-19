# contracts

状态：已实现 Zod 运行时 Schema、派生 TS 类型和 HTTP 操作声明。`pnpm generate` 生成根 contracts 的 Schema/OpenAPI/Java DTO/黄金样本，`check:generated` 核对一致性。没有业务命令或处理器。

职责：账号、AI、同步及错误的唯一 Schema 声明与派生 TS 类型。

依赖边界：kernel 与受控 Schema 工具；禁止本地命令和领域处理器。

[工程约束](../../docs/engineering/dependency-rules.md) · [领域设计](../../docs/architecture/domains/README.md) · [未来检查](../../docs/engineering/quality-gates.md)
