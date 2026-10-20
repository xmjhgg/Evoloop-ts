# cloud

Java 21 / Spring Boot 4.0.8 / Maven 3.9.11。只运行 identity、ai、sync 及必要设施；两份新 Flyway 迁移仅创建账号、会话、AI 任务、同步头/批次/快照和技术附件，不创建旧业务表。

账号：用户名密码注册、BCrypt、30 天随机会话、撤销、明确用途与限流。注册后显式登录，不创建目标或事实。部署须配置实际 `PURPOSE_NOTICE_VERSION` 与 `PURPOSE_NOTICE_TEXT`；客户端先查询并展示正文，新增授权提交 noticeVersion，所有修改提交 expectedPurposeVersion。过期告知或账户用途版本冲突明确拒绝；减少授权不依赖正文可用。合成测试版本不得用于生产。

同步：单账户头锁、不可变批次、规范摘要、STORED/CONFLICT 幂等回执、连续拉取、临时/完整快照、唯一初始根及通用附件。格式/摘要/归属不合法的请求以 HTTP 错误拒绝，不创建回执；不得把协议拒绝重试成成功提示。服务器不解释业务文档。

AI：冻结请求、账号幂等、数据库租约、取消/用途撤回保护、HTTPS 模型端口和临时图片。模型调用在事务外；输出仅为候选。超时租约明确失败，不自动重试造成重复计费。缺供应商配置返回 AI_UNAVAILABLE。

从仓库根目录运行，环境变量不会自动从 `.env` 加载：

```powershell
$env:JAVA_HOME = '<Java 21 路径>'
$env:EVOLOOP_CLOUD_DB_URL = 'jdbc:mysql://127.0.0.1:3306/evoloop_two?connectionTimeZone=UTC'
$env:EVOLOOP_CLOUD_DB_USER = 'evoloop_two'
$env:EVOLOOP_CLOUD_DB_PASSWORD = '<独立数据库密码>'
pnpm build:cloud
pnpm start:cloud
```

默认 `127.0.0.1:11093`，健康接口 `/actuator/health`，业务前缀 `/api/v2`。直接 Maven 构建使用已发布的 `contracts/java` 和 `contracts/schema`，复制到 target 后编译，不需要 Node 运行时。

完整验证必须将 URL 指向独立的 `evoloop_two_test`，并设置对应用户/密码，再执行 `pnpm verify`。Java 测试在 Flyway 前核验实际数据库名，缺数据库直接失败，零跳过。生产环境的 TLS、凭据、共享限流、对象存储/配额及供应商参数须独立运维配置。

2026-10-20 已部署独立新库与服务，入口为 `https://www.xylcmyka.bond/EvoLoop-two`，公网 API 前缀为 `/EvoLoop-two/api/v2`。AI 供应商和正式用途告知尚未配置，相关能力明确不可用。配置、运行与撤下步骤见[部署说明](../../docs/engineering/cloud-deployment.md)，实际测试边界见[部署验收](../../docs/verification/20261020-cloud-deployment.md)。

[协议](../../contracts/openapi/evoloop-v2.json) · [验证记录](../../docs/verification/20261017-local-core-cloud.md) · [Java 决策](../../docs/architecture/adr/ADR-001-java-cloud.md)
