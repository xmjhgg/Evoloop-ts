# 本地业务核心与 Java 云服务：实现及验证

日期：2026-10-17。授权：按原 14/15 重构计划继续实现，先做本地业务逻辑及后端云服务。当前工作目录 `E:\pr\Evoloop-ts`；原项目 `E:\pr\Evoloop` 只读，没有改库、迁移生产数据或部署。

本次交付的是可构建、可运行和有分层证据的核心/云端第一版，**不是 44 UC/140 AC 的完整产品验收**。[逐项能力和缺口](../requirements/implementation-map.md)是后续验收依据；目标领域文档不能当作已实现证明。

## 实现

| 部分 | 代码与行为 |
| --- | --- |
| 本地四域 | `packages/client-business-core/src/profile`、`planning`、`execution`、`review` 的 domain/application/ports；公开能力及显式命令注册；workspace 仅组合查询 |
| profile | 分区掩码/版本、未知/单位、观测纠正/删除、日状态槽和不可变历史 |
| planning | 分类目标、周草案、规则/AI 审查、生成候选的冻结/接纳、选择发布、原基准保护、暂停/待重规划/归档及未来三方合并 |
| execution | 训练/学习/睡眠事实、实际动作与独立计量、睡眠开始/完成、食物多图草案、个人份量/营养未知、候选与摄入确认分开、同事实纠正/删除 |
| review | 日/目标周范围、确定性摘要/覆盖、人工内容/最终判断、候选接纳、组件范围确认、refs+token 最新性、确认依据与未来调整分开 |
| 本地运行时 | 同事务业务/历史/保护/token/意图/结果/变化登记；代际 CAS；固定批次与大小分批；丢 ACK、回流、连续版本、分支保全、客户端重放；确认/发布重新人工授予 |
| 存储 | SQLite 单连接事务、文件不可变段+提交标记、IndexedDB 严格事务；没有生产内存或 mock 自动回退 |
| 备份/恢复 | AES-256-GCM + PBKDF2-SHA256、独立 salt/nonce；业务/基线/队列/分支/版本/附件清单；错误密码/未知格式保持原库；快照握手和恢复前保存分支 |
| Java identity | 注册、BCrypt、随机会话、撤销、用途版本/撤回、账号访问停用和限流；注册不建业务表 |
| Java ai | 冻结输入/模型/提示版本、幂等、短事务租约、取消/撤回阻止迟到结果、HTTPS 供应商端口、24 小时临时图片；结果始终是候选 |
| Java sync | 单账户 head 锁、STORED/CONFLICT 幂等终态、完整载荷/回执/head 原子提交、连续拉取、快照/唯一根、账号归属、摘要和附件；不运行本地业务 |
| 契约/检查 | 唯一 Schema/操作声明生成 JSON Schema/OpenAPI/Java DTO/复制元数据/黄金样本；严格 TS、依赖/循环/跨域仓储检查、TS/Java 文件函数规模、JAR 边界和 CI |

当前物理封装、协议前置拒绝行为和设计差异见 [ADR-004](../architecture/adr/ADR-004-document-storage-baseline.md)。云端 HTTP v2 与旧站隔离，默认端口 11093。旧业务表、Java 业务仓储、Spring Modulith、TS 网络业务服务器均未搬入 cloud。

## 验证证据

最终命令：`pnpm verify`；同时完成 `pnpm install --frozen-lockfile`。工具链实测：Node 22.16.0、pnpm 11.25.0、TypeScript 5.9.3、Java 21.0.8、Maven 3.9.11、Spring Boot 4.0.8、独立 MySQL 8.4.10。Java 编译强制 Java 21/Maven 3.9.11 系列及正式依赖。

Java 运行依赖按实际解析结果固定在 `apps/cloud/runtime-dependencies.lock`，完整验证比较新解析清单，避免只用一个 Spring Boot 版本号代表所有传递依赖均已核对。

MySQL 连接显式使用 UTC 并设置会话时区；会话测试核对真实数据库中剩余秒数与 30 天 TTL，防止主机时区造成偏移。纯 TS 配置参照 [TypeScript 严格可选属性](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html)和[索引访问检查](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html)；SQLite 集成测试使用 [Node SQLite 接口](https://nodejs.org/download/release/v22.16.0/docs/api/sqlite.html)。这些是测试/工程工具依据，不替代端上验收。

| 层次 | 数量 | 重点 |
| --- | --- | --- |
| 本地单元/业务测试 | 22 | 回滚、幂等、多写者、历史、发布/政策阻断、AI 冻结/过期、组件失效隔离、调整、未知/半份、睡眠、回流/冲突/限额分批/空操作/分页追平 |
| 存储集成 | 2 | 真实 SQLite 文件和持久文件日志等价/重启、提交标记前崩溃；IndexedDB 使用明确的模拟器 |
| Java MySQL/HTTP | 14 | 注册/会话/停用、跨账号、并发 head、批次幂等、数据库注入故障回滚、快照根/完整性、附件、AI 候选/取消/不可用、跨语言黄金样本 |
| 兼容性基线 | 10 | 8 条旧冻结业务样本、规范字节/精度/Unicode/字符串边界、未知协议和旧命令拒绝保全 |
| 备份/恢复 | 2 | 真实加密、错误密码、现有未同步分支保全、旧格式拒绝不删队列 |
| 跨进程 | 1 | 实际 Java JAR + HTTP/MySQL + 多个真实 SQLite 客户端：离线竞争、原分支、客户端重放、新批次、快照恢复新设备 |

合计 **51 项**，最终结果与源摘要见[机器证据](evidence/20261017-results.json)。严格类型、源码、依赖、规模、生成一致性和真实 JAR 检查均为独立门槛，不计入测试数量。测试数据库名称由上下文初始化器在 Flyway 之前核验为 `evoloop_two_test`；缺库是失败，不是跳过。

数据库隔离：本机新建测试数据目录 `.test-data/mysql`、端口 13317；只对独立测试库执行新迁移和合成场景。旧工程 HEAD 为 `06c82d754dcf1089e2715359b3845a8620cc9e68`，前后工作区均干净。源码记录和迁移工具没有访问旧生产数据库。

## 实际限制

- 没有实现/验收 mobile、miniapp、H5 页面、平台 Gateway、原生 SQLCipher/Keychain、微信文件 API、设备照片文件打包/下载、后台、真机或 iOS 签名构建。IndexedDB 模拟器通过不等于浏览器多标签、配额和驱逐通过。
- 真实模型端点/凭据/模型及正式用途说明未提供。AI 成功/迟到结果使用显式测试供应商验证，生产缺配置如实失败；真实图像识别、模型建议质量和外部清理未验收。
- 获批健身规则登记为空。即使本地回调返回 ALLOWED 也不能发布个性化健身计划。营养公式、完整餐次分配/共享主次选择、完整复盘指标、自动派生调度、全部原字段和 AC 仍需后续领域扩展/验收。
- 当前支持新的 documents-v1/state 1/command 1/backup 1；旧 95 表、旧方法名队列与旧备份尚无生产转换器。没有 N/N-1 已发布兼容声明，没有旧微信身份适配、灰度切换或回退演练。
- 当前聚合状态封装尚未压测大历史。客户端快照目前单块，过大明确失败；备份当前有容量上限并保留附件清单。没有自动历史裁剪/队列清空。P95 200/300 ms 目标、崩溃/断电、账户切换设备交互和大文件恢复尚未验收。
- 完整权利请求/跨副本删除/注销暂缓；账号停用只撤销访问并保留数据。没有生产 TLS/共享限流/配额/运维部署验收；CI 文件已落地，本轮未在远端运行 CI。

文档同步：AGENTS、根/包 README、ADR、契约/版本、工程门槛、页面地图、需求变更、44 UC 映射和本记录已同步。历史设计副本保持历史身份。
