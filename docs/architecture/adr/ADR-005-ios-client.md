# ADR-005 苹果客户端的原生装配

日期：2026-10-17。状态：代码已实现；原生执行待设备验证。

采用 Expo 57.0.30 / React Native 0.86.3 / React 19.2.3，依赖由根 pnpm 锁文件锁定。移动端 TypeScript 6.0.3；纯包和根检查维持 5.9.3，各自保持严格模式。两套编译器均检查实际源码。官方兼容表要求 SDK 57 使用 iOS 16.4+、Xcode 26.4+：[Expo SDK reference](https://docs.expo.dev/versions/latest/)。

客户端只装配共享核心。Screen 组合 Feature，Gateway 构造显式本地命令、查询、同步及 AI 请求；平台注入 SQLCipher、钥匙串、文件、相机和生命周期。业务规则没有复制到页面、Java 或适配器。函数/文件限制在格式化源码上检查。

账户 ID 与云服务根地址共同确定数据库命名空间。32 字节随机密钥保存在设备限定且需系统认证的钥匙串项中；只在系统解锁后打开专用数据库连接，验证 `cipher_version`，启用 WAL / FULL。同一连接的原子写由 CommandBus 串行化。旧文件存在而密钥不可用时停止，不新建空库覆盖。SQLCipher 需要开发构建，不能使用 Expo Go：[Expo SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#sqlcipher)。

照片先由原生选择器取得、规范化为 JPEG，再以独立随机盐/nonce 加密保存。文件提升采用同目录临时文件；成功移动后不再用已更新 URI 的旧对象清理目标。副本、修订引用与云端附件状态保留，AI 临时上传不等于同步已完成。当前备份外层包含原点、共享运行时的加密备份、照片和请求书签；恢复不覆盖云端版本，并保存当前分支。

前台解锁后同步，监听提交和网络、合并请求、失败退避，冲突停止自动重试。后台锁定立即遮挡页面并关闭本地会话；打开过程中若已转后台则丢弃该打开结果并关闭连接。后台任务调度未启用，因为需要认证的密钥不能假设后台可用。

用途告知的真实正文由云端部署配置提供。新增授权核对告知版本与账户用途版本；减少授权仍须用途版本匹配，但不依赖告知正文可用。AI 任务在请求前持久化 clientRequestId，超时重试不生成第二次请求；接纳、摄入、复盘确认与计划发布保持独立。

本地执行配置解析和 Hermes 导出。CI 增加 macOS 26 / Xcode 26.4.1 原生模拟器编译任务；本轮未运行远端 CI，不将该配置视为编译成功。runner 工具来源：[GitHub runner images](https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md)。EAS image 单独固定为官方 SDK 57 image，尚未触发云构建：[Expo build infrastructure](https://docs.expo.dev/build-reference/infrastructure/)。

不开展旧数据迁移。没有据此批准健身规则、宣称全部原字段/复盘指标或全部 140 AC 已交付；上述业务缺口仍由实际能力映射维护。
