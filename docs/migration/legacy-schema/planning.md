# planning 旧结构字段基线

共 34 张表；仅迁移输入，适用说明见[基线入口](README.md)。

## pln_goal

主键：`goal_id`；唯一键：`[["user_id", "goal_id"]]`；同域引用：`[{"columns": ["user_id", "goal_id", "current_revision_id"], "table": "pln_goal_revision", "references": ["user_id", "goal_id", "revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_id` | `CHAR(36)` | text | 否 | 36 |
| `category` | `VARCHAR(16)` | text | 否 | 16 |
| `status` | `VARCHAR(24)` | text | 否 | 24 |
| `version` | `BIGINT` | integer | 否 | — |
| `current_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## pln_goal_revision

主键：`revision_id`；唯一键：`[["user_id", "goal_id", "revision_id"], ["user_id", "goal_id", "revision_no"]]`；同域引用：`[{"columns": ["user_id", "goal_id"], "table": "pln_goal", "references": ["user_id", "goal_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_no` | `BIGINT` | integer | 否 | — |
| `category` | `VARCHAR(16)` | text | 否 | 16 |
| `status` | `VARCHAR(24)` | text | 否 | 24 |
| `effective_at` | `DATETIME(6)` | instant | 否 | — |
| `name` | `VARCHAR(200)` | text | 否 | 200 |
| `description` | `TEXT` | text | 是 | — |
| `measure_text` | `VARCHAR(500)` | text | 是 | 500 |
| `target_value` | `DECIMAL(12,3)` | decimal | 是 | — |
| `target_unit` | `VARCHAR(24)` | text | 是 | 24 |
| `start_date` | `DATE` | date | 否 | — |
| `expected_end_date` | `DATE` | date | 是 | — |
| `fitness_direction` | `VARCHAR(16)` | text | 是 | 16 |
| `learning_theme` | `VARCHAR(300)` | text | 是 | 300 |
| `change_reason` | `TEXT` | text | 是 | — |
| `request_id` | `CHAR(36)` | text | 否 | 36 |

## pln_week_plan

主键：`week_plan_id`；唯一键：`[["user_id", "week_plan_id"], ["user_id", "goal_id", "week_start_date"]]`；同域引用：`[{"columns": ["user_id", "goal_id"], "table": "pln_goal", "references": ["user_id", "goal_id"]}, {"columns": ["user_id", "week_plan_id", "current_draft_revision_id"], "table": "pln_draft_revision", "references": ["user_id", "week_plan_id", "draft_revision_id"]}, {"columns": ["user_id", "week_plan_id", "latest_publication_id"], "table": "pln_publication", "references": ["user_id", "week_plan_id", "publication_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `week_plan_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_id` | `CHAR(36)` | text | 否 | 36 |
| `week_start_date` | `DATE` | date | 否 | — |
| `version` | `BIGINT` | integer | 否 | — |
| `current_draft_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `latest_publication_id` | `CHAR(36)` | text | 是 | 36 |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## pln_draft_revision

主键：`draft_revision_id`；唯一键：`[["user_id", "draft_revision_id"], ["user_id", "week_plan_id", "draft_revision_id"], ["user_id", "week_plan_id", "draft_no"]]`；同域引用：`[{"columns": ["user_id", "week_plan_id"], "table": "pln_week_plan", "references": ["user_id", "week_plan_id"]}, {"columns": ["user_id", "goal_id", "goal_revision_id"], "table": "pln_goal_revision", "references": ["user_id", "goal_id", "revision_id"]}, {"columns": ["user_id", "source_set_id"], "table": "pln_source_set", "references": ["user_id", "source_set_id"]}, {"columns": ["user_id", "week_plan_id", "base_publication_id"], "table": "pln_publication", "references": ["user_id", "week_plan_id", "publication_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `draft_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `week_plan_id` | `CHAR(36)` | text | 否 | 36 |
| `draft_no` | `BIGINT` | integer | 否 | — |
| `goal_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `week_focus` | `TEXT` | text | 是 | — |
| `source_mode` | `VARCHAR(16)` | text | 否 | 16 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `input_hash` | `CHAR(64)` | text | 否 | 64 |
| `base_publication_id` | `CHAR(36)` | text | 是 | 36 |
| `request_id` | `CHAR(36)` | text | 否 | 36 |

## pln_plan_item

主键：`item_id`；唯一键：`[["user_id", "item_id"], ["user_id", "week_plan_id", "item_id"], ["user_id", "week_plan_id", "business_date", "slot_key"]]`；同域引用：`[{"columns": ["user_id", "week_plan_id"], "table": "pln_week_plan", "references": ["user_id", "week_plan_id"]}, {"columns": ["user_id", "item_id", "current_published_revision_id"], "table": "pln_item_revision", "references": ["user_id", "item_id", "item_revision_id"]}, {"columns": ["user_id", "week_plan_id", "current_publication_id"], "table": "pln_publication", "references": ["user_id", "week_plan_id", "publication_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `item_id` | `CHAR(36)` | text | 否 | 36 |
| `week_plan_id` | `CHAR(36)` | text | 否 | 36 |
| `business_date` | `DATE` | date | 否 | — |
| `slot_key` | `VARCHAR(64)` | text | 否 | 64 |
| `current_published_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `current_publication_id` | `CHAR(36)` | text | 是 | 36 |
| `version` | `BIGINT` | integer | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## pln_item_revision

主键：`item_revision_id`；唯一键：`[["user_id", "item_id", "item_revision_id"], ["user_id", "item_revision_id"], ["user_id", "item_id", "revision_no"]]`；同域引用：`[{"columns": ["user_id", "item_id"], "table": "pln_plan_item", "references": ["user_id", "item_id"]}, {"columns": ["user_id", "goal_id", "goal_revision_id"], "table": "pln_goal_revision", "references": ["user_id", "goal_id", "revision_id"]}, {"columns": ["user_id", "parent_nutrition_item_id"], "table": "pln_plan_item", "references": ["user_id", "item_id"]}, {"columns": ["user_id", "source_set_id"], "table": "pln_source_set", "references": ["user_id", "source_set_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `item_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `item_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_no` | `BIGINT` | integer | 否 | — |
| `goal_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `kind` | `VARCHAR(24)` | text | 否 | 24 |
| `disposition` | `VARCHAR(16)` | text | 否 | 16 |
| `title` | `VARCHAR(200)` | text | 否 | 200 |
| `content` | `TEXT` | text | 是 | — |
| `start_at` | `DATETIME(6)` | instant | 是 | — |
| `end_at` | `DATETIME(6)` | instant | 是 | — |
| `effective_not_before` | `DATETIME(6)` | instant | 是 | — |
| `quantity` | `DECIMAL(12,3)` | decimal | 是 | — |
| `quantity_unit` | `VARCHAR(24)` | text | 是 | 24 |
| `training_type` | `VARCHAR(16)` | text | 是 | 16 |
| `parent_nutrition_item_id` | `CHAR(36)` | text | 是 | 36 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |

## pln_draft_manifest

主键：`user_id,draft_revision_id,item_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "week_plan_id", "draft_revision_id"], "table": "pln_draft_revision", "references": ["user_id", "week_plan_id", "draft_revision_id"]}, {"columns": ["user_id", "week_plan_id", "item_id"], "table": "pln_plan_item", "references": ["user_id", "week_plan_id", "item_id"]}, {"columns": ["user_id", "item_id", "item_revision_id"], "table": "pln_item_revision", "references": ["user_id", "item_id", "item_revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `draft_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `week_plan_id` | `CHAR(36)` | text | 否 | 36 |
| `item_id` | `CHAR(36)` | text | 否 | 36 |
| `item_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `display_order` | `INT` | integer | 否 | — |

## pln_workout_action

主键：`user_id,item_revision_id,action_id`；唯一键：`[["user_id", "item_revision_id", "ordinal"]]`；同域引用：`[{"columns": ["user_id", "item_revision_id"], "table": "pln_item_revision", "references": ["user_id", "item_revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `item_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `action_id` | `CHAR(36)` | text | 否 | 36 |
| `ordinal` | `INT` | integer | 否 | — |
| `name` | `VARCHAR(200)` | text | 否 | 200 |
| `set_count` | `INT` | integer | 否 | — |
| `per_set_quantity` | `DECIMAL(12,3)` | decimal | 否 | — |
| `quantity_unit` | `VARCHAR(12)` | text | 否 | 12 |
| `rest_seconds` | `INT` | integer | 否 | — |

## pln_learning_prescription

主键：`item_revision_id`；唯一键：`[["user_id", "item_revision_id"]]`；同域引用：`[{"columns": ["user_id", "item_revision_id"], "table": "pln_item_revision", "references": ["user_id", "item_revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `item_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `topic` | `VARCHAR(300)` | text | 否 | 300 |
| `resource_text` | `TEXT` | text | 是 | — |
| `expected_outcome` | `TEXT` | text | 是 | — |

## pln_nutrition_prescription

主键：`item_revision_id`；唯一键：`[["user_id", "item_revision_id"]]`；同域引用：`[{"columns": ["user_id", "item_revision_id"], "table": "pln_item_revision", "references": ["user_id", "item_revision_id"]}, {"columns": ["user_id", "calculation_id"], "table": "pln_nutrition_calculation", "references": ["user_id", "calculation_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `item_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `energy_kcal` | `DECIMAL(12,3)` | decimal | 是 | — |
| `energy_lower_kcal` | `DECIMAL(12,3)` | decimal | 是 | — |
| `energy_upper_kcal` | `DECIMAL(12,3)` | decimal | 是 | — |
| `protein_g` | `DECIMAL(12,3)` | decimal | 是 | — |
| `fat_g` | `DECIMAL(12,3)` | decimal | 是 | — |
| `carbohydrate_g` | `DECIMAL(12,3)` | decimal | 是 | — |
| `knowledge_state` | `VARCHAR(24)` | text | 否 | 24 |
| `meal_code` | `VARCHAR(32)` | text | 是 | 32 |
| `calculation_id` | `CHAR(36)` | text | 是 | 36 |

## pln_policy_bundle

主键：`policy_bundle_id`；唯一键：`[["user_id", "policy_bundle_id"], ["user_id", "rule_scope", "policy_version"]]`；同域引用：`[]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `policy_bundle_id` | `CHAR(36)` | text | 否 | 36 |
| `rule_scope` | `VARCHAR(64)` | text | 否 | 64 |
| `policy_version` | `VARCHAR(64)` | text | 否 | 64 |
| `approval_state` | `VARCHAR(24)` | text | 否 | 24 |
| `schema_version` | `VARCHAR(32)` | text | 否 | 32 |
| `configuration` | `JSON` | json | 否 | — |
| `approved_at` | `DATETIME(6)` | instant | 是 | — |
| `approval_reference` | `VARCHAR(300)` | text | 是 | 300 |
| `content_hash` | `CHAR(64)` | text | 否 | 64 |

## pln_nutrition_calculation

主键：`calculation_id`；唯一键：`[["user_id", "calculation_id"]]`；同域引用：`[{"columns": ["user_id", "policy_bundle_id"], "table": "pln_policy_bundle", "references": ["user_id", "policy_bundle_id"]}, {"columns": ["user_id", "source_set_id"], "table": "pln_source_set", "references": ["user_id", "source_set_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `calculation_id` | `CHAR(36)` | text | 否 | 36 |
| `policy_bundle_id` | `CHAR(36)` | text | 是 | 36 |
| `method_code` | `VARCHAR(64)` | text | 是 | 64 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `status` | `VARCHAR(24)` | text | 否 | 24 |
| `missing_parameters` | `JSON` | json | 否 | — |
| `output_energy_kcal` | `DECIMAL(12,3)` | decimal | 是 | — |
| `output_protein_g` | `DECIMAL(12,3)` | decimal | 是 | — |
| `output_fat_g` | `DECIMAL(12,3)` | decimal | 是 | — |
| `output_carbohydrate_g` | `DECIMAL(12,3)` | decimal | 是 | — |
| `explanation` | `TEXT` | text | 是 | — |

## pln_calculation_parameter

主键：`user_id,calculation_id,parameter_code`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "calculation_id"], "table": "pln_nutrition_calculation", "references": ["user_id", "calculation_id"]}, {"columns": ["user_id", "source_entry_id"], "table": "pln_source_entry", "references": ["user_id", "entry_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `calculation_id` | `CHAR(36)` | text | 否 | 36 |
| `parameter_code` | `VARCHAR(64)` | text | 否 | 64 |
| `numeric_value` | `DECIMAL(16,6)` | decimal | 是 | — |
| `text_value` | `VARCHAR(500)` | text | 是 | 500 |
| `unit` | `VARCHAR(24)` | text | 是 | 24 |
| `source_entry_id` | `CHAR(36)` | text | 是 | 36 |
| `knowledge_state` | `VARCHAR(16)` | text | 否 | 16 |

## pln_source_set

主键：`source_set_id`；唯一键：`[["user_id", "source_set_id"]]`；同域引用：`[]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `set_hash` | `CHAR(64)` | text | 否 | 64 |
| `cutoff_at` | `DATETIME(6)` | instant | 否 | — |
| `authorization_version` | `BIGINT` | integer | 否 | — |
| `deletion_epoch` | `BIGINT` | integer | 否 | — |

## pln_source_entry

主键：`entry_id`；唯一键：`[["user_id", "entry_id"], ["user_id", "source_set_id", "entry_kind", "owner_module", "canonical_key"]]`；同域引用：`[{"columns": ["user_id", "source_set_id"], "table": "pln_source_set", "references": ["user_id", "source_set_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `entry_id` | `CHAR(36)` | text | 否 | 36 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `entry_kind` | `VARCHAR(12)` | text | 否 | 12 |
| `owner_module` | `VARCHAR(16)` | text | 否 | 16 |
| `canonical_key` | `VARCHAR(512)` | text | 否 | 512 |
| `object_type` | `VARCHAR(64)` | text | 是 | 64 |
| `object_id` | `CHAR(36)` | text | 是 | 36 |
| `revision_id` | `CHAR(36)` | text | 是 | 36 |
| `object_version` | `BIGINT` | integer | 是 | — |
| `scope_type` | `VARCHAR(64)` | text | 是 | 64 |
| `scope_key` | `VARCHAR(300)` | text | 是 | 300 |
| `scope_version` | `BIGINT` | integer | 是 | — |

## pln_source_scope

主键：`user_id,scope_type,scope_key`；唯一键：`[]`；同域引用：`[]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `scope_type` | `VARCHAR(64)` | text | 否 | 64 |
| `scope_key` | `VARCHAR(300)` | text | 否 | 300 |
| `scope_version` | `BIGINT` | integer | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## pln_plan_review

主键：`review_id`；唯一键：`[["user_id", "review_id"], ["user_id", "week_plan_id", "review_id"]]`；同域引用：`[{"columns": ["user_id", "week_plan_id", "draft_revision_id"], "table": "pln_draft_revision", "references": ["user_id", "week_plan_id", "draft_revision_id"]}, {"columns": ["user_id", "source_set_id"], "table": "pln_source_set", "references": ["user_id", "source_set_id"]}, {"columns": ["user_id", "policy_bundle_id"], "table": "pln_policy_bundle", "references": ["user_id", "policy_bundle_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `review_id` | `CHAR(36)` | text | 否 | 36 |
| `week_plan_id` | `CHAR(36)` | text | 否 | 36 |
| `draft_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `policy_bundle_id` | `CHAR(36)` | text | 是 | 36 |
| `input_fingerprint` | `CHAR(64)` | text | 否 | 64 |
| `channel` | `VARCHAR(24)` | text | 否 | 24 |
| `rule_coverage` | `JSON` | json | 否 | — |
| `status` | `VARCHAR(24)` | text | 否 | 24 |
| `version` | `BIGINT` | integer | 否 | — |
| `task_id` | `CHAR(36)` | text | 是 | 36 |
| `completed_at` | `DATETIME(6)` | instant | 是 | — |
| `result_hash` | `CHAR(64)` | text | 是 | 64 |
| `stale_reason` | `VARCHAR(200)` | text | 是 | 200 |

## pln_review_issue

主键：`issue_id`；唯一键：`[["user_id", "review_id", "issue_id"], ["user_id", "issue_id"], ["user_id", "review_id", "ordinal"]]`；同域引用：`[{"columns": ["user_id", "review_id"], "table": "pln_plan_review", "references": ["user_id", "review_id"]}, {"columns": ["user_id", "item_id"], "table": "pln_plan_item", "references": ["user_id", "item_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `issue_id` | `CHAR(36)` | text | 否 | 36 |
| `review_id` | `CHAR(36)` | text | 否 | 36 |
| `ordinal` | `INT` | integer | 否 | — |
| `severity` | `VARCHAR(24)` | text | 否 | 24 |
| `rule_code` | `VARCHAR(64)` | text | 否 | 64 |
| `item_id` | `CHAR(36)` | text | 是 | 36 |
| `business_date` | `DATE` | date | 是 | — |
| `action_id` | `CHAR(36)` | text | 是 | 36 |
| `field_path` | `VARCHAR(300)` | text | 是 | 300 |
| `message` | `TEXT` | text | 否 | — |
| `suggestion` | `TEXT` | text | 是 | — |

## pln_issue_resolution

主键：`resolution_id`；唯一键：`[["user_id", "issue_id", "resolution_no"]]`；同域引用：`[{"columns": ["user_id", "review_id", "issue_id"], "table": "pln_review_issue", "references": ["user_id", "review_id", "issue_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `resolution_id` | `CHAR(36)` | text | 否 | 36 |
| `review_id` | `CHAR(36)` | text | 否 | 36 |
| `issue_id` | `CHAR(36)` | text | 否 | 36 |
| `resolution_no` | `BIGINT` | integer | 否 | — |
| `decision` | `VARCHAR(24)` | text | 否 | 24 |
| `reason` | `TEXT` | text | 是 | — |
| `request_id` | `CHAR(36)` | text | 否 | 36 |

## pln_publication

主键：`publication_id`；唯一键：`[["user_id", "week_plan_id", "publication_id"], ["user_id", "publication_id"], ["user_id", "week_plan_id", "publication_no"]]`；同域引用：`[{"columns": ["user_id", "week_plan_id"], "table": "pln_week_plan", "references": ["user_id", "week_plan_id"]}, {"columns": ["user_id", "week_plan_id", "draft_revision_id"], "table": "pln_draft_revision", "references": ["user_id", "week_plan_id", "draft_revision_id"]}, {"columns": ["user_id", "week_plan_id", "review_id"], "table": "pln_plan_review", "references": ["user_id", "week_plan_id", "review_id"]}, {"columns": ["user_id", "source_set_id"], "table": "pln_source_set", "references": ["user_id", "source_set_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `publication_id` | `CHAR(36)` | text | 否 | 36 |
| `week_plan_id` | `CHAR(36)` | text | 否 | 36 |
| `publication_no` | `BIGINT` | integer | 否 | — |
| `draft_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `review_id` | `CHAR(36)` | text | 是 | 36 |
| `publication_kind` | `VARCHAR(24)` | text | 否 | 24 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `confirmed_at` | `DATETIME(6)` | instant | 否 | — |
| `request_id` | `CHAR(36)` | text | 否 | 36 |

## pln_publication_manifest

主键：`user_id,publication_id,item_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "week_plan_id", "publication_id"], "table": "pln_publication", "references": ["user_id", "week_plan_id", "publication_id"]}, {"columns": ["user_id", "week_plan_id", "item_id"], "table": "pln_plan_item", "references": ["user_id", "week_plan_id", "item_id"]}, {"columns": ["user_id", "item_id", "item_revision_id"], "table": "pln_item_revision", "references": ["user_id", "item_id", "item_revision_id"]}, {"columns": ["user_id", "item_id", "previous_revision_id"], "table": "pln_item_revision", "references": ["user_id", "item_id", "item_revision_id"]}, {"columns": ["user_id", "shared_selection_revision_id"], "table": "pln_shared_selection_revision", "references": ["user_id", "selection_revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `publication_id` | `CHAR(36)` | text | 否 | 36 |
| `week_plan_id` | `CHAR(36)` | text | 否 | 36 |
| `item_id` | `CHAR(36)` | text | 否 | 36 |
| `item_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `previous_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `selected` | `TINYINT(1)` | integer | 否 | — |
| `effective_state` | `VARCHAR(24)` | text | 否 | 24 |
| `effective_at` | `DATETIME(6)` | instant | 否 | — |
| `shared_selection_revision_id` | `CHAR(36)` | text | 是 | 36 |

## pln_item_guard

主键：`item_id`；唯一键：`[["user_id", "item_id"]]`；同域引用：`[{"columns": ["user_id", "item_id"], "table": "pln_plan_item", "references": ["user_id", "item_id"]}, {"columns": ["user_id", "item_id", "protected_revision_id"], "table": "pln_item_revision", "references": ["user_id", "item_id", "item_revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `item_id` | `CHAR(36)` | text | 否 | 36 |
| `protected_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `earliest_started_at` | `DATETIME(6)` | instant | 是 | — |
| `first_actual_at` | `DATETIME(6)` | instant | 是 | — |
| `reason` | `VARCHAR(24)` | text | 是 | 24 |
| `version` | `BIGINT` | integer | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## pln_baseline_protection

主键：`protection_id`；唯一键：`[["user_id", "protection_id"], ["user_id", "request_id", "fact_id", "protection_mode"]]`；同域引用：`[]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `protection_id` | `CHAR(36)` | text | 否 | 36 |
| `fact_id` | `CHAR(36)` | text | 否 | 36 |
| `fact_kind` | `VARCHAR(16)` | text | 否 | 16 |
| `business_date` | `DATE` | date | 否 | — |
| `occurred_at` | `DATETIME(6)` | instant | 否 | — |
| `begin_at` | `DATETIME(6)` | instant | 是 | — |
| `end_at` | `DATETIME(6)` | instant | 是 | — |
| `protection_mode` | `VARCHAR(24)` | text | 否 | 24 |
| `prior_protection_id` | `CHAR(36)` | text | 是 | 36 |
| `provisional` | `BOOLEAN` | integer | 否 | — |
| `request_id` | `CHAR(36)` | text | 否 | 36 |
| `request_hash` | `CHAR(64)` | text | 否 | 64 |

## pln_protection_ref

主键：`user_id,protection_id,reference_goal_id,item_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "protection_id"], "table": "pln_baseline_protection", "references": ["user_id", "protection_id"]}, {"columns": ["user_id", "reference_goal_id", "goal_revision_id"], "table": "pln_goal_revision", "references": ["user_id", "goal_id", "revision_id"]}, {"columns": ["user_id", "item_id", "item_revision_id"], "table": "pln_item_revision", "references": ["user_id", "item_id", "item_revision_id"]}, {"columns": ["user_id", "publication_id"], "table": "pln_publication", "references": ["user_id", "publication_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `protection_id` | `CHAR(36)` | text | 否 | 36 |
| `reference_goal_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `item_id` | `CHAR(36)` | text | 否 | 36 |
| `item_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `publication_id` | `CHAR(36)` | text | 否 | 36 |
| `baseline_role` | `VARCHAR(16)` | text | 否 | 16 |

## pln_daily_intake_guard

主键：`user_id,business_date`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "first_protection_id"], "table": "pln_baseline_protection", "references": ["user_id", "protection_id"]}, {"columns": ["user_id", "shared_selection_revision_id"], "table": "pln_shared_selection_revision", "references": ["user_id", "selection_revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `business_date` | `DATE` | date | 否 | — |
| `first_protection_id` | `CHAR(36)` | text | 否 | 36 |
| `first_intake_at` | `DATETIME(6)` | instant | 否 | — |
| `had_total_baseline` | `TINYINT(1)` | integer | 否 | — |
| `shared_selection_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `version` | `BIGINT` | integer | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## pln_intake_frozen_total

主键：`user_id,business_date,reference_goal_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "business_date"], "table": "pln_daily_intake_guard", "references": ["user_id", "business_date"]}, {"columns": ["user_id", "reference_goal_id"], "table": "pln_goal", "references": ["user_id", "goal_id"]}, {"columns": ["user_id", "item_id", "item_revision_id"], "table": "pln_item_revision", "references": ["user_id", "item_id", "item_revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `business_date` | `DATE` | date | 否 | — |
| `reference_goal_id` | `CHAR(36)` | text | 否 | 36 |
| `item_id` | `CHAR(36)` | text | 否 | 36 |
| `item_revision_id` | `CHAR(36)` | text | 否 | 36 |

## pln_shared_selection_head

主键：`user_id,business_date,shared_kind`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "business_date", "shared_kind", "current_revision_id"], "table": "pln_shared_selection_revision", "references": ["user_id", "business_date", "shared_kind", "selection_revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `business_date` | `DATE` | date | 否 | — |
| `shared_kind` | `VARCHAR(16)` | text | 否 | 16 |
| `current_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `version` | `BIGINT` | integer | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## pln_shared_selection_revision

主键：`selection_revision_id`；唯一键：`[["user_id", "selection_revision_id"], ["user_id", "business_date", "shared_kind", "selection_revision_id"], ["user_id", "business_date", "shared_kind", "revision_no"]]`；同域引用：`[{"columns": ["user_id", "business_date", "shared_kind"], "table": "pln_shared_selection_head", "references": ["user_id", "business_date", "shared_kind"]}, {"columns": ["user_id", "primary_item_id", "primary_item_revision_id"], "table": "pln_item_revision", "references": ["user_id", "item_id", "item_revision_id"]}, {"columns": ["user_id", "source_set_id"], "table": "pln_source_set", "references": ["user_id", "source_set_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `selection_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `business_date` | `DATE` | date | 否 | — |
| `shared_kind` | `VARCHAR(16)` | text | 否 | 16 |
| `revision_no` | `BIGINT` | integer | 否 | — |
| `primary_item_id` | `CHAR(36)` | text | 否 | 36 |
| `primary_item_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `request_id` | `CHAR(36)` | text | 否 | 36 |

## pln_shared_selection_member

主键：`user_id,selection_revision_id,goal_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "selection_revision_id"], "table": "pln_shared_selection_revision", "references": ["user_id", "selection_revision_id"]}, {"columns": ["user_id", "goal_id", "goal_revision_id"], "table": "pln_goal_revision", "references": ["user_id", "goal_id", "revision_id"]}, {"columns": ["user_id", "proposed_item_id", "proposed_item_revision_id"], "table": "pln_item_revision", "references": ["user_id", "item_id", "item_revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `selection_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `relation` | `VARCHAR(16)` | text | 否 | 16 |
| `proposed_item_id` | `CHAR(36)` | text | 是 | 36 |
| `proposed_item_revision_id` | `CHAR(36)` | text | 是 | 36 |

## pln_draft_basis

主键：`basis_id`；唯一键：`[["user_id", "basis_id"]]`；同域引用：`[{"columns": ["user_id", "draft_revision_id"], "table": "pln_draft_revision", "references": ["user_id", "draft_revision_id"]}, {"columns": ["user_id", "source_set_id"], "table": "pln_source_set", "references": ["user_id", "source_set_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `basis_id` | `CHAR(36)` | text | 否 | 36 |
| `draft_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `conclusion_kind` | `VARCHAR(16)` | text | 否 | 16 |
| `conclusion_id` | `CHAR(36)` | text | 否 | 36 |
| `conclusion_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `confirmation_id` | `CHAR(36)` | text | 否 | 36 |
| `confirmation_version` | `BIGINT` | integer | 否 | — |
| `cutoff_at` | `DATETIME(6)` | instant | 否 | — |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `component_id` | `CHAR(36)` | text | 是 | 36 |
| `slot_key` | `VARCHAR(128)` | text | 是 | 128 |
| `source_fingerprint` | `CHAR(64)` | text | 是 | 64 |

## pln_adjustment_patch

主键：`patch_id`；唯一键：`[["user_id", "basis_id", "item_id", "field_path"]]`；同域引用：`[{"columns": ["user_id", "basis_id"], "table": "pln_draft_basis", "references": ["user_id", "basis_id"]}, {"columns": ["user_id", "item_id"], "table": "pln_plan_item", "references": ["user_id", "item_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `patch_id` | `CHAR(36)` | text | 否 | 36 |
| `basis_id` | `CHAR(36)` | text | 否 | 36 |
| `item_id` | `CHAR(36)` | text | 否 | 36 |
| `field_path` | `VARCHAR(300)` | text | 否 | 300 |
| `affected_date` | `DATE` | date | 否 | — |
| `old_value` | `JSON` | json | 否 | — |
| `proposed_value` | `JSON` | json | 否 | — |
| `current_value` | `JSON` | json | 否 | — |
| `chosen_value` | `JSON` | json | 是 | — |
| `reason` | `TEXT` | text | 否 | — |
| `merge_status` | `VARCHAR(24)` | text | 否 | 24 |

## pln_fitness_assessment

主键：`assessment_id`；唯一键：`[["user_id", "assessment_id"]]`；同域引用：`[{"columns": ["user_id", "goal_id"], "table": "pln_goal", "references": ["user_id", "goal_id"]}, {"columns": ["user_id", "policy_bundle_id"], "table": "pln_policy_bundle", "references": ["user_id", "policy_bundle_id"]}, {"columns": ["user_id", "source_set_id"], "table": "pln_source_set", "references": ["user_id", "source_set_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `assessment_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_id` | `CHAR(36)` | text | 否 | 36 |
| `policy_bundle_id` | `CHAR(36)` | text | 是 | 36 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `from_date` | `DATE` | date | 否 | — |
| `to_date` | `DATE` | date | 否 | — |
| `decision` | `VARCHAR(24)` | text | 否 | 24 |
| `evaluated_at` | `DATETIME(6)` | instant | 否 | — |
| `missing_evidence` | `JSON` | json | 否 | — |

## pln_fitness_assessment_issue

主键：`issue_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "assessment_id"], "table": "pln_fitness_assessment", "references": ["user_id", "assessment_id"]}, {"columns": ["user_id", "item_id"], "table": "pln_plan_item", "references": ["user_id", "item_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `issue_id` | `CHAR(36)` | text | 否 | 36 |
| `assessment_id` | `CHAR(36)` | text | 否 | 36 |
| `item_id` | `CHAR(36)` | text | 是 | 36 |
| `business_date` | `DATE` | date | 是 | — |
| `rule_code` | `VARCHAR(64)` | text | 否 | 64 |
| `severity` | `VARCHAR(24)` | text | 否 | 24 |
| `field_path` | `VARCHAR(300)` | text | 是 | 300 |
| `message` | `TEXT` | text | 否 | — |

## pln_future_suspension

主键：`user_id,item_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "item_id"], "table": "pln_plan_item", "references": ["user_id", "item_id"]}, {"columns": ["user_id", "goal_id"], "table": "pln_goal", "references": ["user_id", "goal_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `item_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_id` | `CHAR(36)` | text | 否 | 36 |
| `effective_at` | `DATETIME(6)` | instant | 否 | — |
| `reason_code` | `VARCHAR(32)` | text | 否 | 32 |
