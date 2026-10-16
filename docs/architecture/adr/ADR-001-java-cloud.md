# ADR-001：Java 云服务与跨语言边界

状态：采用用户本轮明确要求；2026-10-16；仅设计决策，未实现。

原 14/15 v1.1 选择 Node.js/Fastify 轻量云端；用户要求“多客户端 + 共享 TypeScript 业务处理端 + Java 云服务”。本工程以 Java 替代 Node/Fastify，保留客户端本地业务与云端三职责的边界。共享 TypeScript 核心嵌入客户端，不解释为远程 TS 业务端。

| 原规范 | 本工程替代 |
| --- | --- |
| apps/cloud/src/main.ts 与 Fastify routes | apps/cloud/src/main/java/com/evoloop/cloud，Java 启动装配及模块 API 层 |
| 云端直接引用 contracts、kernel、data-schema/replication | Java 只消费 contracts/schema 的协议/复制结构发布产物，生成 Java DTO/校验器，不引用 TS 包或 Node 运行时 |
| pnpm workspace 管理 cloud TS 工程 | pnpm 管理客户端及共享包；apps/cloud 未来使用独立 Maven 工程，根脚本仅编排 Java 构建 |
| Fastify Schema 校验 | Java API 边界按同一协议产物执行运行时校验；具体库版本初始化时确定 |
| Node 构建产物边界 | Java 依赖/包/产物检查，禁止本地业务源码、处理器或 TS 执行运行时进入云端 |

Java 21/Spring Boot 沿用旧工程技术作为初始化参照，确切版本尚未锁定。本轮不复制旧 backend、旧 pom、Spring Modulith 业务事件或 Flyway 业务表；新 Java 服务仅 identity / ai / sync。旧 Java 业务实现仍只是迁移等价基线。

增加的成本：需维护 TS/Java 的协议生成、运行时校验、日期与精确数值、规范摘要及 N/N-1 黄金样本。收益：满足 Java 云服务要求，客户端业务仍只有一份。数据同步、AI 和账号各自保持事务与访问控制，不借 Java 模块化单体恢复旧六域业务服务。

完成条件（未来）：Java 可独立构建；协议生成一致；Java 产物无客户端业务处理器；真实 MySQL 账号/同步测试与模型接口测试分别有证据。本轮目录存在不满足这些条件。
