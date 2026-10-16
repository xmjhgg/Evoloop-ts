# execution 旧结构字段基线

共 19 张表；仅迁移输入，适用说明见[基线入口](README.md)。

## exe_fact

主键：`fact_id`；唯一键：`[["user_id", "fact_id"], ["user_id", "fact_id", "current_revision_id"], ["user_id", "kind", "active_slot_key"], ["user_id", "source_draft_id"]]`；同域引用：`[{"columns": ["user_id", "fact_id", "current_revision_id"], "table": "exe_fact_revision", "references": ["user_id", "fact_id", "revision_id"]}, {"columns": ["user_id", "source_draft_id"], "table": "exe_food_draft", "references": ["user_id", "draft_id"]}, {"columns": ["user_id", "original_protection_id"], "table": "pln_baseline_protection", "references": ["user_id", "protection_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `fact_id` | `CHAR(36)` | text | 否 | 36 |
| `kind` | `VARCHAR(16)` | text | 否 | 16 |
| `version` | `BIGINT` | integer | 否 | — |
| `current_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `lifecycle` | `VARCHAR(16)` | text | 否 | 16 |
| `original_protection_id` | `CHAR(36)` | text | 否 | 36 |
| `source_draft_id` | `CHAR(36)` | text | 是 | 36 |
| `active_slot_key` | `VARCHAR(180)` | text | 是 | 180 |
| `current_business_date` | `DATE` | date | 否 | — |
| `current_occurred_at` | `DATETIME(6)` | instant | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## exe_fact_revision

主键：`revision_id`；唯一键：`[["user_id", "revision_id"], ["user_id", "fact_id", "revision_id"], ["user_id", "fact_id", "revision_no"]]`；同域引用：`[{"columns": ["user_id", "fact_id"], "table": "exe_fact", "references": ["user_id", "fact_id"]}, {"columns": ["user_id", "fact_id", "previous_revision_id"], "table": "exe_fact_revision", "references": ["user_id", "fact_id", "revision_id"]}, {"columns": ["user_id", "original_protection_id"], "table": "pln_baseline_protection", "references": ["user_id", "protection_id"]}, {"columns": ["user_id", "validated_protection_id"], "table": "pln_baseline_protection", "references": ["user_id", "protection_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_id` | `CHAR(36)` | text | 否 | 36 |
| `fact_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_no` | `BIGINT` | integer | 否 | — |
| `kind` | `VARCHAR(16)` | text | 否 | 16 |
| `state` | `VARCHAR(16)` | text | 否 | 16 |
| `business_date` | `DATE` | date | 否 | — |
| `occurred_at` | `DATETIME(6)` | instant | 否 | — |
| `recorded_at` | `DATETIME(6)` | instant | 否 | — |
| `change_kind` | `VARCHAR(24)` | text | 否 | 24 |
| `previous_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `original_protection_id` | `CHAR(36)` | text | 否 | 36 |
| `validated_protection_id` | `CHAR(36)` | text | 否 | 36 |
| `supplemental_protection_id` | `CHAR(36)` | text | 是 | 36 |
| `baseline_date_mismatch` | `TINYINT(1)` | integer | 否 | — |
| `correction_reason` | `TEXT` | text | 是 | — |
| `request_id` | `VARCHAR(128)` | text | 否 | 128 |
| `content_hash` | `CHAR(64)` | text | 否 | 64 |

## exe_fact_baseline_ref

主键：`baseline_ref_id`；唯一键：`[["user_id", "baseline_ref_id"], ["user_id", "fact_id", "reference_goal_id", "item_id"]]`；同域引用：`[{"columns": ["user_id", "fact_id"], "table": "exe_fact", "references": ["user_id", "fact_id"]}, {"columns": ["user_id", "protection_id"], "table": "pln_baseline_protection", "references": ["user_id", "protection_id"]}, {"columns": ["user_id", "item_id"], "table": "pln_plan_item", "references": ["user_id", "item_id"]}, {"columns": ["user_id", "item_revision_id"], "table": "pln_item_revision", "references": ["user_id", "item_revision_id"]}, {"columns": ["user_id", "publication_id"], "table": "pln_publication", "references": ["user_id", "publication_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `baseline_ref_id` | `CHAR(36)` | text | 否 | 36 |
| `fact_id` | `CHAR(36)` | text | 否 | 36 |
| `protection_id` | `CHAR(36)` | text | 否 | 36 |
| `reference_goal_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `item_owner_goal_id` | `CHAR(36)` | text | 否 | 36 |
| `week_plan_id` | `CHAR(36)` | text | 否 | 36 |
| `item_id` | `CHAR(36)` | text | 否 | 36 |
| `item_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `publication_id` | `CHAR(36)` | text | 否 | 36 |
| `baseline_role` | `VARCHAR(16)` | text | 否 | 16 |
| `baseline_business_date` | `DATE` | date | 否 | — |
| `prescription_schema_version` | `VARCHAR(32)` | text | 否 | 32 |
| `prescription_snapshot` | `JSON` | json | 否 | — |

## exe_training_actual

主键：`user_id,revision_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "revision_id"], "table": "exe_fact_revision", "references": ["user_id", "revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_id` | `CHAR(36)` | text | 否 | 36 |
| `status` | `VARCHAR(24)` | text | 否 | 24 |
| `duration_minutes` | `DECIMAL(12,3)` | decimal | 是 | — |
| `feeling` | `TEXT` | text | 是 | — |
| `discomfort_state` | `VARCHAR(16)` | text | 否 | 16 |
| `discomfort_text` | `TEXT` | text | 是 | — |
| `non_execution_reason` | `TEXT` | text | 是 | — |
| `action_detail_state` | `VARCHAR(16)` | text | 否 | 16 |

## exe_training_action_actual

主键：`action_actual_id`；唯一键：`[["user_id", "action_actual_id"], ["user_id", "revision_id", "action_actual_id"], ["user_id", "revision_id", "ordinal"]]`；同域引用：`[{"columns": ["user_id", "revision_id"], "table": "exe_training_actual", "references": ["user_id", "revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `action_actual_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_id` | `CHAR(36)` | text | 否 | 36 |
| `ordinal` | `INT` | integer | 否 | — |
| `planned_action_id` | `CHAR(36)` | text | 是 | 36 |
| `name` | `VARCHAR(200)` | text | 否 | 200 |
| `actual_set_count` | `INT` | integer | 是 | — |
| `detail_state` | `VARCHAR(16)` | text | 否 | 16 |

## exe_training_set_actual

主键：`user_id,action_actual_id,set_no`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "action_actual_id"], "table": "exe_training_action_actual", "references": ["user_id", "action_actual_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `action_actual_id` | `CHAR(36)` | text | 否 | 36 |
| `set_no` | `INT` | integer | 否 | — |
| `actual_quantity` | `DECIMAL(12,3)` | decimal | 是 | — |
| `quantity_unit` | `VARCHAR(16)` | text | 是 | 16 |
| `load_value` | `DECIMAL(12,3)` | decimal | 是 | — |
| `load_unit` | `VARCHAR(16)` | text | 是 | 16 |
| `feeling` | `VARCHAR(500)` | text | 是 | 500 |

## exe_learning_actual

主键：`user_id,revision_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "revision_id"], "table": "exe_fact_revision", "references": ["user_id", "revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_id` | `CHAR(36)` | text | 否 | 36 |
| `status` | `VARCHAR(24)` | text | 否 | 24 |
| `actual_content` | `TEXT` | text | 是 | — |
| `outcome` | `TEXT` | text | 是 | — |
| `difficulties` | `TEXT` | text | 是 | — |
| `non_execution_reason` | `TEXT` | text | 是 | — |

## exe_learning_fragment

主键：`user_id,revision_id,fragment_id`；唯一键：`[["user_id", "revision_id", "fragment_key"], ["user_id", "revision_id", "ordinal"]]`；同域引用：`[{"columns": ["user_id", "revision_id"], "table": "exe_learning_actual", "references": ["user_id", "revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_id` | `CHAR(36)` | text | 否 | 36 |
| `fragment_id` | `CHAR(36)` | text | 否 | 36 |
| `fragment_key` | `VARCHAR(128)` | text | 否 | 128 |
| `ordinal` | `INT` | integer | 否 | — |
| `occurred_at` | `DATETIME(6)` | instant | 否 | — |
| `actual_quantity` | `DECIMAL(12,3)` | decimal | 是 | — |
| `quantity_unit` | `VARCHAR(24)` | text | 是 | 24 |
| `duration_minutes` | `DECIMAL(12,3)` | decimal | 是 | — |
| `outcome` | `TEXT` | text | 是 | — |

## exe_sleep_actual

主键：`user_id,revision_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "revision_id"], "table": "exe_fact_revision", "references": ["user_id", "revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_id` | `CHAR(36)` | text | 否 | 36 |
| `status` | `VARCHAR(16)` | text | 否 | 16 |
| `begin_at` | `DATETIME(6)` | instant | 否 | — |
| `end_at` | `DATETIME(6)` | instant | 是 | — |
| `provisional` | `TINYINT(1)` | integer | 否 | — |
| `expected_wake_date` | `DATE` | date | 是 | — |
| `quality` | `VARCHAR(40)` | text | 是 | 40 |
| `feeling` | `TEXT` | text | 是 | — |

## exe_meal_actual

主键：`user_id,revision_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "revision_id"], "table": "exe_fact_revision", "references": ["user_id", "revision_id"]}, {"columns": ["user_id", "source_draft_id", "source_draft_revision_id"], "table": "exe_food_draft_revision", "references": ["user_id", "draft_id", "revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_id` | `CHAR(36)` | text | 否 | 36 |
| `meal_code` | `VARCHAR(32)` | text | 否 | 32 |
| `source_draft_id` | `CHAR(36)` | text | 否 | 36 |
| `source_draft_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `confirmed_at` | `DATETIME(6)` | instant | 否 | — |
| `portion_check_state` | `VARCHAR(24)` | text | 否 | 24 |
| `note` | `TEXT` | text | 是 | — |

## exe_food_draft

主键：`draft_id`；唯一键：`[["user_id", "draft_id"], ["user_id", "draft_id", "current_revision_id"]]`；同域引用：`[{"columns": ["user_id", "draft_id", "current_revision_id"], "table": "exe_food_draft_revision", "references": ["user_id", "draft_id", "revision_id"]}, {"columns": ["user_id", "confirmed_fact_id"], "table": "exe_fact", "references": ["user_id", "fact_id"]}, {"columns": ["user_id", "correction_of_fact_id"], "table": "exe_fact", "references": ["user_id", "fact_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `draft_id` | `CHAR(36)` | text | 否 | 36 |
| `version` | `BIGINT` | integer | 否 | — |
| `current_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `status` | `VARCHAR(24)` | text | 否 | 24 |
| `confirmed_fact_id` | `CHAR(36)` | text | 是 | 36 |
| `correction_of_fact_id` | `CHAR(36)` | text | 是 | 36 |
| `expected_fact_version` | `BIGINT` | integer | 是 | — |
| `active_task_id` | `CHAR(36)` | text | 是 | 36 |
| `current_business_date` | `DATE` | date | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## exe_food_draft_revision

主键：`revision_id`；唯一键：`[["user_id", "revision_id"], ["user_id", "draft_id", "revision_id"], ["user_id", "draft_id", "revision_no"]]`；同域引用：`[{"columns": ["user_id", "draft_id"], "table": "exe_food_draft", "references": ["user_id", "draft_id"]}, {"columns": ["user_id", "draft_id", "previous_revision_id"], "table": "exe_food_draft_revision", "references": ["user_id", "draft_id", "revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_id` | `CHAR(36)` | text | 否 | 36 |
| `draft_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_no` | `BIGINT` | integer | 否 | — |
| `previous_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `business_date` | `DATE` | date | 否 | — |
| `meal_code` | `VARCHAR(32)` | text | 否 | 32 |
| `mode` | `VARCHAR(16)` | text | 否 | 16 |
| `description` | `TEXT` | text | 是 | — |
| `revision_kind` | `VARCHAR(24)` | text | 否 | 24 |
| `input_hash` | `CHAR(64)` | text | 否 | 64 |
| `task_id` | `CHAR(36)` | text | 是 | 36 |
| `result_schema_version` | `VARCHAR(32)` | text | 是 | 32 |
| `information_state` | `VARCHAR(24)` | text | 否 | 24 |
| `missing_items` | `JSON` | json | 否 | — |
| `assumptions` | `JSON` | json | 否 | — |
| `request_id` | `VARCHAR(128)` | text | 否 | 128 |

## exe_food_line

主键：`line_id`；唯一键：`[["user_id", "line_id"], ["user_id", "draft_revision_id", "ordinal"], ["user_id", "fact_revision_id", "ordinal"], ["user_id", "draft_revision_id", "stable_line_key"], ["user_id", "fact_revision_id", "stable_line_key"]]`；同域引用：`[{"columns": ["user_id", "draft_revision_id"], "table": "exe_food_draft_revision", "references": ["user_id", "revision_id"]}, {"columns": ["user_id", "fact_revision_id"], "table": "exe_meal_actual", "references": ["user_id", "revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `line_id` | `CHAR(36)` | text | 否 | 36 |
| `owner_kind` | `VARCHAR(16)` | text | 否 | 16 |
| `draft_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `fact_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `stable_line_key` | `VARCHAR(128)` | text | 否 | 128 |
| `ordinal` | `INT` | integer | 否 | — |
| `food_name` | `VARCHAR(200)` | text | 否 | 200 |
| `preparation` | `VARCHAR(500)` | text | 是 | 500 |
| `merge_state` | `VARCHAR(24)` | text | 否 | 24 |
| `actually_eaten` | `TINYINT(1)` | integer | 是 | — |

## exe_personal_portion

主键：`user_id,line_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "line_id"], "table": "exe_food_line", "references": ["user_id", "line_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `line_id` | `CHAR(36)` | text | 否 | 36 |
| `knowledge_state` | `VARCHAR(16)` | text | 否 | 16 |
| `quantity` | `DECIMAL(18,6)` | decimal | 是 | — |
| `quantity_unit` | `VARCHAR(16)` | text | 是 | 16 |
| `lower_quantity` | `DECIMAL(18,6)` | decimal | 是 | — |
| `upper_quantity` | `DECIMAL(18,6)` | decimal | 是 | — |
| `reference_quantity` | `DECIMAL(18,6)` | decimal | 是 | — |
| `reference_unit` | `VARCHAR(16)` | text | 是 | 16 |
| `verified_personal` | `TINYINT(1)` | integer | 否 | — |
| `verification_basis` | `VARCHAR(24)` | text | 否 | 24 |
| `basis_description` | `TEXT` | text | 是 | — |
| `unknown_reason` | `VARCHAR(100)` | text | 是 | 100 |

## exe_nutrition_value

主键：`user_id,line_id,nutrient_code`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "line_id"], "table": "exe_food_line", "references": ["user_id", "line_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `line_id` | `CHAR(36)` | text | 否 | 36 |
| `nutrient_code` | `VARCHAR(24)` | text | 否 | 24 |
| `knowledge_state` | `VARCHAR(16)` | text | 否 | 16 |
| `normalized_value` | `DECIMAL(18,6)` | decimal | 是 | — |
| `lower_value` | `DECIMAL(18,6)` | decimal | 是 | — |
| `upper_value` | `DECIMAL(18,6)` | decimal | 是 | — |
| `normalized_unit` | `VARCHAR(16)` | text | 否 | 16 |
| `source_kind` | `VARCHAR(24)` | text | 否 | 24 |
| `source_provider_code` | `VARCHAR(100)` | text | 是 | 100 |
| `source_entry_ref` | `VARCHAR(200)` | text | 是 | 200 |
| `source_version` | `VARCHAR(100)` | text | 是 | 100 |
| `source_obtained_at` | `DATETIME(6)` | instant | 是 | — |
| `raw_value` | `DECIMAL(18,6)` | decimal | 是 | — |
| `raw_lower` | `DECIMAL(18,6)` | decimal | 是 | — |
| `raw_upper` | `DECIMAL(18,6)` | decimal | 是 | — |
| `raw_unit` | `VARCHAR(16)` | text | 是 | 16 |
| `basis_kind` | `VARCHAR(24)` | text | 是 | 24 |
| `basis_quantity` | `DECIMAL(18,6)` | decimal | 是 | — |
| `basis_unit` | `VARCHAR(16)` | text | 是 | 16 |
| `conversion_version` | `VARCHAR(64)` | text | 是 | 64 |
| `source_note` | `TEXT` | text | 是 | — |
| `unknown_reason` | `VARCHAR(100)` | text | 是 | 100 |

## exe_food_photo

主键：`photo_id`；唯一键：`[["user_id", "photo_id"], ["user_id", "upload_intent_id"]]`；同域引用：`[]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `photo_id` | `CHAR(36)` | text | 否 | 36 |
| `upload_intent_id` | `CHAR(36)` | text | 否 | 36 |
| `version` | `BIGINT` | integer | 否 | — |
| `status` | `VARCHAR(24)` | text | 否 | 24 |
| `controlled_storage_key` | `VARCHAR(500)` | text | 是 | 500 |
| `content_digest` | `CHAR(64)` | text | 否 | 64 |
| `mime_type` | `VARCHAR(100)` | text | 否 | 100 |
| `byte_size` | `BIGINT` | integer | 否 | — |
| `width_pixels` | `INT` | integer | 是 | — |
| `height_pixels` | `INT` | integer | 是 | — |
| `explicit_selected_at` | `DATETIME(6)` | instant | 否 | — |
| `authorization_version` | `BIGINT` | integer | 否 | — |
| `deletion_epoch` | `BIGINT` | integer | 否 | — |
| `available_at` | `DATETIME(6)` | instant | 是 | — |
| `expires_at` | `DATETIME(6)` | instant | 是 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## exe_draft_photo_ref

主键：`user_id,draft_revision_id,photo_id`；唯一键：`[["user_id", "draft_revision_id", "ordinal"]]`；同域引用：`[{"columns": ["user_id", "draft_revision_id"], "table": "exe_food_draft_revision", "references": ["user_id", "revision_id"]}, {"columns": ["user_id", "photo_id"], "table": "exe_food_photo", "references": ["user_id", "photo_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `draft_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `photo_id` | `CHAR(36)` | text | 否 | 36 |
| `ordinal` | `INT` | integer | 否 | — |
| `image_digest` | `CHAR(64)` | text | 否 | 64 |
| `annotation` | `VARCHAR(500)` | text | 是 | 500 |

## exe_line_photo_evidence

主键：`user_id,line_id,photo_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "line_id"], "table": "exe_food_line", "references": ["user_id", "line_id"]}, {"columns": ["user_id", "photo_id"], "table": "exe_food_photo", "references": ["user_id", "photo_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `line_id` | `CHAR(36)` | text | 否 | 36 |
| `photo_id` | `CHAR(36)` | text | 否 | 36 |
| `evidence_role` | `VARCHAR(24)` | text | 否 | 24 |

## exe_source_scope

主键：`user_id,scope_type,scope_key`；唯一键：`[]`；同域引用：`[]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `scope_type` | `VARCHAR(32)` | text | 否 | 32 |
| `scope_key` | `VARCHAR(180)` | text | 否 | 180 |
| `scope_version` | `BIGINT` | integer | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |
