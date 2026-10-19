# mobile

iOS React Native/Expo 开发构建，业务本地 SQLCipher；平台注入数据库/密钥/文件/网络/生命周期。

已实现苹果客户端代码：独立登录/注册、今日、计划安排、复盘、我的、设置、历史共 8 个 Screen。入口只组合页面；Feature 负责表单交互，Gateway 调用共享核心，Platform 注入 SQLCipher、钥匙串、图片、文件、网络与生命周期。没有生产 mock 回退。

## 运行

在仓库根目录执行：

```powershell
pnpm install --frozen-lockfile
pnpm verify:ios
pnpm start:ios
```

Mac 上安装 Xcode 26.4+ / CocoaPods，再执行 `pnpm --filter @evoloop/mobile ios` 生成并运行开发构建。首次登录填写新云服务的 HTTPS 根地址；账号库、API 与旧工程分开。必须包含 SQLCipher 原生模块，Expo Go 不支持此配置，见 [Expo SQLite 官方说明](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#sqlcipher)。

服务端需配置实际的 `PURPOSE_NOTICE_VERSION` 和 `PURPOSE_NOTICE_TEXT` 才允许新增健康/AI 用途授权。客户端展示云端正文并提交告知版本与账户用途版本；服务未配置时如实报错。

## 已接入流程

- 今日计划/实际对照，逐组训练、分段学习、跨夜睡眠、饮食草案与独立摄入确认；未知值保持未知。
- 本周/下周概览、未来日编辑、AI 周草案候选、规则/AI 审查和逐日明确发布；已关联事实的基准由核心保护。
- 今日与复盘页共享日结论；日/周汇总、人工判断、AI 候选接纳、范围确认、未来调整建议分开操作。
- 账户与服务地址共同隔离本地库。钥匙串保存凭据和需系统认证的数据库密钥；已有数据库缺密钥时停止打开并保留原文件。
- 餐食照片规范为 JPEG，独立加密保存；本地清单、云端附件回执与 AI 临时上传分别处理。失败保留待同步状态。
- 锁定或转后台隐藏并关闭会话；前台解锁后监听网络与本地提交，合并同步请求，失败退避，冲突等待人工处理。没有声明 iOS 后台执行能力。
- 当前版本加密备份包含记录、队列、历史、分支、照片与 AI 请求书签；恢复校验账户/服务/云端版本并保留当前分支。不执行旧数据迁移。
- 我的 → 系统设置 → 界面主题：系统/浅色/深色，持久化选择。

## 验证边界

Windows 已执行严格类型、表单/网关与真实 SQLite 测试、Expo 配置解析和 iOS Hermes 导出。配置了 macOS 原生模拟器构建 CI；本轮没有运行远端 CI、Xcode、真机、签名或真实 AI 供应商。SQLCipher/钥匙串/拍照/文件分享必须在设备另验；详情见[苹果端验证记录](../../docs/verification/20261017-ios-client.md)。

[目录分工](../../docs/engineering/directory-structure.md) · [页面地图](../../docs/engineering/page-map.md) · [Java 决策](../../docs/architecture/adr/ADR-001-java-cloud.md)
