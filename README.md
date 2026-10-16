# EvoLoop-two

多客户端 + 共享 TypeScript 客户端业务核心 + Java 云服务。

当前阶段：**目录与设计文档重构，2026-10-16**。目录已经建立，业务实现、工程依赖、构建配置、数据库迁移和部署尚未开始。没有创建可运行的 pnpm workspace、Maven 工程或 CI；本阶段不代表规范 M0 已完成。

- [文档导航](docs/README.md)
- [新工程需求与范围](docs/requirements/README.md)
- [整体架构](docs/architecture/01-system-architecture.md)
- [领域设计](docs/architecture/domains/README.md)
- [工程目录与分工](docs/engineering/directory-structure.md)
- [Java 云服务决策](docs/architecture/adr/ADR-001-java-cloud.md)
- [迁移与历史依据](docs/migration/README.md)
- [本轮核对记录](docs/verification/20261016-document-refactor.md)

业务规则、用例、查询、历史、确认和冲突重放在客户端执行。iOS、微信小程序和 H5 共用核心；Java 云端只负责注册登录、AI 代理和同步数据存储。云端不会重新执行训练、计划、饮食和复盘用例。

`apps` 是运行入口，`packages` 是客户端共享能力，根 `contracts` 是未来生成与发布的跨语言协议产物。源码预留目录仅含 `.gitkeep`。原工程 `D:\project\pri\EvoLoop` 本轮仅作为只读参照，运行入口和业务库均未切换。
