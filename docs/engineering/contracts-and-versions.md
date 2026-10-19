# 跨语言契约、结构与版本

2026-10-17 实现说明：唯一协议来源为 `packages/contracts/src/schemas.ts` 与 `operations.ts`，复制外层来源为 `packages/data-schema/src/replication/public.ts`。运行 `pnpm generate` 发布根 `contracts/schema`、`openapi`、`java/Wire.java` 与黄金样本；`check:generated` 重算后逐字比较。下表的“未来”栏保留原设计职责，其中关系行/DDL 生成尚未启用；当前采用 [ADR-004](../architecture/adr/ADR-004-document-storage-baseline.md) 的聚合文档映射。

当前版本：clientCoreVersion=0.1.0，localSchema/stateFormatVersion=1，localCommandVersion=1，syncProtocolVersion=1，payloadSchemaVersion=documents-v1，backupFormatVersion=1，身份 API=/api/v2，AI 输出=candidate-v1。没有已发布的 N-1 支持；旧 rows-v1/方法名队列/备份保留并明确拒绝直接导入，不能宣称已迁移。

苹果端本轮版本：Expo 57.0.30、React Native 0.86.3、React 19.2.3、移动端 TS 6.0.3（纯包检查仍为 5.9.3），准确依赖见锁文件。mobileBackupFormat=1 外层封装共享核心备份、服务原点、照片与 AI 书签，仅用于当前客户端。用途协议增加 PurposeNotice，以及 Purpose.noticeVersion / expectedPurposeVersion；尚无外部已发布客户端，旧请求缺字段明确失败。用户已取消当前旧数据迁移任务。

Java Maven 仅复制已发布 `contracts/java` 到 target/generated-sources/contracts 编译，JSON Schema 复制到 protocol 资源并执行传输校验。Java 构建不加载 TS；协议生成工具不加载核心或 testing。

冻结的规范字节：仅 null、布尔、字符串、数组和普通对象；拒绝 JSON number、undefined 和孤立代理字符。字符串不做 Unicode 规范化；对象按 UTF-16 键排序，数组顺序保持，使用 JSON 字符串转义和 UTF-8，SHA-256 小写十六进制。DECIMAL/BIGINT/版本均用规范字符串；业务日期为上海日期，Instant 为 UTC。TS/Java 黄金样本实际比较精度、Unicode、null、日期、键序与 tombstone。

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
