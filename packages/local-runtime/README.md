# local-runtime

状态：已实现本地命令总线、原意图/成功回执、同事务变化登记、定版批次、限额分批、ACK/拉取、快照握手、冲突分支、确定性客户端重放、加密备份及恢复保全。无生产内存回退。

`CommandBus` 通过 AtomicStore 接口保存；`syncOnce` 通过 SyncTransport 调用独立云服务。HTTP 不在本地事务中等待；断网保留可靠事实。发布/确认在重放时必须重新由用户确认，重放结果语义变化时停止。

2026-10-20：LocalTransaction 记录已递增的来源 key，CommandBus 在提交前调用共享核心 deriveReviews。运行时不计算复盘或营养，也不自动接纳 AI/确认结论。摘要、失效标记、事实、意图和变化一起提交，失败共同回滚；没有可丢失的内存派生队列。见 [ADR-006](../../docs/architecture/adr/ADR-006-deterministic-review-derivation.md)。

备份使用 AES-256-GCM、随机 salt/nonce 和 PBKDF2-SHA256；随机源由安全平台注入。当前备份封装结构化数据、基线、全部意图/批次/分支及附件清单；照片实际文件的装箱/下载仍需平台层装配。旧格式停止导入，尚无生产旧库转换器。保留全部历史，不自动剪队列或清库。

职责：命令总线、原意图、批次/基线/队列、同步/冲突/保留/备份/升级。

依赖边界：核心公开能力及抽象端口；禁止具体存储/平台反向依赖。

[工程约束](../../docs/engineering/dependency-rules.md) · [领域设计](../../docs/architecture/domains/README.md) · [未来检查](../../docs/engineering/quality-gates.md)
