# review 旧结构字段基线

共 26 张表；仅迁移输入，适用说明见[基线入口](README.md)。

## rev_document

主键：`document_id`；唯一键：`[["user_id", "document_id"]]`；同域引用：`[]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `document_id` | `CHAR(36)` | text | 否 | 36 |
| `document_kind` | `VARCHAR(16)` | text | 否 | 16 |
| `version` | `BIGINT` | integer | 否 | — |
| `current_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `next_revision_no` | `BIGINT` | integer | 否 | — |
| `next_confirmation_no` | `BIGINT` | integer | 否 | — |
| `lifecycle` | `VARCHAR(16)` | text | 否 | 16 |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## rev_daily_document

主键：`user_id,document_id`；唯一键：`[["user_id", "business_date"]]`；同域引用：`[{"columns": ["user_id", "document_id"], "table": "rev_document", "references": ["user_id", "document_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `document_id` | `CHAR(36)` | text | 否 | 36 |
| `business_date` | `DATE` | date | 否 | — |

## rev_weekly_document

主键：`user_id,document_id`；唯一键：`[["user_id", "goal_id", "week_start_date"]]`；同域引用：`[{"columns": ["user_id", "document_id"], "table": "rev_document", "references": ["user_id", "document_id"]}, {"columns": ["user_id", "goal_id"], "table": "pln_goal", "references": ["user_id", "goal_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `document_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_id` | `CHAR(36)` | text | 否 | 36 |
| `week_start_date` | `DATE` | date | 否 | — |

## rev_revision

主键：`revision_id`；唯一键：`[["user_id", "revision_id"], ["user_id", "document_id", "revision_id"], ["user_id", "document_id", "revision_no"]]`；同域引用：`[{"columns": ["user_id", "document_id"], "table": "rev_document", "references": ["user_id", "document_id"]}, {"columns": ["user_id", "document_id", "previous_revision_id"], "table": "rev_revision", "references": ["user_id", "document_id", "revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_id` | `CHAR(36)` | text | 否 | 36 |
| `document_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_no` | `BIGINT` | integer | 否 | — |
| `previous_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `composition_reason` | `VARCHAR(32)` | text | 否 | 32 |
| `manifest_digest` | `CHAR(64)` | text | 否 | 64 |
| `composed_at` | `DATETIME(6)` | instant | 否 | — |
| `privacy_redacted_at` | `DATETIME(6)` | instant | 是 | — |

## rev_revision_slot

主键：`user_id,revision_id,slot_key`；唯一键：`[["user_id", "revision_id", "ordinal"]]`；同域引用：`[{"columns": ["user_id", "document_id", "revision_id"], "table": "rev_revision", "references": ["user_id", "document_id", "revision_id"]}, {"columns": ["user_id", "document_id", "component_id"], "table": "rev_component", "references": ["user_id", "document_id", "component_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_id` | `CHAR(36)` | text | 否 | 36 |
| `document_id` | `CHAR(36)` | text | 否 | 36 |
| `slot_key` | `VARCHAR(100)` | text | 否 | 100 |
| `component_id` | `CHAR(36)` | text | 否 | 36 |
| `purpose_scope` | `VARCHAR(16)` | text | 否 | 16 |
| `ordinal` | `INT` | integer | 否 | — |

## rev_component

主键：`component_id`；唯一键：`[["user_id", "component_id"], ["user_id", "document_id", "component_id"]]`；同域引用：`[{"columns": ["user_id", "document_id"], "table": "rev_document", "references": ["user_id", "document_id"]}, {"columns": ["user_id", "source_set_id"], "table": "rev_source_set", "references": ["user_id", "source_set_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `component_id` | `CHAR(36)` | text | 否 | 36 |
| `document_id` | `CHAR(36)` | text | 否 | 36 |
| `slot_key` | `VARCHAR(100)` | text | 否 | 100 |
| `goal_id` | `CHAR(36)` | text | 是 | 36 |
| `category` | `VARCHAR(16)` | text | 否 | 16 |
| `purpose_scope` | `VARCHAR(16)` | text | 否 | 16 |
| `origin` | `VARCHAR(16)` | text | 否 | 16 |
| `content_status` | `VARCHAR(24)` | text | 否 | 24 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `source_fingerprint` | `CHAR(64)` | text | 否 | 64 |
| `coverage_digest` | `CHAR(64)` | text | 否 | 64 |
| `cutoff_at` | `DATETIME(6)` | instant | 否 | — |
| `captured_at` | `DATETIME(6)` | instant | 否 | — |
| `schema_version` | `VARCHAR(64)` | text | 否 | 64 |
| `metric_policy_version` | `VARCHAR(64)` | text | 否 | 64 |
| `ai_task_id` | `CHAR(36)` | text | 是 | 36 |
| `rules_evidence_ref` | `VARCHAR(200)` | text | 是 | 200 |

## rev_component_metric

主键：`metric_id`；唯一键：`[["user_id", "metric_id"], ["user_id", "component_id", "dimension", "metric_code", "unit"]]`；同域引用：`[{"columns": ["user_id", "component_id"], "table": "rev_component", "references": ["user_id", "component_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `metric_id` | `CHAR(36)` | text | 否 | 36 |
| `component_id` | `CHAR(36)` | text | 否 | 36 |
| `dimension` | `VARCHAR(24)` | text | 否 | 24 |
| `metric_code` | `VARCHAR(64)` | text | 否 | 64 |
| `unit` | `VARCHAR(24)` | text | 否 | 24 |
| `planned_value` | `DECIMAL(18,6)` | decimal | 是 | — |
| `actual_value` | `DECIMAL(18,6)` | decimal | 是 | — |
| `actual_lower` | `DECIMAL(18,6)` | decimal | 是 | — |
| `actual_upper` | `DECIMAL(18,6)` | decimal | 是 | — |
| `difference_value` | `DECIMAL(18,6)` | decimal | 是 | — |
| `knowledge` | `VARCHAR(16)` | text | 否 | 16 |
| `comparability` | `VARCHAR(24)` | text | 否 | 24 |
| `is_full_scope_total` | `TINYINT(1)` | integer | 否 | — |
| `unknown_item_count` | `INT` | integer | 否 | — |
| `calculation_version` | `VARCHAR(64)` | text | 否 | 64 |
| `ordinal` | `INT` | integer | 否 | — |

## rev_component_coverage

主键：`coverage_id`；唯一键：`[["user_id", "coverage_id"], ["user_id", "component_id", "dimension"]]`；同域引用：`[{"columns": ["user_id", "component_id"], "table": "rev_component", "references": ["user_id", "component_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `coverage_id` | `CHAR(36)` | text | 否 | 36 |
| `component_id` | `CHAR(36)` | text | 否 | 36 |
| `dimension` | `VARCHAR(24)` | text | 否 | 24 |
| `coverage_state` | `VARCHAR(24)` | text | 否 | 24 |
| `eligible_count` | `INT` | integer | 是 | — |
| `registered_count` | `INT` | integer | 否 | — |
| `completed_count` | `INT` | integer | 否 | — |
| `partial_count` | `INT` | integer | 否 | — |
| `not_performed_count` | `INT` | integer | 否 | — |
| `unregistered_count` | `INT` | integer | 是 | — |
| `in_progress_count` | `INT` | integer | 否 | — |
| `autonomous_count` | `INT` | integer | 否 | — |
| `future_excluded_count` | `INT` | integer | 否 | — |
| `rest_excluded_count` | `INT` | integer | 否 | — |
| `suspended_excluded_count` | `INT` | integer | 否 | — |
| `unknown_field_count` | `INT` | integer | 否 | — |
| `denominator_rule_version` | `VARCHAR(64)` | text | 否 | 64 |
| `missing_codes` | `JSON` | json | 否 | — |

## rev_coverage_item

主键：`coverage_item_id`；唯一键：`[["user_id", "coverage_item_id"], ["user_id", "coverage_id", "selection_key"]]`；同域引用：`[{"columns": ["user_id", "coverage_id"], "table": "rev_component_coverage", "references": ["user_id", "coverage_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `coverage_item_id` | `CHAR(36)` | text | 否 | 36 |
| `coverage_id` | `CHAR(36)` | text | 否 | 36 |
| `selection_key` | `VARCHAR(200)` | text | 否 | 200 |
| `business_date` | `DATE` | date | 否 | — |
| `item_id` | `CHAR(36)` | text | 是 | 36 |
| `item_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `fact_id` | `CHAR(36)` | text | 是 | 36 |
| `fact_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `item_state` | `VARCHAR(24)` | text | 否 | 24 |
| `comparison_available` | `TINYINT(1)` | integer | 否 | — |
| `reason_code` | `VARCHAR(80)` | text | 是 | 80 |

## rev_statement

主键：`statement_id`；唯一键：`[["user_id", "statement_id"], ["user_id", "component_id", "ordinal"]]`；同域引用：`[{"columns": ["user_id", "component_id"], "table": "rev_component", "references": ["user_id", "component_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `statement_id` | `CHAR(36)` | text | 否 | 36 |
| `component_id` | `CHAR(36)` | text | 否 | 36 |
| `statement_kind` | `VARCHAR(32)` | text | 否 | 32 |
| `text` | `TEXT` | text | 否 | — |
| `ordinal` | `INT` | integer | 否 | — |

## rev_statement_support

主键：`user_id,statement_id,source_entry_id`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "statement_id"], "table": "rev_statement", "references": ["user_id", "statement_id"]}, {"columns": ["user_id", "source_entry_id"], "table": "rev_source_entry", "references": ["user_id", "entry_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `statement_id` | `CHAR(36)` | text | 否 | 36 |
| `source_entry_id` | `CHAR(36)` | text | 否 | 36 |
| `support_role` | `VARCHAR(24)` | text | 否 | 24 |

## rev_manual_entry

主键：`entry_id`；唯一键：`[["user_id", "entry_id"], ["user_id", "document_id", "entry_id"]]`；同域引用：`[{"columns": ["user_id", "document_id"], "table": "rev_document", "references": ["user_id", "document_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `entry_id` | `CHAR(36)` | text | 否 | 36 |
| `document_id` | `CHAR(36)` | text | 否 | 36 |
| `slot_key` | `VARCHAR(100)` | text | 否 | 100 |
| `purpose_scope` | `VARCHAR(16)` | text | 否 | 16 |
| `contribution_kind` | `VARCHAR(32)` | text | 否 | 32 |
| `current_entry_no` | `BIGINT` | integer | 否 | — |
| `version` | `BIGINT` | integer | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## rev_manual_revision

主键：`manual_revision_id`；唯一键：`[["user_id", "manual_revision_id"], ["user_id", "document_id", "manual_revision_id"], ["user_id", "entry_id", "entry_no"]]`；同域引用：`[{"columns": ["user_id", "document_id", "entry_id"], "table": "rev_manual_entry", "references": ["user_id", "document_id", "entry_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `manual_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `document_id` | `CHAR(36)` | text | 否 | 36 |
| `entry_id` | `CHAR(36)` | text | 否 | 36 |
| `entry_no` | `BIGINT` | integer | 否 | — |
| `text` | `TEXT` | text | 是 | — |
| `removed` | `TINYINT(1)` | integer | 否 | — |
| `authored_at` | `DATETIME(6)` | instant | 否 | — |
| `request_id` | `VARCHAR(128)` | text | 否 | 128 |

## rev_component_manual_ref

主键：`user_id,component_id,manual_revision_id`；唯一键：`[["user_id", "component_id", "ordinal"]]`；同域引用：`[{"columns": ["user_id", "document_id", "component_id"], "table": "rev_component", "references": ["user_id", "document_id", "component_id"]}, {"columns": ["user_id", "document_id", "manual_revision_id"], "table": "rev_manual_revision", "references": ["user_id", "document_id", "manual_revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `component_id` | `CHAR(36)` | text | 否 | 36 |
| `document_id` | `CHAR(36)` | text | 否 | 36 |
| `manual_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `ordinal` | `INT` | integer | 否 | — |

## rev_confirmation

主键：`confirmation_id`；唯一键：`[["user_id", "confirmation_id"], ["user_id", "document_id", "confirmation_id"], ["user_id", "document_id", "confirmation_no"]]`；同域引用：`[{"columns": ["user_id", "document_id", "confirmed_revision_id"], "table": "rev_revision", "references": ["user_id", "document_id", "revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `confirmation_id` | `CHAR(36)` | text | 否 | 36 |
| `document_id` | `CHAR(36)` | text | 否 | 36 |
| `confirmation_no` | `BIGINT` | integer | 否 | — |
| `confirmation_version` | `BIGINT` | integer | 否 | — |
| `confirmed_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `scope_mode` | `VARCHAR(24)` | text | 否 | 24 |
| `request_id` | `VARCHAR(128)` | text | 否 | 128 |
| `authorization_version` | `BIGINT` | integer | 否 | — |
| `deletion_epoch` | `BIGINT` | integer | 否 | — |
| `confirmed_at` | `DATETIME(6)` | instant | 否 | — |

## rev_confirmation_component

主键：`user_id,confirmation_id,slot_key`；唯一键：`[["user_id", "document_id", "confirmation_id", "slot_key", "component_id"]]`；同域引用：`[{"columns": ["user_id", "document_id", "confirmation_id"], "table": "rev_confirmation", "references": ["user_id", "document_id", "confirmation_id"]}, {"columns": ["user_id", "document_id", "component_id"], "table": "rev_component", "references": ["user_id", "document_id", "component_id"]}, {"columns": ["user_id", "source_set_id"], "table": "rev_source_set", "references": ["user_id", "source_set_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `confirmation_id` | `CHAR(36)` | text | 否 | 36 |
| `document_id` | `CHAR(36)` | text | 否 | 36 |
| `slot_key` | `VARCHAR(100)` | text | 否 | 100 |
| `component_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_id` | `CHAR(36)` | text | 是 | 36 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `source_fingerprint` | `CHAR(64)` | text | 否 | 64 |
| `coverage_digest` | `CHAR(64)` | text | 否 | 64 |
| `cutoff_at` | `DATETIME(6)` | instant | 否 | — |
| `missing_scope_count` | `INT` | integer | 否 | — |

## rev_confirmation_head

主键：`user_id,document_id,slot_key`；唯一键：`[]`；同域引用：`[{"columns": ["user_id", "document_id", "confirmation_id", "slot_key", "component_id"], "table": "rev_confirmation_component", "references": ["user_id", "document_id", "confirmation_id", "slot_key", "component_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `document_id` | `CHAR(36)` | text | 否 | 36 |
| `slot_key` | `VARCHAR(100)` | text | 否 | 100 |
| `confirmation_id` | `CHAR(36)` | text | 否 | 36 |
| `component_id` | `CHAR(36)` | text | 否 | 36 |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## rev_source_set

主键：`source_set_id`；唯一键：`[["user_id", "source_set_id"]]`；同域引用：`[]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `purpose_scope` | `VARCHAR(16)` | text | 否 | 16 |
| `fingerprint` | `CHAR(64)` | text | 否 | 64 |
| `captured_at` | `DATETIME(6)` | instant | 否 | — |
| `authorization_version` | `BIGINT` | integer | 否 | — |
| `deletion_epoch` | `BIGINT` | integer | 否 | — |
| `schema_version` | `VARCHAR(64)` | text | 否 | 64 |

## rev_source_entry

主键：`entry_id`；唯一键：`[["user_id", "entry_id"], ["user_id", "source_set_id", "entry_kind", "owner_module", "canonical_key"]]`；同域引用：`[{"columns": ["user_id", "source_set_id"], "table": "rev_source_set", "references": ["user_id", "source_set_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `entry_id` | `CHAR(36)` | text | 否 | 36 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `entry_kind` | `VARCHAR(8)` | text | 否 | 8 |
| `owner_module` | `VARCHAR(20)` | text | 否 | 20 |
| `canonical_key` | `VARCHAR(400)` | text | 否 | 400 |
| `object_type` | `VARCHAR(64)` | text | 是 | 64 |
| `object_id` | `CHAR(36)` | text | 是 | 36 |
| `revision_id` | `CHAR(36)` | text | 是 | 36 |
| `source_version` | `BIGINT` | integer | 是 | — |
| `scope_type` | `VARCHAR(64)` | text | 是 | 64 |
| `scope_key` | `VARCHAR(300)` | text | 是 | 300 |
| `scope_version` | `BIGINT` | integer | 是 | — |

## rev_source_scope

主键：`user_id,scope_type,scope_key`；唯一键：`[]`；同域引用：`[]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `scope_type` | `VARCHAR(24)` | text | 否 | 24 |
| `scope_key` | `VARCHAR(180)` | text | 否 | 180 |
| `scope_version` | `BIGINT` | integer | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## rev_adjustment_suggestion

主键：`suggestion_id`；唯一键：`[["user_id", "suggestion_id"]]`；同域引用：`[]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `suggestion_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_id` | `CHAR(36)` | text | 否 | 36 |
| `version` | `BIGINT` | integer | 否 | — |
| `current_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `status` | `VARCHAR(24)` | text | 否 | 24 |
| `origin` | `VARCHAR(16)` | text | 否 | 16 |
| `active_task_id` | `CHAR(36)` | text | 是 | 36 |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## rev_suggestion_revision

主键：`revision_id`；唯一键：`[["user_id", "revision_id"], ["user_id", "suggestion_id", "revision_id"], ["user_id", "suggestion_id", "revision_no"]]`；同域引用：`[{"columns": ["user_id", "suggestion_id"], "table": "rev_adjustment_suggestion", "references": ["user_id", "suggestion_id"]}, {"columns": ["user_id", "source_set_id"], "table": "rev_source_set", "references": ["user_id", "source_set_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_id` | `CHAR(36)` | text | 否 | 36 |
| `suggestion_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_no` | `BIGINT` | integer | 否 | — |
| `status_snapshot` | `VARCHAR(24)` | text | 否 | 24 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `fingerprint` | `CHAR(64)` | text | 否 | 64 |
| `rules_evidence_ref` | `VARCHAR(200)` | text | 是 | 200 |
| `captured_at` | `DATETIME(6)` | instant | 否 | — |

## rev_suggestion_basis

主键：`basis_id`；唯一键：`[["user_id", "basis_id"], ["user_id", "suggestion_revision_id", "document_id", "component_id"]]`；同域引用：`[{"columns": ["user_id", "suggestion_revision_id"], "table": "rev_suggestion_revision", "references": ["user_id", "revision_id"]}, {"columns": ["user_id", "source_set_id"], "table": "rev_source_set", "references": ["user_id", "source_set_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `basis_id` | `CHAR(36)` | text | 否 | 36 |
| `suggestion_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `conclusion_kind` | `VARCHAR(16)` | text | 否 | 16 |
| `document_id` | `CHAR(36)` | text | 否 | 36 |
| `composition_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `confirmation_id` | `CHAR(36)` | text | 否 | 36 |
| `confirmation_version` | `BIGINT` | integer | 否 | — |
| `component_id` | `CHAR(36)` | text | 否 | 36 |
| `slot_key` | `VARCHAR(100)` | text | 否 | 100 |
| `source_set_id` | `CHAR(36)` | text | 否 | 36 |
| `cutoff_at` | `DATETIME(6)` | instant | 否 | — |
| `coverage_digest` | `CHAR(64)` | text | 否 | 64 |

## rev_adjustment_patch

主键：`patch_id`；唯一键：`[["user_id", "patch_id"], ["user_id", "suggestion_revision_id", "patch_key"], ["user_id", "suggestion_revision_id", "ordinal"]]`；同域引用：`[{"columns": ["user_id", "suggestion_revision_id"], "table": "rev_suggestion_revision", "references": ["user_id", "revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `patch_id` | `CHAR(36)` | text | 否 | 36 |
| `suggestion_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `patch_key` | `VARCHAR(128)` | text | 否 | 128 |
| `goal_id` | `CHAR(36)` | text | 否 | 36 |
| `affected_date` | `DATE` | date | 否 | — |
| `week_start_date` | `DATE` | date | 否 | — |
| `item_id` | `CHAR(36)` | text | 是 | 36 |
| `client_item_key` | `VARCHAR(128)` | text | 是 | 128 |
| `field_path` | `VARCHAR(150)` | text | 否 | 150 |
| `value_kind` | `VARCHAR(24)` | text | 否 | 24 |
| `old_value` | `JSON` | json | 是 | — |
| `new_value` | `JSON` | json | 是 | — |
| `unit` | `VARCHAR(24)` | text | 是 | 24 |
| `reason` | `TEXT` | text | 否 | — |
| `supporting_statement_ref` | `CHAR(36)` | text | 是 | 36 |
| `ordinal` | `INT` | integer | 否 | — |

## rev_submission

主键：`submission_id`；唯一键：`[["user_id", "submission_id"], ["user_id", "suggestion_id", "request_id"]]`；同域引用：`[{"columns": ["user_id", "suggestion_id"], "table": "rev_adjustment_suggestion", "references": ["user_id", "suggestion_id"]}, {"columns": ["user_id", "suggestion_id", "suggestion_revision_id"], "table": "rev_suggestion_revision", "references": ["user_id", "suggestion_id", "revision_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `submission_id` | `CHAR(36)` | text | 否 | 36 |
| `suggestion_id` | `CHAR(36)` | text | 否 | 36 |
| `suggestion_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `goal_id` | `CHAR(36)` | text | 否 | 36 |
| `week_start_date` | `DATE` | date | 否 | — |
| `request_id` | `VARCHAR(128)` | text | 否 | 128 |
| `expected_week_version` | `BIGINT` | integer | 否 | — |
| `selected_patch_digest` | `CHAR(64)` | text | 否 | 64 |
| `week_plan_id` | `CHAR(36)` | text | 否 | 36 |
| `result_draft_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `result_week_version` | `BIGINT` | integer | 否 | — |
| `merge_status` | `VARCHAR(24)` | text | 否 | 24 |
| `result_reference_json` | `JSON` | json | 否 | — |
| `submitted_at` | `DATETIME(6)` | instant | 否 | — |

## rev_submission_patch

主键：`user_id,submission_id,patch_key`；唯一键：`[["user_id", "suggestion_id", "patch_key"]]`；同域引用：`[{"columns": ["user_id", "submission_id"], "table": "rev_submission", "references": ["user_id", "submission_id"]}, {"columns": ["user_id", "patch_id"], "table": "rev_adjustment_patch", "references": ["user_id", "patch_id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `submission_id` | `CHAR(36)` | text | 否 | 36 |
| `suggestion_id` | `CHAR(36)` | text | 否 | 36 |
| `patch_key` | `VARCHAR(128)` | text | 否 | 128 |
| `patch_id` | `CHAR(36)` | text | 否 | 36 |
