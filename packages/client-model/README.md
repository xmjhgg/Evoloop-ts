# client-model

已实现纯表单描述/初值、文本金额/日期转换、错误文案、计划/事实展示投影。严格 TS，不隐式载入 Node/DOM，不包含 React、持久化、网络或业务规则；经公开入口消费核心类型。实际 Feature 命令组装在苹果端 features 中。

职责：按 Feature 的纯 reducer、表单文本、格式错误、命令转换、ViewModel。

依赖边界：公开客户端类型；禁止 JSX、SQL、HTTP 和领域规则副本。

[工程约束](../../docs/engineering/dependency-rules.md) · [领域设计](../../docs/architecture/domains/README.md) · [未来检查](../../docs/engineering/quality-gates.md)
