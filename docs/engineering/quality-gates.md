# 工程检查与交付门槛

2026-10-17 已实现核心、云服务和苹果客户端代码检查。`verify` 缺独立 MySQL 会失败；`verify:ios` 解析实际 Expo 插件配置并导出 Hermes。设备层单独记录，未提供空通过检查。执行结果见[苹果端记录](../verification/20261017-ios-client.md)。

| 根命令 | 实际验证要求 |
| --- | --- |
| pnpm install --frozen-lockfile | 根锁文件与 workspace；不代替 Java 依赖锁定/解析 |
| pnpm typecheck / lint | TS 严格类型、语法风格；Java 编译/静态检查由云端 Maven 独立执行 |
| pnpm check:deps | manifests、exports、实际引用、循环、跨域仓储/依赖、纯包平台隔离、生成工具和 Java 源码边界 |
| pnpm check:ui | 实际页面映射、Screen/Hook 职责导入、函数/文件规模 |
| pnpm check:generated | 从唯一来源重新计算 JSON Schema/OpenAPI/Java DTO/复制元数据/黄金样本并逐字比较 |
| pnpm test:unit | 客户端纯规则与模型；Java identity/ai/sync 自身逻辑 |
| pnpm test:integration | 真实 SQLite/文件日志、IndexedDB 模拟器；Java HTTP 与真实独立 MySQL 事务。模拟器不能代替 H5 实测 |
| pnpm test:compatibility / test:recovery | 冻结业务样本、规范字节、未知协议拒绝及当前格式加密恢复保全；不进行旧数据转换 |
| pnpm build:cloud | 编排 apps/cloud Maven 打包，产生 Java 服务产物，不构建 Fastify 服务 |
| pnpm check:cloud-artifact | 检查真实 JAR 的模块、Schema 及禁止的 TS/业务/脚本运行时内容，缺产物则失败 |
| pnpm check:java-deps | Maven 构建阶段实际解析 runtime 清单，与固定依赖坐标锁逐项比较 |
| pnpm test:e2e:cloud | 真实 Java JAR + HTTP/MySQL + 两个 SQLite 客户端，验证冲突保全、客户端重放及重新上传 |
| pnpm test:mobile | 实际表单/网关编排、真实 SQLite 重启/任务书签、AI 重试、备份附件、前台同步退避；原生接口未由替身冒充验收 |
| pnpm check:format:mobile | 格式化后的移动端、纯表现包和移动端测试；不得靠压行通过规模限制 |
| pnpm verify:ios | 移动端严格类型、Expo 依赖匹配、原生配置插件解析和真实 iOS Hermes 包及摘要 |
| iOS 原生构建 CI | macOS 26 / Xcode 26.4.1 / CocoaPods 1.16.2，生成工程并无签名编译模拟器包；2026-10-20 远端已通过并上传应用归档，见[运行记录](../verification/20261020-github-build.md) |
| pnpm verify | 汇总规定本机层次；缺数据库、设备、供应商时报告未覆盖，不空通过 |

云端数据库任务必须验证隔离库标识，缺库则明确失败或未执行，不能使用跳过来标记完整集成通过。客户端跨存储测试比较返回、规范数据、修订、基准、token、错误码与重启行为，不能仅比较函数返回或目录存在。

核心、云端和苹果端的工作区、检查与构建脚本已落地；2026-10-20 远端完整回归 87 项及 iOS 模拟器原生编译已通过。苹果页面具备源码/类型/Hermes、编排和原生编译证据；真实模型、原生照片/钥匙串、真机交互及完整产品验收仍未完成。旧数据迁移已按用户要求移出当前范围。

页面 PR 列 Screen、区块、Feature、Hook/Model、Gateway、共享用例及交互验证；协议 PR 列旧客户端/队列/备份影响和失败恢复。原 iPhone P95≤200ms 切页、可靠保存 P95≤300ms 为目标，未实测前不承诺；真实 Mac/iPhone/微信及外部部署单独验收。
