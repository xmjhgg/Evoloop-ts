# 工程目录与分工

根目录使用项目名 `EvoLoop-two`。2026-10-17 已实现本地核心、存储适配、Java 云服务及苹果端页面/平台装配；小程序目录仍为预留位置。当前差异见[苹果端验证记录](../verification/20261017-ios-client.md)、[页面地图](page-map.md)与 [ADR-005](../architecture/adr/ADR-005-ios-client.md)。

```text
EvoLoop-two/
├─ README.md / AGENTS.md
├─ apps/
│  ├─ cloud/
│  │  └─ src/
│  │     ├─ main/java/com/evoloop/cloud/
│  │     │  ├─ bootstrap/ config/ http/ observability/
│  │     │  ├─ modules/identity/      # api/application/model/ports/infrastructure
│  │     │  ├─ modules/ai/            # 同上 + workers
│  │     │  ├─ modules/sync/          # 同上 + validation
│  │     │  └─ infrastructure/       # mysql/file/crypto
│  │     ├─ main/resources/db/migration/
│  │     └─ test/java/ 与 test/resources/
│  ├─ mobile/src/
│  │  ├─ app/                       # bootstrap/providers/navigation
│  │  ├─ screens/                   # today/plan/review/profile/login/register/settings/history
│  │  ├─ features/ gateways/ ui/ assets/
│  │  └─ platform/                  # database/security/network/files/images/background
│  └─ miniapp/
│     ├─ config/
│     └─ src/                       # app/bootstrap、pages、screens、features、gateways
│        ├─ platform/weapp/ 与 h5/
│        └─ ui/ styles/ assets/
├─ packages/
│  ├─ kernel/                       # 纯 ID、精确值、日期、错误
│  ├─ contracts/                    # 身份/AI/同步 Schema 和派生 TS 类型
│  ├─ client-business-core/src/
│  │  ├─ profile/ planning/ execution/ review/
│  │  │  └─ domain/ application/commands/ application/queries/ ports/
│  │  ├─ workspace/queries/
│  │  ├─ local-commands/schemas/ 与 migrations/
│  │  └─ application/ports/ 与 workflows/
│  ├─ data-schema/                  # business/replication/generated、SQLite 迁移与基线
│  ├─ local-runtime/                # 命令/批次/基线/队列/同步/冲突/保留/备份/升级
│  ├─ storage-sqlite/ storage-journal/ storage-indexeddb/
│  ├─ client-model/                 # 按 feature 的 reducer/输入转换/ViewModel
│  ├─ design-tokens/
│  └─ testing/                      # 合成场景与跨存储契约
├─ contracts/                       # openapi/examples/compatibility/schema
├─ docs/                            # requirements/architecture/engineering/migration/verification
├─ tooling/                         # checks/generators/migrations
├─ scripts/
├─ tests/                           # architecture/acceptance/compatibility/migration/e2e/fixtures
├─ infra/                           # compose/docker/nginx/systemd/environments
└─ .github/workflows/
```

未实现的页面/平台叶目录仍以 `.gitkeep` 保留；已实现部分有真实源码、严格 TS 配置、受控 exports、锁文件、Maven、数据库迁移、检查和 CI。只有存在源码且有验证证据的模块才计入交付。

## 1. 客户端分层

路由只进入 Screen；Screen 只组合区块和页面导航；sections 按区域展示；Feature 承接单一用户动作；Hook 只管一个查询、表单或提交生命周期；client-model 放纯 reducer 与命令转换；Gateway 调用公开本地命令/查询或显式 OnlineGateway；Platform 注入文件、密钥、数据库和生命周期。

今日页分别拆 TodayHeader、GoalOverview、Training、Learning、Sleep、Nutrition、DailyReview、SyncHint；训练表单拆状态、动作列表、组、感受、提交 Hook。App 和 bootstrap 不写页面主体或万能 runtime。两个客户端复用业务与纯模型，不强制复用平台组件或 React 主版本。

## 2. Java 分工

模块 api 负责认证后的传输、状态码和字段错误；application 编排一个账号/AI/同步动作；model 仅表示本模块账号、任务或存储状态；ports 定义本模块外部依赖；infrastructure 提供 MySQL、哈希、模型与文件实现。DTO 不充当持久化模型。Java 包不存在 planning/execution/review/profile，禁止复制旧服务分层后继续运行领域业务。

## 3. 文件与函数上限

按非空非注释生产代码计数：入口 80 行；Screen 200 行；Hook 150 行；展示组件 200 行；单用例/策略/查询 200 行；其他手写生产文件 350 行，超过 250 提醒；单函数 80 行；测试文件 500 行。Java Controller/Service 同样遵守单一职责与单用例/通用文件上限，禁止以类名不同逃避集中逻辑限制。

生成文件只能在有来源和一致性检查的精确路径豁免规模；手写页面不得用 generated 标记逃避。职责混杂即使未超行数也不允许。后续 `check:ui`、依赖检查与 CI 必须验证实际导入/函数/文件，不以目录存在替代。
