# 后续工程检查与交付门槛

本页是命令契约与验收计划；本轮没有实现或执行以下命令。

| 根命令（未来） | 实际验证要求 |
| --- | --- |
| pnpm install --frozen-lockfile | 根锁文件与 workspace；不代替 Java 依赖锁定/解析 |
| pnpm typecheck / lint | TS 严格类型、语法风格；Java 编译/静态检查由云端 Maven 独立执行 |
| pnpm check:deps | exports、跨域/跨包内部引用、循环、平台隔离；同时编排 Java 模块/产物边界检查 |
| pnpm check:ui | 实际页面映射、Screen/Hook 职责导入、函数/文件规模 |
| pnpm check:generated | Schema/OpenAPI/TS 行类型/Java DTO 及复制元数据临时生成差异 |
| pnpm test:unit | 客户端纯规则与模型；Java identity/ai/sync 自身逻辑 |
| pnpm test:integration | 真实 SQLite/日志/IndexedDB 存储契约；Java HTTP 与独立 MySQL 事务 |
| pnpm test:compatibility / test:migration | N/N-1 载荷/队列/备份、旧 Java 业务基线、切换/回退 |
| pnpm build:cloud | 编排 apps/cloud Maven 打包，产生 Java 服务产物，不构建 Fastify 服务 |
| pnpm build:miniapp / build:h5 | Taro 两个部署目标分别验证，H5 保留可配置子路径 |
| pnpm build:mobile-bundle / build:ios | Hermes 与 Mac/Xcode 原生产物分开记录 |
| pnpm verify | 汇总规定本机层次；缺数据库、设备、供应商时报告未覆盖，不空通过 |

云端数据库任务必须验证隔离库标识，缺库则明确失败或未执行，不能使用跳过来标记完整集成通过。客户端跨存储测试比较返回、规范数据、修订、基准、token、错误码与重启行为，不能仅比较函数返回或目录存在。

M0 仍待 workspace/工具锁定、工程最小启动、可执行边界检查与 CI。后续 M1 首条本地闭环 → M2 账号/同步 → M3 手工业务/页面 → M4 AI/附件 → M5 灰度迁移 → M6 交付。每阶段分别给出证据与未覆盖项，不将本次文档完成等同全部重构完成。

页面 PR 列 Screen、区块、Feature、Hook/Model、Gateway、共享用例及交互验证；协议 PR 列旧客户端/队列/备份影响和失败恢复。原 iPhone P95≤200ms 切页、可靠保存 P95≤300ms 为目标，未实测前不承诺；真实 Mac/iPhone/微信及外部部署单独验收。
