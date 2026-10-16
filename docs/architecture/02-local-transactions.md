# 本地事务、来源与跨域协作

## 1. 本地命令协议

用例形态为 `execute(tx, context, localCommand)`，仅由客户端 local-command-bus 调用。稳定信封包括 commandId、commandType、commandVersion、accountId、expectedVersions、payload、依赖与原始操作时间。命令类型不是当前 JS 函数名。输入 Schema 和版本转换归 client-business-core/local-commands。

ExecutionContext 注入账户/用途快照、可信的本地解锁状态、时钟、ID 和批准的规则版本。离线不伪造云端会话有效性；按设备策略允许已初始化数据继续使用，AI 与上传必须重新认证。不同账户使用隔离库、队列和附件。

相同账户/commandId/规范摘要重试返回原成功引用；同编号不同输入拒绝 LOCAL_IDEMPOTENCY_CONFLICT。成功回执与业务一起提交；失败不得遗留可误认为成功的回执。预期聚合版本冲突不能自动升级版本覆盖。

## 2. 原子边界

一次事实保存同时写：事实头/修订/明细、planning 原基准保护、旧新日来源 token、受影响确认的失效标识、业务结果回执、可恢复本地意图、最终数据变化和待同步批次登记。所有仓储来自同一 UnitOfWork；提交失败整体回滚。跨域应用能力可嵌套同一事务，不能另开独立事务提前提交基准。

SQLite/SQLCipher 使用单连接事务；IndexedDB 在共同对象存储事务内完成；文件日志在一个不可变事务段中包含所有变化，完整写入并校验提交标记后才发布新检查点/可见状态。崩溃前后只能看见完整旧状态或完整新状态。具体落盘/空间故障策略和真机保证待实现验证。

业务保存不等待网络。UI 只在可靠提交后提示本地已保存。确定的来源 token 与失效标识同事务更新，昂贵指标/读投影可以之后重建；任何“最新已确认”查询和确认/发布仍须实时核验来源，不能依靠异步事件是否已经消费。

## 3. 来源与版本

SourceReferenceSet 包含 refs（owner、对象类型、ID、revisionId/version）与 scopeTokens（owner、范围类型、规范 key、版本）。缺失范围返回逻辑 0；首次新增建立 1。只验证原有 ID 会漏掉新增与删除，不能省略范围版本。

| 所有者 | 来源范围 | 递增语义 |
| --- | --- | --- |
| profile | CONDITIONS: COMMON/FITNESS/LEARNING；BODY_DAY: 日期 | 条件真实变化；测量/状态新增、纠正、删除的旧新日 |
| planning | GOAL_SET、GOAL_STATE、PLAN_DAY、PLAN_GOAL_WEEK、FITNESS_RULES | 目标或适用已发布安排/保护改变；草案编辑不冒充适用计划变化 |
| execution | FACT_DAY: 日期与 TRAINING/LEARNING/SLEEP/MEAL；FOOD_DRAFT | 有效事实变化；食物草案只改自己的 token，不影响已确认摄入 |
| review | DAILY、GOAL_WEEK、MANUAL | 内容/确认/有效性改变影响日周；MANUAL 仅人工条目变化 |

内容指纹含规范排序 refs/tokens、人工输入、cutoff、coverage、结构/规则版本。聚合 version 负责编辑冲突，revisionId 引用不可变内容，scopeToken 检查集合最新性，headVersion 排云端批次顺序，四者不可混用。设备重放保持原始预期版本与依据。

组件不得引用自己的 DAILY/GOAL_WEEK token；MANUAL token 不因确认或 AI 接纳而递增。写人工新修订后先更新 MANUAL，再采集输入，防止结果立即自我过期。

## 4. 并发与外部边界

本地运行时按账户协调写者；H5 多标签页选举/锁、文件日志单写与 SQL 事务均必须提供等价语义。逻辑访问顺序为账户本地写协调 → 命令回执 → profile → planning/保护槽 → execution → review → 来源/变化登记，最终由适配器事务保证。原服务端 identity 的 MySQL 用户处理栅栏不迁入客户端，也不保留为云端业务锁。

模型请求、HTTP、附件传输不在本地事务内等待。先冻结输入并提交，外部结果返回后重新进入短事务核验来源、版本、用途和账户。失配返回 SOURCE_STALE，保留新内容；任务完成不授予人工确认权限。

本地事件用于查询失效和派生调度，持久消费可恢复且幂等；事件不得成为跨域最新性判断的唯一依据。同步 outbox 保存数据传输状态，不是云端领域事件总线。旧 Spring Modulith、领域 outbox 和云端业务处理器均被本地机制替代。
