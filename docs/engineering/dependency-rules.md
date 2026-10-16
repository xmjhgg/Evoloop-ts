# 包与域依赖边界

| 消费者 | 允许依赖 | 禁止 |
| --- | --- | --- |
| kernel | 审查过的纯计算库 | 平台、框架、网络、Node/DOM |
| contracts | kernel、受控 Schema 工具 | 本地命令、领域处理器、页面和仓储 |
| client-business-core | kernel、本域和其他域公开类型/端口 | 数据库连接、HTTP、平台、云端模块、UI |
| data-schema | kernel、受控 Schema 工具 | 业务用例、连接、平台；replication 不经 barrel 引入 business/core |
| local-runtime | core、kernel、contracts、data-schema 公共入口 | 具体 storage 包、平台 API、云端业务执行 |
| storage-* | 本地仓储/事务端口、data-schema、local-runtime/ports | 业务规则副本、apps、cloud、反向装配 |
| client-model | 客户端公开业务类型、kernel、必要协议类型 | JSX、SQL、HTTP、平台与业务规则副本 |
| mobile/miniapp | 上述客户端包和自身平台依赖 | cloud 实现、绕过核心直接写业务表 |
| testing | 公开测试端口与驱动 | 生产包反向依赖 testing |
| Java cloud | Java 基础设施、生成协议 DTO/校验产物 | 全部 TS 运行时业务包；客户端命令、领域仓储、领域语义实现 |

域静态依赖方向：profile → kernel；planning → profile 公开契约；execution → planning 公开能力；review → profile/planning/execution 公开快照；workspace → 四域公开查询。planning 所需事实证据/调整依据由自有 ports 声明，组合根注入，禁止反向 import execution/review。

TS 包用 `@evoloop/<package>` 与 `workspace:*`，按领域受控 exports；禁止跨包 `../other/src`，不做根 barrel 全仓导出。Java 使用自己生成的契约 artifact，不能声明 workspace:* 依赖或通过 Node/Graal/脚本启动 TS 核心。

未来检查同时核验声明、实际 import、循环、传递依赖、TS 产物与 Java JAR。扫描 Java 的模块/类依赖及可执行行为，不能仅因没有名为 planning 的目录就判定业务隔离通过。本轮只定义约束，检查脚本尚未实现。
