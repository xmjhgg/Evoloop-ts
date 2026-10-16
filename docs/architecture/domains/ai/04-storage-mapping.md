# ai：私有任务与临时输入存储

| 目标表/容器 | 关键字段 | 约束 |
| --- | --- | --- |
| ai_task | task_id、account_id、client_request_id、capability、input_digest、schema_version、status、version | UNIQUE account/clientRequestId；查本人任务 |
| ai_input | task_id、冻结最小输入/受控文件引用、source_metadata、created_at、保留标记 | 输入只为请求所需，不镜像本地领域聚合 |
| ai_attempt | task_id、attempt_no、lease_token、状态/错误、开始/结束时间、供应商引用 | UNIQUE task/attempt；旧 lease 不写新状态 |
| ai_result | task_id、output_schema_version、structured_result、model_version、prompt_version、usage | 与 inputDigest 关联；输出结构通过不等于业务接纳 |
| ai_asset | asset_id、account_id、受控存储键、digest、size、状态与期限 | 不接受任意文件路径；归属/临时清理可追踪 |

密码/会话/供应商凭据不进入这些载荷，供应商凭据由部署安全配置提供。健康输入与图片不进普通日志；保留期限/额度需要正式决定，不复制旧默认值作承诺。新表迁移、加密与恢复尚未实现。

旧 ai_task 中的业务接纳回执、用户处理栅栏和跨域命令不搬到 Java 新任务服务；已有任务先在旧系统冻结/收口并保留审计，不能把旧结果无条件接到新业务来源。
