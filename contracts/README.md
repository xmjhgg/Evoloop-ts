# contracts

由 packages/contracts 与 data-schema/replication 生成并发布的 Schema、OpenAPI、Java DTO 和规范字节黄金样本。运行 `pnpm generate` 更新，`pnpm check:generated` 重算比较，禁止双份手写协议。Java 仅将这些受控产物复制到构建目录编译/校验，不加载 TS 核心。

[工程分工](../docs/engineering/directory-structure.md) · [验收门槛](../docs/engineering/quality-gates.md)
