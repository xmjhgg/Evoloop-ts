> 历史阅读副本（2026-10-16）：保留旧需求/设计语义，未复制的附件链接指向原工程。旧服务端处理、旧实现状态和测试结论不适用于新工程；当前范围以新工程 docs/requirements/README.md 和架构 ADR 为准。仅此说明与链接经过整理，源文件摘要见归档清单。

# 后端领域设计目录

版本v1.0，2026-10-11，详细设计工作版，待评审与实现验证。六个领域各由一个独立子智能体设计，主设计智能体维护协作边界并联审；目录名与Java模块一致。

先阅读[整体业务领域设计](00_整体业务领域设计.md)，再阅读[领域协作契约与设计约定](01_领域协作契约与设计约定.md)：前者是已确认领域边界，后者补充本轮公开接口、用途授权、锁顺序、来源范围版本与迁移分配。设计核对结果见[核对记录](02_设计核对记录.md)。

| 领域文档 | Java模块 | 主要数据所有权 |
| --- | --- | --- |
| [identity · 账户、授权与数据请求](identity/README.md) | `com.evoloop.identity` | UserAccount、WeChatIdentity、PasswordIdentity、UserSession、AuthorizationGrant、DataRequest |
| [profile · 个人条件与身体观测](profile/README.md) | `com.evoloop.profile` | PersonalProfile、BodyMeasurement、DailyBodyState |
| [planning · 分类目标与周日计划](planning/README.md) | `com.evoloop.planning` | Goal、WeekPlan、PlanReview |
| [execution · 真实执行与个人摄入](execution/README.md) | `com.evoloop.execution` | TrainingRecord、MealRecord、SleepRecord、LearningRecord、FoodAnalysisDraft |
| [review · 共享日结论与目标周复盘](review/README.md) | `com.evoloop.review` | DailyConclusion、GoalWeeklyReview |
| [ai · AI任务与模型接入](ai/README.md) | `com.evoloop.ai` | AiTask；InputSnapshot和TaskAttempt为其内部记录 |

`workspace`是页面查询组合模块，不单独建业务限界上下文；`shared`是最小共享基础类型。健身/学习在planning、execution、review中保留各自模型与策略，不复制通用目标和结论对象。

文档存放结构与源码分层见[工程规范](<D:/project/pri/EvoLoop/docs/技术架构/02_工程目录与代码规范.md>)，跨域事务见[流程目录](../04_跨域流程/README.md)，详细展开采用[领域模板](_模板/领域设计模板.md)。需求依据为[数据口径](../../需求/04_公共规则/数据术语与口径.md)及[验收追溯](../../需求/05_验收与追溯/需求追溯矩阵.md)。

每份详细领域设计应提供：边界/统一语言、聚合与不变量、状态图、命令查询、领域/集成事件、公开接口、依赖关系、事务/锁/幂等、仓储/数据映射、对应BF/UC/BR/AC及验证计划。负责人在进入实现拆解时指定。

## 详细设计导航

五份文档承载职责概述、领域术语、核心类图、字段级表结构与核心 API 工作流程，并补充状态、事件、并发/恢复及需求追溯。类图采用 Mermaid，表设计给出类型、可空、单位与键/索引；流程区分公开模块 API 与 HTTP API。

| 领域 | 职责 / 术语 | 核心类图 / 规则 | API / 工作流程 | 表结构 / 数据映射 | 用例 / 待实现验证 |
| --- | --- | --- | --- | --- | --- |
| identity | [01](identity/01_边界与统一语言.md) | [02](identity/02_聚合与领域规则.md) | [03](identity/03_命令查询与领域事件.md) | [04](identity/04_仓储与数据映射.md) | [05](identity/05_用例与测试追溯.md) |
| profile | [01](profile/01_边界与统一语言.md) | [02](profile/02_聚合与领域规则.md) | [03](profile/03_命令查询与领域事件.md) | [04](profile/04_仓储与数据映射.md) | [05](profile/05_用例与测试追溯.md) |
| planning | [01](planning/01_边界与统一语言.md) | [02](planning/02_聚合与领域规则.md) | [03](planning/03_命令查询与领域事件.md) | [04](planning/04_仓储与数据映射.md) | [05](planning/05_用例与测试追溯.md) |
| execution | [01](execution/01_边界与统一语言.md) | [02](execution/02_聚合与领域规则.md) | [03](execution/03_命令查询与领域事件.md) | [04](execution/04_仓储与数据映射.md) | [05](execution/05_用例与测试追溯.md) |
| review | [01](review/01_边界与统一语言.md) | [02](review/02_聚合与领域规则.md) | [03](review/03_命令查询与领域事件.md) | [04](review/04_仓储与数据映射.md) | [05](review/05_用例与测试追溯.md) |
| ai | [01](ai/01_边界与统一语言.md) | [02](ai/02_聚合与领域规则.md) | [03](ai/03_命令查询与领域事件.md) | [04](ai/04_仓储与数据映射.md) | [05](ai/05_用例与测试追溯.md) |

## 跨领域联审重点

事实与计划基准共用事务；适用基准不可追溯修改；当天已有摄入保护总量；共享日结论两页同身份；来源 refs + 范围 token 检测新增/修正/删除；结论确认不发布计划；AI 调用成功不等于业务接纳；删除/撤回不能被旧任务恢复；学习不要求健康字段。完整协作时序见[四份跨域流程](../04_跨域流程/README.md)，并发取舍见[ADR-003](../05_ADR/ADR-003_用户处理栅栏与来源范围版本.md)。

本轮交付设计文档，不创建生产代码、执行迁移或完成真实供应商验收。OpenAPI、迁移 DDL、领域代码和真实 MySQL 集成测试在实施阶段从这些工作版设计落实；供应商、计算参数及保留期限沿用需求待定事项，不以文档完成冒充已决定。

## 2026-10-13 密码账号设计同步

在原 v1.0 详细设计基准上，identity 01～05/README 和类图更新至 v1.1，整体设计更新至 v1.2。密码身份、登录、管理员创建/重置、会话撤销及 V120 已按源码同步；原微信登录需求及其他领域工作版边界保留，不把本次账号验收解释为全领域完成。入口见 [identity](identity/README.md)，同步范围和检查结果见[核对记录](02_设计核对记录.md)。
