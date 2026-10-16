# identity：目标 API 与错误

路由为新协议设计建议，尚未生成 OpenAPI，不能直接替换旧接口。账号上下文来自服务端验证的凭据，客户端 userId 不授予访问权。

| 方法/路径 | 请求 | 响应/语义 |
| --- | --- | --- |
| POST /api/v2/identity/accounts | username、password、必要声明版本、注册请求标识 | 201 accountId、注册结果；不返回密码/哈希，不创建业务数据 |
| POST /api/v2/identity/sessions/password | username、password、设备说明 | 201 session credential、expiresAt、account snapshot；失败安全提示 |
| GET /api/v2/identity/session | 有效会话 | 当前账户、用途快照、会话时效 |
| DELETE /api/v2/identity/session | 有效会话 | 幂等撤销当前会话，不清空本地业务 |
| POST /api/v2/identity/sessions/wechat | 一次性 code，具体参数按迁移决定 | 适配现有身份；不凭用户名合并 |

建议错误码 USERNAME_UNAVAILABLE、INVALID_CREDENTIALS、SESSION_EXPIRED、ACCOUNT_DISABLED、RATE_LIMITED、VALIDATION_FAILED；错误响应统一 code、requestId、可公开字段路径。注册用户名冲突可提示不可用，登录不暴露密码哈希/他人身份状态。

重复注册通过规范用户名唯一约束防双账户；具体 Idempotency-Key 的重试回执/密码摘要策略实现前冻结，不在日志/回执保存密码。注册是否自动签发会话需协议定稿，本设计默认注册成功后显式登录，避免将空占位 session 视为成功。
