# iPhone 真机未签名 IPA 构建

日期：2026-10-20。源码提交：`c7178e3eefab1aa4d5e4f87e3bc6c925af52c837`。测试分支：`codex/ios-build-20261020`，不合并主分支。

[GitHub 构建运行](https://github.com/xmjhgg/Evoloop-ts/actions/runs/39393152384)。本次新增 `native-device-build`，在 macOS 26 / Xcode 26.4.1 / CocoaPods 1.16.2 上从实际 Expo 原生工程构建，使用 `iphoneos` SDK、`generic/platform=iOS` 和 Release 配置。代码签名关闭，不读取苹果账号、证书、私钥或描述文件。

首轮源码 `883c591` 的[运行](https://github.com/xmjhgg/Evoloop-ts/actions/runs/39391959141)已完成真机编译，但打包步骤的 lipo 参数顺序错误，未产出 IPA。修正版将输入文件放在 `-verify_arch arm64` 之前；保留失败记录，不将编译成功等同于交付包成功。

## 产物与核对

工作流将真机应用打包为 `Payload/EvoLoop.app`，上传 `ios-device-unsigned-ipa`。同一产物附带原工程请求的 `EvoLoop.requested.entitlements` 和 IPA 的 `SHA256SUMS`。构建脚本实际检查 `iPhoneOS` 平台和 arm64 架构，禁止将模拟器应用改后缀交付。

本次只新增构建与打包步骤，不修改应用、共享核心、云服务、同步、数据库、加密或钥匙串规则。修正版真机、模拟器与客户端任务均成功；[同提交的完整回归](https://github.com/xmjhgg/Evoloop-ts/actions/runs/39393152305)共 87 项通过，0 失败、0 跳过。

可下载 [ios-device-unsigned-ipa](https://github.com/xmjhgg/Evoloop-ts/actions/runs/39393152384/artifacts/12251540122)，GitHub 保留至 2026-10-27。本地原始 IPA：`apps/mobile/build/c7178e3/EvoLoop-unsigned.ipa`，9,016,647 字节，SHA-256：`7ab53743f2e1d534237607fac3f5a44d8503bca030a99be488a2016f808dd2b7`。

下载后已独立核对 GitHub 外层 ZIP 摘要和包内 SHA256SUMS，检查 IPA 归档完整性、`Payload/EvoLoop.app`、应用标识 `com.evoloop.two`、`iPhoneOS` 平台、arm64 Mach-O 的 iOS 构建标识、最低 iOS 16.4，以及 2,583,155 字节的内置页面代码。没有嵌入描述文件或应用签名目录。原始权限文件仍请求 `NSFileProtectionComplete`；真机编译日志实际包含 SQLCipher 和 `SQLITE_HAS_CODEC` 标志。机器证据见 [20261020-unsigned-ipa.json](evidence/20261020-unsigned-ipa.json)。

后续记录提交仅保存本文、机器证据与工程说明；被验证源码和工作流不变，不重复编译相同内容。

## Windows 后续安装

IPA 未签名，不能通过直接复制或打开下载链接安装。可在 Windows 使用 [Sideloadly 官方工具](https://sideloadly.io/)，连接 iPhone 后在本机用普通 Apple 账号进行个人签名，再安装 IPA；不要求加入付费 Apple Developer Program。账号密码和验证码只在自己的本机工具/苹果流程中输入，不上传到 GitHub 或工程。

免费个人签名通常约 7 天有效，需要续签；最终可用能力、开发者模式和签名后权限以实际设备为准。附带的 entitlements 是构建时请求值，不代表个人签名已经授予这些能力；本轮不删除安全权限来规避签名限制。升级/续签应保留同一应用与签名身份，避免破坏现有本地数据或钥匙串访问；实际恢复和升级仍需验收。

## 验证边界

未运行用户 Windows 上的个人签名、iPhone 安装/启动、原生 SQLCipher/钥匙串/生物识别/照片/文件交互、真实 AI、性能、TestFlight、App Store 或生产部署。已有完整回归证据见 [20261020-github-build](20261020-github-build.md)，不将未签名包构建等同于真机验收。不迁移旧数据，不修改原工程、原业务库或部署。
