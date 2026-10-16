# 文档导航

本目录是新工程的设计入口。日期：2026-10-16；状态：目录与文档阶段。领域设计工作版不等于需求冻结、代码实现或测试通过。

| 位置 | 内容 |
| --- | --- |
| [requirements](requirements/README.md) | 沿用的业务需求、注册增量与首期范围差异 |
| [architecture](architecture/README.md) | 运行架构、领域、事务、同步、跨域流程与 ADR |
| [engineering](engineering/README.md) | 工程目录、依赖、跨语言契约、页面分工与验证命令契约 |
| [migration](migration/README.md) | 原需求/领域阅读副本、字段基线、迁移分类与切换回退 |
| [verification](verification/20261016-document-refactor.md) | 本轮文档核对；不继承旧实现的测试结论 |

适用顺序：用户本轮明确要求（Java 云服务、暂不处理代码）→ 新工程 ADR 与范围说明 → 两份原始重构规范 → 原业务需求与领域语义。历史的服务端业务 API、处理栅栏、业务库迁移与隐私编排均不可直接搬入新架构。
