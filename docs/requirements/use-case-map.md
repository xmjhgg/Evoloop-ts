# 原用例到新工程的逐项分工

2026-10-16 原分工基线，保留 44 份 UC 和 140 个 AC 标识。2026-10-17 的源码与测试进度另见[实现映射](implementation-map.md)，本表不代表全部 AC 已验收。详细前提/操作/预期仍在链接原文；规则按[原追溯矩阵](../migration/legacy/需求/05_验收与追溯/需求追溯矩阵.md)读取。

| 原用例 | 新执行/所有者 | 范围处置 | 原文 AC 标识 |
| --- | --- | --- | --- |
| [UC-FIT-001](../migration/legacy/需求/03_功能用例/健身管理/01_目标与档案/UC-FIT-001_设置健身目标与专属条件.md) | planning + profile | 业务语义沿用；执行位置调整 | `UC-FIT-001-AC-01`、`UC-FIT-001-AC-02` |
| [UC-FIT-002](../migration/legacy/需求/03_功能用例/健身管理/01_目标与档案/UC-FIT-002_修改健身目标与专属条件.md) | planning + profile | 业务语义沿用；执行位置调整 | `UC-FIT-002-AC-01`、`UC-FIT-002-AC-02` |
| [UC-FIT-003](../migration/legacy/需求/03_功能用例/健身管理/02_计划管理/UC-FIT-003_生成周计划草案.md) | planning | 业务语义沿用；执行位置调整 | `UC-FIT-003-AC-01`、`UC-FIT-003-AC-02`、`UC-FIT-003-AC-03`、`UC-FIT-003-AC-04` |
| [UC-FIT-004](../migration/legacy/需求/03_功能用例/健身管理/02_计划管理/UC-FIT-004_编辑计划草案.md) | planning | 业务语义沿用；执行位置调整 | `UC-FIT-004-AC-01`、`UC-FIT-004-AC-02`、`UC-FIT-004-AC-03`、`UC-FIT-004-AC-04`、`UC-FIT-004-AC-05`、`UC-FIT-004-AC-06`、`UC-FIT-004-AC-07` |
| [UC-FIT-005](../migration/legacy/需求/03_功能用例/健身管理/02_计划管理/UC-FIT-005_发起AI计划审查.md) | planning | 业务语义沿用；执行位置调整 | `UC-FIT-005-AC-01`、`UC-FIT-005-AC-02`、`UC-FIT-005-AC-03`、`UC-FIT-005-AC-04` |
| [UC-FIT-006](../migration/legacy/需求/03_功能用例/健身管理/02_计划管理/UC-FIT-006_处理审查意见并确认计划.md) | planning | 业务语义沿用；执行位置调整 | `UC-FIT-006-AC-01`、`UC-FIT-006-AC-02`、`UC-FIT-006-AC-03`、`UC-FIT-006-AC-04` |
| [UC-FIT-007](../migration/legacy/需求/03_功能用例/健身管理/02_计划管理/UC-FIT-007_设置或修改每日饮食目标草案.md) | planning | 业务语义沿用；执行位置调整 | `UC-FIT-007-AC-01`、`UC-FIT-007-AC-02`、`UC-FIT-007-AC-03` |
| [UC-FIT-008](../migration/legacy/需求/03_功能用例/健身管理/03_执行与饮食/UC-FIT-008_查看今日安排与饮食进度.md) | workspace + execution/planning | 业务语义沿用；执行位置调整 | `UC-FIT-008-AC-01`、`UC-FIT-008-AC-02`、`UC-FIT-008-AC-03`、`UC-FIT-008-AC-04` |
| [UC-FIT-009](../migration/legacy/需求/03_功能用例/健身管理/03_执行与饮食/UC-FIT-009_登记训练执行.md) | execution | 业务语义沿用；执行位置调整 | `UC-FIT-009-AC-01`、`UC-FIT-009-AC-02`、`UC-FIT-009-AC-03`、`UC-FIT-009-AC-04` |
| [UC-FIT-010](../migration/legacy/需求/03_功能用例/健身管理/03_执行与饮食/UC-FIT-010_登记睡眠.md) | execution | 业务语义沿用；执行位置调整 | `UC-FIT-010-AC-01`、`UC-FIT-010-AC-02`、`UC-FIT-010-AC-03` |
| [UC-FIT-011](../migration/legacy/需求/03_功能用例/健身管理/03_执行与饮食/UC-FIT-011_登记身体指标与状态.md) | profile | 业务语义沿用；执行位置调整 | `UC-FIT-011-AC-01`、`UC-FIT-011-AC-02` |
| [UC-FIT-012](../migration/legacy/需求/03_功能用例/健身管理/03_执行与饮食/UC-FIT-012_拍照分析食物热量.md) | execution | 业务语义沿用；执行位置调整 | `UC-FIT-012-AC-01`、`UC-FIT-012-AC-02`、`UC-FIT-012-AC-03`、`UC-FIT-012-AC-04`、`UC-FIT-012-AC-05`、`UC-FIT-012-AC-06`、`UC-FIT-012-AC-07` |
| [UC-FIT-013](../migration/legacy/需求/03_功能用例/健身管理/03_执行与饮食/UC-FIT-013_确认饮食实际摄入.md) | execution | 业务语义沿用；执行位置调整 | `UC-FIT-013-AC-01`、`UC-FIT-013-AC-02`、`UC-FIT-013-AC-03`、`UC-FIT-013-AC-04`、`UC-FIT-013-AC-05`、`UC-FIT-013-AC-06`、`UC-FIT-013-AC-07`、`UC-FIT-013-AC-08`、`UC-FIT-013-AC-09` |
| [UC-FIT-014](../migration/legacy/需求/03_功能用例/健身管理/03_执行与饮食/UC-FIT-014_手动填写饮食记录.md) | execution | 业务语义沿用；执行位置调整 | `UC-FIT-014-AC-01`、`UC-FIT-014-AC-02`、`UC-FIT-014-AC-03` |
| [UC-FIT-015](../migration/legacy/需求/03_功能用例/健身管理/03_执行与饮食/UC-FIT-015_修正饮食摄入记录.md) | execution | 业务语义沿用；执行位置调整 | `UC-FIT-015-AC-01`、`UC-FIT-015-AC-02`、`UC-FIT-015-AC-03` |
| [UC-FIT-016](../migration/legacy/需求/03_功能用例/健身管理/03_执行与饮食/UC-FIT-016_删除误记饮食记录.md) | execution | 业务语义沿用；执行位置调整 | `UC-FIT-016-AC-01`、`UC-FIT-016-AC-02` |
| [UC-FIT-017](../migration/legacy/需求/03_功能用例/健身管理/04_复盘调整/UC-FIT-017_生成健身日复盘.md) | review | 业务语义沿用；执行位置调整 | `UC-FIT-017-AC-01`、`UC-FIT-017-AC-02`、`UC-FIT-017-AC-03` |
| [UC-FIT-018](../migration/legacy/需求/03_功能用例/健身管理/04_复盘调整/UC-FIT-018_补充并确认健身日复盘.md) | review | 业务语义沿用；执行位置调整 | `UC-FIT-018-AC-01`、`UC-FIT-018-AC-02` |
| [UC-FIT-019](../migration/legacy/需求/03_功能用例/健身管理/04_复盘调整/UC-FIT-019_生成次日调整草案.md) | review → planning | 业务语义沿用；执行位置调整 | `UC-FIT-019-AC-01`、`UC-FIT-019-AC-02`、`UC-FIT-019-AC-03` |
| [UC-FIT-020](../migration/legacy/需求/03_功能用例/健身管理/04_复盘调整/UC-FIT-020_生成健身周复盘.md) | review | 业务语义沿用；执行位置调整 | `UC-FIT-020-AC-01`、`UC-FIT-020-AC-02` |
| [UC-FIT-021](../migration/legacy/需求/03_功能用例/健身管理/04_复盘调整/UC-FIT-021_补充并确认健身周复盘.md) | review | 业务语义沿用；执行位置调整 | `UC-FIT-021-AC-01`、`UC-FIT-021-AC-02` |
| [UC-FIT-022](../migration/legacy/需求/03_功能用例/健身管理/05_历史与状态/UC-FIT-022_查看历史计划记录与复盘.md) | workspace + 四域历史 | 业务语义沿用；执行位置调整 | `UC-FIT-022-AC-01`、`UC-FIT-022-AC-02` |
| [UC-FIT-023](../migration/legacy/需求/03_功能用例/健身管理/05_历史与状态/UC-FIT-023_补记或纠正训练与睡眠记录.md) | execution | 业务语义沿用；执行位置调整 | `UC-FIT-023-AC-01`、`UC-FIT-023-AC-02` |
| [UC-FIT-024](../migration/legacy/需求/03_功能用例/健身管理/05_历史与状态/UC-FIT-024_暂停健身计划.md) | planning | 业务语义沿用；执行位置调整 | `UC-FIT-024-AC-01`、`UC-FIT-024-AC-02` |
| [UC-FIT-025](../migration/legacy/需求/03_功能用例/健身管理/05_历史与状态/UC-FIT-025_恢复并重新规划健身计划.md) | planning | 业务语义沿用；执行位置调整 | `UC-FIT-025-AC-01`、`UC-FIT-025-AC-02` |
| [UC-LRN-001](../migration/legacy/需求/03_功能用例/学习管理/UC-LRN-001_设置学习目标与周每日内容.md) | profile + planning | 业务语义沿用；执行位置调整 | `UC-LRN-001-AC-01`、`UC-LRN-001-AC-02` |
| [UC-LRN-002](../migration/legacy/需求/03_功能用例/学习管理/UC-LRN-002_登记学习执行与成果.md) | execution | 业务语义沿用；执行位置调整 | `UC-LRN-002-AC-01`、`UC-LRN-002-AC-02`、`UC-LRN-002-AC-03` |
| [UC-LRN-003](../migration/legacy/需求/03_功能用例/学习管理/UC-LRN-003_补记纠正学习记录.md) | execution → review | 业务语义沿用；执行位置调整 | `UC-LRN-003-AC-01`、`UC-LRN-003-AC-02` |
| [UC-COM-001](../migration/legacy/需求/03_功能用例/通用/UC-COM-001_微信登录与会话恢复.md) | Java identity；客户端 account-login | 业务语义沿用；执行位置调整 | `UC-COM-001-AC-01`、`UC-COM-001-AC-02` |
| [UC-COM-002](../migration/legacy/需求/03_功能用例/通用/UC-COM-002_管理数据使用授权.md) | identity 必需用途限制；客户端用途快照 | 部分沿用，完整编排暂缓 | `UC-COM-002-AC-01`、`UC-COM-002-AC-02` |
| [UC-COM-003](../migration/legacy/需求/03_功能用例/通用/UC-COM-003_导出本人数据.md) | local-runtime/backup；各域导出 | 本地加密导出替代，跨云总包暂缓 | `UC-COM-003-AC-01`、`UC-COM-003-AC-02` |
| [UC-COM-004](../migration/legacy/需求/03_功能用例/通用/UC-COM-004_请求删除本人指定数据.md) | 各域事实删除；全链路权利流程暂缓 | 全链路 AC 暂缓 | `UC-COM-004-AC-01`、`UC-COM-004-AC-02` |
| [UC-COM-005](../migration/legacy/需求/03_功能用例/通用/UC-COM-005_注销账户.md) | identity 访问停用；完整注销暂缓 | 全链路 AC 暂缓 | `UC-COM-005-AC-01`、`UC-COM-005-AC-02` |
| [UC-COM-006](../migration/legacy/需求/03_功能用例/通用/UC-COM-006_维护个人身体作息与可用条件.md) | profile | 业务语义沿用；执行位置调整 | `UC-COM-006-AC-01`、`UC-COM-006-AC-02`、`UC-COM-006-AC-03` |
| [UC-COM-007](../migration/legacy/需求/03_功能用例/通用/UC-COM-007_创建与修改分类目标.md) | planning | 业务语义沿用；执行位置调整 | `UC-COM-007-AC-01`、`UC-COM-007-AC-02`、`UC-COM-007-AC-03` |
| [UC-COM-008](../migration/legacy/需求/03_功能用例/通用/UC-COM-008_查看目标与本周下周安排.md) | planning + workspace | 业务语义沿用；执行位置调整 | `UC-COM-008-AC-01`、`UC-COM-008-AC-02`、`UC-COM-008-AC-03` |
| [UC-COM-009](../migration/legacy/需求/03_功能用例/通用/UC-COM-009_安排与编辑周每日计划草案.md) | planning | 业务语义沿用；执行位置调整 | `UC-COM-009-AC-01`、`UC-COM-009-AC-02`、`UC-COM-009-AC-03`、`UC-COM-009-AC-04` |
| [UC-COM-010](../migration/legacy/需求/03_功能用例/通用/UC-COM-010_审查并确认计划版本.md) | planning | 业务语义沿用；执行位置调整 | `UC-COM-010-AC-01`、`UC-COM-010-AC-02`、`UC-COM-010-AC-03`、`UC-COM-010-AC-04`、`UC-COM-010-AC-05`、`UC-COM-010-AC-06` |
| [UC-COM-011](../migration/legacy/需求/03_功能用例/通用/UC-COM-011_查看今日计划与执行概览.md) | workspace + 四域 | 业务语义沿用；执行位置调整 | `UC-COM-011-AC-01`、`UC-COM-011-AC-02`、`UC-COM-011-AC-03`、`UC-COM-011-AC-04`、`UC-COM-011-AC-05`、`UC-COM-011-AC-06`、`UC-COM-011-AC-07` |
| [UC-COM-012](../migration/legacy/需求/03_功能用例/通用/UC-COM-012_生成与更新每日执行结论.md) | review | 业务语义沿用；执行位置调整 | `UC-COM-012-AC-01`、`UC-COM-012-AC-02`、`UC-COM-012-AC-03` |
| [UC-COM-013](../migration/legacy/需求/03_功能用例/通用/UC-COM-013_补充并确认每日结论.md) | review | 业务语义沿用；执行位置调整 | `UC-COM-013-AC-01`、`UC-COM-013-AC-02`、`UC-COM-013-AC-03` |
| [UC-COM-014](../migration/legacy/需求/03_功能用例/通用/UC-COM-014_生成并确认每周复盘.md) | review | 业务语义沿用；执行位置调整 | `UC-COM-014-AC-01`、`UC-COM-014-AC-02`、`UC-COM-014-AC-03` |
| [UC-COM-015](../migration/legacy/需求/03_功能用例/通用/UC-COM-015_根据结论提出未来计划调整.md) | review → planning | 业务语义沿用；执行位置调整 | `UC-COM-015-AC-01`、`UC-COM-015-AC-02`、`UC-COM-015-AC-03` |
| [UC-COM-016](../migration/legacy/需求/03_功能用例/通用/UC-COM-016_暂停恢复与归档目标.md) | planning | 业务语义沿用；执行位置调整 | `UC-COM-016-AC-01`、`UC-COM-016-AC-02` |

新增 UC-NEXT-001～005 与 AC 定义见[本次范围](README.md)。前述部分/暂缓项不计入完整原 AC 验收完成。
