# EvoLoop-two

多客户端 + 共享 TypeScript 客户端业务核心 + Java 云服务。

2026-10-20 增量：共享核心补齐营养单位/份量与区间、餐次分配及历史保护、日周指标/覆盖、同事务摘要派生和调整失效。已明确规则及未确定的健康参数分开记录；见[本轮验证](docs/verification/20261020-shared-core.md)。

当前阶段：**本地业务核心、Java 云服务与苹果客户端代码重构，2026-10-17**。苹果端已接入共享核心，建立分层页面、加密数据库/照片、登录、同步、AI 候选及备份流程。旧数据迁移已按用户要求移出当前范围。源码与验证边界见[苹果端记录](docs/verification/20261017-ios-client.md)和[前一阶段核心/云服务记录](docs/verification/20261017-local-core-cloud.md)。

- [文档导航](docs/README.md)
- [新工程需求与范围](docs/requirements/README.md)
- [整体架构](docs/architecture/01-system-architecture.md)
- [领域设计](docs/architecture/domains/README.md)
- [工程目录与分工](docs/engineering/directory-structure.md)
- [Java 云服务决策](docs/architecture/adr/ADR-001-java-cloud.md)
- [迁移与历史依据](docs/migration/README.md)
- [本轮实现与验证](docs/verification/20261017-local-core-cloud.md)
- [实际能力与需求追溯](docs/requirements/implementation-map.md)

业务规则、用例、查询、历史、确认和冲突重放在客户端执行。iOS、微信小程序和 H5 共用核心；Java 云端只负责注册登录、AI 代理和同步数据存储。云端不会重新执行训练、计划、饮食和复盘用例。

`apps/cloud` 只运行 identity/ai/sync；`client-business-core` 只在客户端执行。根 `contracts` 是生成的 JSON Schema、OpenAPI、Java DTO 与黄金样本。SQLite 和文件持久化已实测；SQLCipher 与钥匙串已完成代码装配，设备执行待验。小程序/H5 尚未实现。

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:unit
pnpm test:mobile
pnpm verify:ios
# 完整检查需 JAVA_HOME 指向 Java 21，并设置独立 MySQL 测试库环境变量。
pnpm verify
```

Java 运行与测试库配置见 [cloud](apps/cloud/README.md)，苹果端运行见 [mobile](apps/mobile/README.md)。新服务默认端口 11093、前缀 `/api/v2`；新苹果端 bundleId 为 `com.evoloop.two`。2026-10-20 已部署独立新库和 `https://www.xylcmyka.bond/EvoLoop-two` 入口，见[部署验收](docs/verification/20261020-cloud-deployment.md)；未切换旧业务库，原 `E:\pr\Evoloop` 保持只读。AI 供应商及正式用途告知尚未配置；真机、真实供应商和完整产品验收分开记录，不开展旧库/队列转换。
