# 旧工程到新工程的职责与数据映射

## 模块映射

| 旧位置/能力 | 新位置 | 处置 |
| --- | --- | --- |
| Java profile/planning/execution/review | packages/client-business-core 四域 | 重写为 TS 本地用例；旧实现仅作预期结果基线 |
| Java workspace 业务查询 | client-business-core/workspace/queries | 本地公开查询组合，UI 另按页面分工 |
| Java identity 全功能 | Java identity + 本地账户/用途快照 | 注册增量；完整权利编排暂缓 |
| Java ai 的执行与业务接纳 | Java ai 技术任务 + 各本地所有域 | 不把业务接纳回调留在 Java |
| 旧 packages/local-core/runtime | client-business-core + local-runtime + storage-* + Platform | 按职责拆分，不搬巨型 runtime |
| 旧同步写表服务 | Java sync 容器存储 + 客户端对账 | 版本化新协议，不修改旧 API 语义 |
| 旧 MySQL 业务 DDL | data-schema 本地结构迁移输入 | 不复制进新 Java Flyway |

## 实际旧表清单

读取旧 `backend/src/main/resources/db/migration/*.sql`，识别 144 个 CREATE TABLE；其中实际旧同步结构列出 95 张业务表。不是从“95”反推所有表数量。这里只做静态去向分类，尚未读生产数据、证明字段等价或执行迁移；未入同步范围的历史作业也不能直接删除。

| 旧表 | 定义来源 | 目标/保留位置 | 迁移处置 |
| --- | --- | --- | --- |
| `ai_export_manifest` | `V060__ai_initial.sql` | 旧 AI 审计；新 Java ai 自建技术表 | 收口在途任务与输入引用，旧结果重新核验来源，不自动续执行业务 |
| `ai_export_manifest_item` | `V060__ai_initial.sql` | 旧 AI 审计；新 Java ai 自建技术表 | 收口在途任务与输入引用，旧结果重新核验来源，不自动续执行业务 |
| `ai_input_snapshot` | `V060__ai_initial.sql` | 旧 AI 审计；新 Java ai 自建技术表 | 收口在途任务与输入引用，旧结果重新核验来源，不自动续执行业务 |
| `ai_privacy_work` | `V060__ai_initial.sql` | 旧 AI 审计；新 Java ai 自建技术表 | 收口在途任务与输入引用，旧结果重新核验来源，不自动续执行业务 |
| `ai_task` | `V060__ai_initial.sql` | 旧 AI 审计；新 Java ai 自建技术表 | 收口在途任务与输入引用，旧结果重新核验来源，不自动续执行业务 |
| `ai_task_acceptance` | `V060__ai_initial.sql` | 旧 AI 审计；新 Java ai 自建技术表 | 收口在途任务与输入引用，旧结果重新核验来源，不自动续执行业务 |
| `ai_task_attempt` | `V060__ai_initial.sql` | 旧 AI 审计；新 Java ai 自建技术表 | 收口在途任务与输入引用，旧结果重新核验来源，不自动续执行业务 |
| `ai_task_purpose` | `V060__ai_initial.sql` | 旧 AI 审计；新 Java ai 自建技术表 | 收口在途任务与输入引用，旧结果重新核验来源，不自动续执行业务 |
| `ai_task_resource_ref` | `V060__ai_initial.sql` | 旧 AI 审计；新 Java ai 自建技术表 | 收口在途任务与输入引用，旧结果重新核验来源，不自动续执行业务 |
| `ai_task_result` | `V060__ai_initial.sql` | 旧 AI 审计；新 Java ai 自建技术表 | 收口在途任务与输入引用，旧结果重新核验来源，不自动续执行业务 |
| `ai_task_revision` | `V060__ai_initial.sql` | 旧 AI 审计；新 Java ai 自建技术表 | 收口在途任务与输入引用，旧结果重新核验来源，不自动续执行业务 |
| `ai_task_scope_token` | `V060__ai_initial.sql` | 旧 AI 审计；新 Java ai 自建技术表 | 收口在途任务与输入引用，旧结果重新核验来源，不自动续执行业务 |
| `ai_task_source_ref` | `V060__ai_initial.sql` | 旧 AI 审计；新 Java ai 自建技术表 | 收口在途任务与输入引用，旧结果重新核验来源，不自动续执行业务 |
| `event_publication` | `V001__runtime_support.sql` | 旧运行时审计 + 本地意图迁移核对 | 冻结并盘点未决命令/事件；不能复制为 Java 领域总线或静默丢弃 |
| `exe_cleanup_object` | `V040__execution_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `exe_cleanup_work` | `V040__execution_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `exe_draft_photo_ref` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_export_capture` | `V040__execution_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `exe_export_member` | `V040__execution_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `exe_fact` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_fact_baseline_ref` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_fact_revision` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_food_draft` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_food_draft_revision` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_food_line` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_food_photo` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_learning_actual` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_learning_fragment` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_line_photo_evidence` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_meal_actual` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_nutrition_lookup_job` | `V040__execution_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `exe_nutrition_value` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_personal_portion` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_sleep_actual` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_source_scope` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_training_action_actual` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_training_actual` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `exe_training_set_actual` | `V040__execution_initial.sql` | 客户端 execution，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `idn_account` | `V010__identity_initial.sql` | Java identity 独立库 | 显式账户映射；哈希/会话/授权兼容单独验证，不按用户名合并 |
| `idn_authorization_grant` | `V010__identity_initial.sql` | Java identity 独立库 | 显式账户映射；哈希/会话/授权兼容单独验证，不按用户名合并 |
| `idn_authorization_revision` | `V010__identity_initial.sql` | Java identity 独立库 | 显式账户映射；哈希/会话/授权兼容单独验证，不按用户名合并 |
| `idn_data_request` | `V010__identity_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `idn_data_request_scope` | `V010__identity_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `idn_data_request_target` | `V010__identity_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `idn_export_artifact` | `V010__identity_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `idn_login_exchange` | `V010__identity_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `idn_password_identity` | `V120__password_identity.sql` | Java identity 独立库 | 显式账户映射；哈希/会话/授权兼容单独验证，不按用户名合并 |
| `idn_progress_credential` | `V010__identity_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `idn_request_stage` | `V010__identity_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `idn_session` | `V010__identity_initial.sql` | Java identity 独立库 | 显式账户映射；哈希/会话/授权兼容单独验证，不按用户名合并 |
| `idn_stage_receipt` | `V010__identity_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `idn_wechat_identity` | `V010__identity_initial.sql` | Java identity 独立库 | 显式账户映射；哈希/会话/授权兼容单独验证，不按用户名合并 |
| `pln_adjustment_patch` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_baseline_protection` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_calculation_parameter` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_daily_intake_guard` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_draft_basis` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_draft_manifest` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_draft_revision` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_fitness_assessment` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_fitness_assessment_issue` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_future_suspension` | `V100__future_suspensions.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_goal` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_goal_revision` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_intake_frozen_total` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_issue_resolution` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_item_guard` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_item_revision` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_learning_prescription` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_nutrition_calculation` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_nutrition_prescription` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_plan_item` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_plan_review` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_policy_bundle` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_protection_ref` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_publication` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_publication_manifest` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_review_issue` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_shared_selection_head` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_shared_selection_member` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_shared_selection_revision` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_source_entry` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_source_scope` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_source_set` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_week_plan` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `pln_workout_action` | `V030__planning_initial.sql` | 客户端 planning，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_availability_window_revision` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_body_measurement` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_body_state_revision` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_condition_resource_revision` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_condition_revision` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_condition_section` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_daily_body_state` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_daily_body_state_slot` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_data_request_selection` | `V020__profile_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `prf_data_request_work` | `V020__profile_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `prf_fitness_condition_revision` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_learning_condition_revision` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_long_term_restriction_revision` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_measurement_revision` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_measurement_value_revision` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_personal_profile` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_routine_sleep_revision` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `prf_source_scope` | `V020__profile_initial.sql` | 客户端 profile，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_adjustment_patch` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_adjustment_suggestion` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_cleanup_object` | `V050__review_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `rev_component` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_component_coverage` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_component_manual_ref` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_component_metric` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_confirmation` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_confirmation_component` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_confirmation_head` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_coverage_item` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_daily_document` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_data_request_work` | `V050__review_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `rev_document` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_export_capture` | `V050__review_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `rev_export_member` | `V050__review_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `rev_generation_request` | `V050__review_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `rev_generation_slot` | `V050__review_initial.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `rev_manual_entry` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_manual_revision` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_revision` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_revision_slot` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_source_entry` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_source_scope` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_source_set` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_statement` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_statement_support` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_submission` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_submission_patch` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_suggestion_basis` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_suggestion_revision` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `rev_weekly_document` | `V050__review_initial.sql` | 客户端 review，三本地适配；Java 只存同步容器 | 保留业务结构/历史/引用；按客户端 Schema 转换 |
| `sys_command_receipt` | `V001__runtime_support.sql` | 旧运行时审计 + 本地意图迁移核对 | 冻结并盘点未决命令/事件；不能复制为 Java 领域总线或静默丢弃 |
| `sys_event_consumption` | `V001__runtime_support.sql` | 旧运行时审计 + 本地意图迁移核对 | 冻结并盘点未决命令/事件；不能复制为 Java 领域总线或静默丢弃 |
| `sys_planning_rule_selection` | `V001__runtime_support.sql` | 客户端批准策略版本来源 | 保留选择/版本证据；不保留云端业务规则锁，不自行批准新参数 |
| `sys_privacy_artifact` | `V080__privacy_artifacts.sql` | 历史工作/权利请求审计与人工迁移清单 | 原系统收口未决作业与真实阶段；保留证据，不假称新模块已接管 |
| `sys_sync_account` | `V130__local_table_sync.sql` | 旧协议审计/迁移输入 | 不原位沿用新协议；转换旧队列/根/回执，不能丢失未决操作 |
| `sys_sync_backup` | `V130__local_table_sync.sql` | 旧协议审计/迁移输入 | 不原位沿用新协议；转换旧队列/根/回执，不能丢失未决操作 |
| `sys_sync_log` | `V130__local_table_sync.sql` | 旧协议审计/迁移输入 | 不原位沿用新协议；转换旧队列/根/回执，不能丢失未决操作 |
| `sys_sync_receipt` | `V130__local_table_sync.sql` | 旧协议审计/迁移输入 | 不原位沿用新协议；转换旧队列/根/回执，不能丢失未决操作 |

原 DDL 的后续 ALTER 增量、数据实值、照片和设备队列仍须在代码迁移阶段一并核对；本次 CREATE TABLE 清单不代替最终结构解析。字段基线见[legacy-schema](legacy-schema/README.md)。
