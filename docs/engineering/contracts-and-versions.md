# 跨语言契约、结构与版本

## 1. 唯一来源与产物

| 内容 | 唯一来源（未来） | 发布/生成位置（未来） | 消费方 |
| --- | --- | --- | --- |
| 身份、AI、同步运行时 Schema | packages/contracts/src 下受控声明 | contracts/schema、contracts/openapi、派生 TS 类型、Java DTO/校验器 | TS 客户端、Java API |
| 本地业务表与字段 | packages/data-schema/src/business | 本地行类型、SQLite 结构/升级候选、复制白名单 | 三种本地存储 |
| 复制结构元数据 | data-schema 的受限 replication 输出 | contracts/schema 中版本化表/字段/主键/精度元数据 | Java 仅校验传输形状和归属 |
| 本地命令与转换 | client-business-core/local-commands | 客户端处理器注册与旧意图转换 | local-runtime；不发布云端可执行协议 |
| 加密备份格式 | local-runtime/backup | 客户端备份容器与转换 | 客户端恢复 |
| Java 账号/AI/同步物理表 | apps/cloud/src/main/resources/db/migration | Java 私有 MySQL 迁移 | Java；不生成业务仓储 |

`contracts` 包和根 `contracts` 不能各手写一份接口；后者是生成发布物。Java 从发布协议生成自己的 DTO/校验器，生成目标在 Java 构建目录内，不手改。具体生成工具与 JSON Schema/OpenAPI 精确版本在初始化前验证并记录，当前不伪造产物。

生成流水线只读取协议和复制结构，不能 import client-business-core 的处理器来获得类型；Java 产物与生成工具依赖均检查。data-schema 中复制边界不能执行规则、指标、引用图检查或确认资格。

## 2. 表示规范

ID 保留旧稳定 UUID。DECIMAL、BIGINT、序号跨语言用规范十进制字符串；单位显式，未知为 null/UNKNOWN 并区别估算与区间。DATE 是 yyyy-MM-dd，Instant 为 UTC；业务日期默认 Asia/Shanghai，不能以展示本地化文本做计算。

摘要计算在两端使用一致的规范化字节规则（键序、数组顺序、数值字符串、Unicode、空值、时间、tombstone）；准确算法/Schema 在实现前冻结，通过含高精度数值、BIGINT 边界、跨日和未知值的黄金样本测试。不能用 Java long/JS number 的默认 JSON 互转破坏摘要和精度。

## 3. 版本矩阵

| 版本 | 维护者 | 升级义务 |
| --- | --- | --- |
| clientCoreVersion | 客户端核心 | 业务语义与等价基线；不要求 Java 维护业务版本处理器 |
| localSchemaVersion | data-schema + storage | 临时库迁移、引用核验和失败恢复 |
| localCommandVersion | 客户端命令 | 未同步旧意图可转换/重放，不能删除 |
| syncProtocolVersion | contracts + Java sync | 批次、回执、拉取及能力握手兼容 |
| payloadSchemaVersion | data-schema replication | 客户端业务载荷转换；Java 仅声明可存格式 |
| backupFormatVersion | local-runtime | 密码/损坏/旧格式/附件恢复兼容 |
| identity/ai 协议版本 | contracts + Java 对应模块 | 旧会话/请求/任务响应兼容与明确拒绝 |

以真实 N/N-1 样本测试为首期目标，目前没有发布版本，不能声称已兼容。旧载荷不能理解时停止导入并要求升级。旧 App 不直接打开新结构；空间检查 → 加密恢复点 → 临时库迁移 → 全量校验 → 原子切换，失败保留原库和队列。
