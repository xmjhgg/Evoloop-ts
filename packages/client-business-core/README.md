# client-business-core

状态：已实现四域的 domain/application/ports、本地命令 Schema/显式处理器注册、历史查询、来源核验和 workspace 组合查询。公开入口按领域分开，无根 barrel。详细命令与需求见[实现映射](../../docs/requirements/implementation-map.md)。

2026-10-20：已补齐标签单位/个人份量换算、估算区间、餐次分配和当日保护、共享基准明确选择、日周确定性指标/覆盖与逐日状态、同事务摘要派生、调整候选失效/放弃。统计版本为 review-metrics-v2，旧快照不继续授权最新确认。见[验证与具体边界](../../docs/verification/20261020-shared-core.md)。

规则与用例只在这里运行；事务、ID、时钟、账户、解锁、用途与协作端口由客户端注入。训练/学习/睡眠/摄入事实、计划原基准、来源/确认与成功回执可靠提交后才提示保存。AI 接纳、摄入确认、复盘确认和计划发布分别执行。

未批准健身政策保持阻断；没有获批的个性化营养公式或医学判断。当前指标明确保留缺失、未知、覆盖和 NO_BASELINE/UNAVAILABLE；完整原需求 AC 尚需页面和产品验收。

职责：profile/planning/execution/review 与 workspace；本地命令及跨域事务端口。

依赖边界：kernel 与公开领域能力；禁止 HTTP、数据库连接和平台框架。

[工程约束](../../docs/engineering/dependency-rules.md) · [领域设计](../../docs/architecture/domains/README.md) · [未来检查](../../docs/engineering/quality-gates.md)
