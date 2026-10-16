# ai：目标 API 与接纳协议

| 方法/路径 | 输入 | 输出 |
| --- | --- | --- |
| POST /api/v2/ai/tasks | clientRequestId、capability、冻结 input、inputDigest、sourceMetadata、输出 Schema 版本 | 202 taskId/status/inputDigest；或协议明确的同步结果 |
| GET /api/v2/ai/tasks/{taskId} | 本人有效会话 | 技术进度/结构化结果、摘要、模型/提示版本 |
| DELETE /api/v2/ai/tasks/{taskId} | 本人有效会话、预期技术版本 | 幂等取消结果，不能保证已发请求被外部撤销 |
| POST /api/v2/ai/assets | 受控临时图片清单与归属 | 有限期上传标识/受限引用，不是永久业务图片 ID |

命名/请求 Schema 为待生成契约，不是已可调用 API。sourceMetadata 原样关联，不赋予它服务器可信业务含义。客户端接收结果后进入本地短事务再次校验 draft/组件/事实/人工/用途/规则/来源，匹配才接纳，否则保留旧分支与新输入。

错误区分 AI_UNAVAILABLE、INVALID_OUTPUT、INPUT_TOO_LARGE、PURPOSE_REQUIRED、TASK_CANCELLED、SESSION_EXPIRED 与网络重试。客户端 SOURCE_STALE 属于本地接纳失败，不要求 Java 实现业务校验返回它。
