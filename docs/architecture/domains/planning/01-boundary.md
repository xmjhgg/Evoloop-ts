# planning：边界与统一语言

客户端核心拥有分类目标、目标修订/状态、同目标同周工作草案、逐日项目和动作、审查、意见处理、发布修订、执行基准与保护。Goal 可独立存在；WeekPlan 不装载执行事实、复盘、图片或整段历史。

profile 提供条件与身体证据；execution 通过本域公开能力取得并保护原基准；review 提供最新已确认调整依据与候选差异。planning 只定义 AdjustmentBasisVerifier/FitnessEvidenceReader 端口，由客户端组合根注入；禁止静态导入 review/execution 内部实现。

健身限制、饮食目标计算、餐次分配、计划发布资格归本域策略；实际营养来源/份量换算归 execution。学习计划保留内容、时段、页/题/分钟和预期成果，不强制健身字段。

AI 仅提供生成/审查候选；云端 AI 不判断是否可发布，Java 不维护 GoalRepository/WeekPlanRepository。手工规划可以独立进行，不要求先有复盘。
