# 领域与云端模块设计

版本 v1.0，2026-10-16；已完成本轮设计重组，全部运行能力待实现与验证。

原“后端领域设计”在新工程拆为**客户端业务领域**与**Java 云端能力模块**，不再把部署位置视为领域所有权。每个主要模块继续使用 01～05 的职责、模型、命令查询、数据映射、追溯结构。

| 位置/模块 | 唯一所有权 | 设计入口 |
| --- | --- | --- |
| TS profile | 个人条件、测量与日身体状态 | [profile](profile/README.md) |
| TS planning | 目标、周草案、审查、发布、原基准与保护 | [planning](planning/README.md) |
| TS execution | 训练/睡眠/学习/摄入事实、食物草案、附件业务关联 | [execution](execution/README.md) |
| TS review | 日结论、目标周复盘、人工判断、组件确认与调整依据 | [review](review/README.md) |
| TS workspace | 页面读组合，无新增事实 | [workspace](workspace/README.md) |
| Java identity | 注册、密码/微信身份、会话、账号访问与必要用途限制 | [identity](identity/README.md) |
| Java ai | 供应商调用、技术任务/租约/结果及受控临时输入 | [ai](ai/README.md) |
| Java sync | 账户头、批次、回执、快照、增量和附件容器 | [sync](sync/README.md) |

公共协议：[本地事务与来源](../02-local-transactions.md)、[同步与恢复](../03-sync-and-recovery.md)、[跨语言契约](../../engineering/contracts-and-versions.md)。原字段级设计与 AC 表保存在[历史领域副本](../../migration/legacy/技术架构/03_后端领域设计/README.md)，只作为语义来源；新方案不继承其中的服务端事务、业务 HTTP、数据库部署和完成状态。

## 统一语言与确认

| 动作 | 生效含义 |
| --- | --- |
| 保存条件/事实 | 可靠本地提交后成立，AI/同步失败不回滚 |
| 保存草案 | 不替换生效计划 |
| 接纳 AI 候选 | 所有域校验来源和规则后存候选，不代表用户确认 |
| 确认摄入 | 核对个人实际份量后形成唯一有效事实 |
| 确认日/周结论 | 只认可明确范围、cutoff、coverage 与来源；周不代日 |
| 发布计划 | 最新审查/规则/来源有效且用户明确选定未来可调范围 |
| 云端 STORED | 载荷已保存，不授予业务有效性或人工确认 |

普通纠正追加修订，查询只累计当前有效事实；依法/按批准范围物理清理是不可变历史的例外，但本期不假称全链路隐私流程已提供。未知、估算、已知与空缺分别表示；日期与单位不由界面文本推断。
