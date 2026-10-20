# 文档导航

本目录是新工程的设计与实现入口。2026-10-17 已进入本地核心与 Java 云服务编码阶段；实际能力及证据见[实现记录](verification/20261017-local-core-cloud.md)与[逐项实现映射](requirements/implementation-map.md)。领域设计中尚未覆盖的细节仍是目标，不视为自动交付。

最新共享核心增量与验证见 [20261020-shared-core](verification/20261020-shared-core.md)；原生/供应商/数据库验证范围仍分别记录。

| 位置 | 内容 |
| --- | --- |
| [requirements](requirements/README.md) | 沿用的业务需求、注册增量与首期范围差异 |
| [architecture](architecture/README.md) | 运行架构、领域、事务、同步、跨域流程与 ADR |
| [engineering](engineering/README.md) | 工程目录、依赖、跨语言契约、页面分工与验证命令契约 |
| [migration](migration/README.md) | 原需求/领域阅读副本、字段基线、迁移分类与切换回退 |
| [verification](verification/20261017-local-core-cloud.md) | 当前源码、构建、数据库和跨进程验证；10 月 16 日记录保留为历史 |

适用顺序：用户最新要求（继续苹果客户端代码重构，不考虑数据迁移）→ 新工程 ADR 与范围说明 → 两份原始重构规范 → 原业务需求与领域语义。历史服务端业务 API、处理栅栏和业务库迁移不进入新云服务。

苹果端当前实现与未运行层次见 [20261017-ios-client](verification/20261017-ios-client.md)，原生安全与构建决策见 [ADR-005](architecture/adr/ADR-005-ios-client.md)。
