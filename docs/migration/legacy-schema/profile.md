# profile 旧结构字段基线

共 16 张表；仅迁移输入，适用说明见[基线入口](README.md)。

## prf_personal_profile

主键：`id`；唯一键：`[["user_id"]]`；同域引用：`[]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `version` | `BIGINT` | integer | 否 | — |
| `routine_revision_no` | `BIGINT` | integer | 否 | — |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## prf_condition_section

主键：`id`；唯一键：`[["user_id", "id"]]`；同域引用：`[{"columns": ["user_id", "profile_id"], "table": "prf_personal_profile", "references": ["user_id", "id"]}, {"columns": ["user_id", "current_revision_id"], "table": "prf_condition_revision", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `profile_id` | `CHAR(36)` | text | 否 | 36 |
| `section_type` | `VARCHAR(16)` | text | 否 | 16 |
| `current_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `version` | `BIGINT` | integer | 否 | — |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## prf_condition_revision

主键：`id`；唯一键：`[["user_id", "id"]]`；同域引用：`[{"columns": ["user_id", "section_id"], "table": "prf_condition_section", "references": ["user_id", "id"]}, {"columns": ["user_id", "profile_id"], "table": "prf_personal_profile", "references": ["user_id", "id"]}, {"columns": ["user_id", "routine_revision_id"], "table": "prf_routine_sleep_revision", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `section_id` | `CHAR(36)` | text | 否 | 36 |
| `profile_id` | `CHAR(36)` | text | 否 | 36 |
| `section_type` | `VARCHAR(16)` | text | 否 | 16 |
| `revision_no` | `BIGINT` | integer | 否 | — |
| `availability_state` | `VARCHAR(16)` | text | 否 | 16 |
| `routine_state` | `VARCHAR(16)` | text | 是 | 16 |
| `routine_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `resources_state` | `VARCHAR(16)` | text | 是 | 16 |
| `restrictions_state` | `VARCHAR(16)` | text | 是 | 16 |
| `change_reason` | `VARCHAR(1000)` | text | 是 | 1000 |
| `saved_at` | `DATETIME(6)` | instant | 否 | — |
| `request_id` | `CHAR(36)` | text | 否 | 36 |
| `privacy_redacted_at` | `DATETIME(6)` | instant | 是 | — |

## prf_availability_window_revision

主键：`id`；唯一键：`[["user_id", "id"]]`；同域引用：`[{"columns": ["user_id", "condition_revision_id"], "table": "prf_condition_revision", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `condition_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `ordinal` | `SMALLINT` | integer | 否 | — |
| `weekday` | `TINYINT` | integer | 否 | — |
| `start_minute` | `SMALLINT` | integer | 否 | — |
| `end_minute` | `SMALLINT` | integer | 否 | — |
| `end_day_offset` | `TINYINT` | integer | 否 | — |

## prf_routine_sleep_revision

主键：`id`；唯一键：`[["user_id", "id"]]`；同域引用：`[{"columns": ["user_id", "profile_id"], "table": "prf_personal_profile", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `profile_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_no` | `BIGINT` | integer | 否 | — |
| `bedtime_minute` | `SMALLINT` | integer | 是 | — |
| `wake_minute` | `SMALLINT` | integer | 是 | — |
| `wake_day_offset` | `TINYINT` | integer | 是 | — |
| `shift_notes` | `VARCHAR(1000)` | text | 是 | 1000 |
| `saved_at` | `DATETIME(6)` | instant | 否 | — |
| `request_id` | `CHAR(36)` | text | 否 | 36 |

## prf_fitness_condition_revision

主键：`condition_revision_id`；唯一键：`[["user_id", "condition_revision_id"]]`；同域引用：`[{"columns": ["user_id", "condition_revision_id"], "table": "prf_condition_revision", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `condition_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `section_type` | `VARCHAR(16)` | text | 否 | 16 |
| `training_foundation` | `VARCHAR(2000)` | text | 是 | 2000 |
| `venue_description` | `VARCHAR(1000)` | text | 是 | 1000 |

## prf_learning_condition_revision

主键：`condition_revision_id`；唯一键：`[["user_id", "condition_revision_id"]]`；同域引用：`[{"columns": ["user_id", "condition_revision_id"], "table": "prf_condition_revision", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `condition_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `section_type` | `VARCHAR(16)` | text | 否 | 16 |
| `foundation_description` | `VARCHAR(2000)` | text | 是 | 2000 |

## prf_condition_resource_revision

主键：`id`；唯一键：`[["user_id", "id"]]`；同域引用：`[{"columns": ["user_id", "condition_revision_id"], "table": "prf_condition_revision", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `condition_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `section_type` | `VARCHAR(16)` | text | 否 | 16 |
| `ordinal` | `SMALLINT` | integer | 否 | — |
| `resource_type` | `VARCHAR(16)` | text | 否 | 16 |
| `name` | `VARCHAR(200)` | text | 否 | 200 |
| `description` | `VARCHAR(2000)` | text | 是 | 2000 |

## prf_long_term_restriction_revision

主键：`id`；唯一键：`[["user_id", "id"]]`；同域引用：`[{"columns": ["user_id", "condition_revision_id"], "table": "prf_condition_revision", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `condition_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `section_type` | `VARCHAR(16)` | text | 否 | 16 |
| `ordinal` | `SMALLINT` | integer | 否 | — |
| `restriction_kind` | `VARCHAR(20)` | text | 否 | 20 |
| `description` | `VARCHAR(2000)` | text | 否 | 2000 |

## prf_body_measurement

主键：`id`；唯一键：`[["user_id", "id"]]`；同域引用：`[{"columns": ["user_id", "current_revision_id"], "table": "prf_measurement_revision", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `current_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `version` | `BIGINT` | integer | 否 | — |
| `status` | `VARCHAR(16)` | text | 否 | 16 |
| `current_observed_at` | `DATETIME(6)` | instant | 否 | — |
| `current_business_date` | `DATE` | date | 否 | — |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## prf_measurement_revision

主键：`id`；唯一键：`[["user_id", "id"]]`；同域引用：`[{"columns": ["user_id", "measurement_id"], "table": "prf_body_measurement", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `measurement_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_no` | `BIGINT` | integer | 否 | — |
| `operation` | `VARCHAR(16)` | text | 否 | 16 |
| `observed_at` | `DATETIME(6)` | instant | 否 | — |
| `business_date` | `DATE` | date | 否 | — |
| `note` | `VARCHAR(2000)` | text | 是 | 2000 |
| `change_reason` | `VARCHAR(1000)` | text | 是 | 1000 |
| `saved_at` | `DATETIME(6)` | instant | 否 | — |
| `request_id` | `CHAR(36)` | text | 否 | 36 |

## prf_measurement_value_revision

主键：`id`；唯一键：`[["user_id", "id"]]`；同域引用：`[{"columns": ["user_id", "measurement_revision_id"], "table": "prf_measurement_revision", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `measurement_revision_id` | `CHAR(36)` | text | 否 | 36 |
| `ordinal` | `SMALLINT` | integer | 否 | — |
| `metric_type` | `VARCHAR(20)` | text | 否 | 20 |
| `site` | `VARCHAR(16)` | text | 否 | 16 |
| `site_label` | `VARCHAR(100)` | text | 否 | 100 |
| `value` | `DECIMAL(10,3)` | decimal | 否 | — |
| `unit` | `VARCHAR(8)` | text | 否 | 8 |

## prf_daily_body_state

主键：`id`；唯一键：`[["user_id", "id"]]`；同域引用：`[{"columns": ["user_id", "current_revision_id"], "table": "prf_body_state_revision", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `current_revision_id` | `CHAR(36)` | text | 是 | 36 |
| `version` | `BIGINT` | integer | 否 | — |
| `status` | `VARCHAR(16)` | text | 否 | 16 |
| `current_observed_at` | `DATETIME(6)` | instant | 否 | — |
| `current_business_date` | `DATE` | date | 否 | — |
| `created_at` | `DATETIME(6)` | instant | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## prf_body_state_revision

主键：`id`；唯一键：`[["user_id", "id"]]`；同域引用：`[{"columns": ["user_id", "body_state_id"], "table": "prf_daily_body_state", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `id` | `CHAR(36)` | text | 否 | 36 |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `body_state_id` | `CHAR(36)` | text | 否 | 36 |
| `revision_no` | `BIGINT` | integer | 否 | — |
| `operation` | `VARCHAR(16)` | text | 否 | 16 |
| `observed_at` | `DATETIME(6)` | instant | 否 | — |
| `business_date` | `DATE` | date | 否 | — |
| `fatigue` | `VARCHAR(16)` | text | 是 | 16 |
| `mental` | `VARCHAR(16)` | text | 是 | 16 |
| `discomfort_state` | `VARCHAR(16)` | text | 是 | 16 |
| `discomfort_intensity` | `VARCHAR(16)` | text | 是 | 16 |
| `discomfort_description` | `VARCHAR(2000)` | text | 是 | 2000 |
| `note` | `VARCHAR(2000)` | text | 是 | 2000 |
| `change_reason` | `VARCHAR(1000)` | text | 是 | 1000 |
| `saved_at` | `DATETIME(6)` | instant | 否 | — |
| `request_id` | `CHAR(36)` | text | 否 | 36 |

## prf_daily_body_state_slot

主键：`user_id,business_date`；唯一键：`[["user_id", "current_body_state_id"]]`；同域引用：`[{"columns": ["user_id", "current_body_state_id"], "table": "prf_daily_body_state", "references": ["user_id", "id"]}]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `business_date` | `DATE` | date | 否 | — |
| `current_body_state_id` | `CHAR(36)` | text | 是 | 36 |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |

## prf_source_scope

主键：`user_id,scope_type,scope_key`；唯一键：`[]`；同域引用：`[]`。

| 字段 | 旧 SQL 类型 | 传输 kind | 可空 | 最大长度 |
| --- | --- | --- | --- | --- |
| `user_id` | `CHAR(36)` | text | 否 | 36 |
| `scope_type` | `VARCHAR(16)` | text | 否 | 16 |
| `scope_key` | `VARCHAR(32)` | text | 否 | 32 |
| `version` | `BIGINT` | integer | 否 | — |
| `updated_at` | `DATETIME(6)` | instant | 否 | — |
