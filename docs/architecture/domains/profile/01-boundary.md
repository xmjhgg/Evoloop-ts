# profile：边界与统一语言

所有业务在 `packages/client-business-core/src/profile` 执行，三种本地存储映射；Java 不提供 profile 业务 API。

拥有 PersonalProfile、条件分区与修订、BodyMeasurement、DailyBodyState、日期唯一槽及范围 token。COMMON/FITNESS/LEARNING 分区区分作息、时间、器材/基础/长期限制、学习资源；条件不是具体计划。目标体重归 planning，实际体重归 profile，训练后感受归 execution。

条件保存后立即成立，无“AI 确认资料”流程。未提供 UNKNOWN、用户明确无 NONE、已记录 RECORDED 分开，空资料不能代表无风险。学习条件不必读取或填写健康数据。

planning 通过公开 ConditionSnapshot/BodyEvidenceSnapshot 读取当前或历史修订；review 读取事实与覆盖；workspace 的我的/今日引用同一 factId。来源 token 按必要分区和日期输出，不能因修改健身资料使无关学习来源失效。

账号凭据、云端会话、用途授权的权威状态归 Java identity；本域只接收本地账户/用途上下文。不再维护旧跨域服务端栅栏与隐私工作流。
