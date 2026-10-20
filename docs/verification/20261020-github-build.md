# GitHub 云端 iOS 构建与完整回归

日期：2026-10-20。工作区：D:\project\pri\EvoLoop-two。

## 1. 被验证的版本与入口

- 源码提交：`822b9de4e76c09b24770e01782f5bb1dd662ee30`。
- 测试分支：`codex/ios-build-20261020`；未合并到 main。
- [iOS 构建](https://github.com/xmjhgg/Evoloop-ts/actions/runs/39388581610)。
- [共享核心与 Java/MySQL 完整回归](https://github.com/xmjhgg/Evoloop-ts/actions/runs/39388581284)。

## 2. 构建准备与已验证结果

本轮提交包含共享核心增量及其测试与追溯。构建修正了 setup-java 的 Temurin 精确版本标识：`21.0.8+9.0.LTS`，没有更换 Java 主版本。新增文本 LF 检出约束，历史阅读副本仍由 `-text` 保全原字节；移动端格式与生成一致性检查均实际通过。

iOS 工作流保留 macOS 26 / Xcode 26.4.1 / CocoaPods 1.16.2，新增手动触发声明及模拟器应用归档上传。手动入口需要该声明进入默认分支后才在 Actions 中可用；本次由测试分支 push 触发。

云端 `pnpm verify` 已通过：43 项核心单元、14 项移动端编排、2 项本地存储集成、15 项 Java、10 项兼容基线、2 项恢复、1 项真实 Java HTTP/MySQL 与双 SQLite 客户端同步，共 87 项，0 失败、0 错误、0 跳过。真实 Java JAR 已生成，JAR 边界检查通过，66 项 Java 运行时依赖与锁文件一致。

移动端严格类型、Expo 配置/依赖匹配和 Hermes 导出已通过。Xcode 原生编译日志包含 `BUILD SUCCEEDED`，依赖编译中实际包含 SQLCipher 及 `SQLITE_HAS_CODEC` 标志，应用归档与上传成功；这不代替原生加密读写验收。

应用产物为 [ios-simulator-app](https://github.com/xmjhgg/Evoloop-ts/actions/runs/39388581610/artifacts/12248044974)，保留至 2026-10-27。已下载并检查压缩包 SHA-256 与 GitHub 元数据一致：`cde9b0b46720b54578e05cdab73a7512c24177849cf22988086edaf187a6bcb9`。包内为 `EvoLoop.app`，应用标识 `com.evoloop.two`，支持平台 `iPhoneSimulator`，包含真实 Mach-O 可执行文件。

本地归档位于 `apps/mobile/build/822b9de/EvoLoop-ios-simulator.tar.gz`（忽略的构建产物，17,790,460 字节），SHA-256 为 `4ffc9d605b9ad13d44d7f5d8851146ec26f951b445e7135d578a25ca98551bde`。机器证据见 [20261020-github-build.json](evidence/20261020-github-build.json)，记录两条运行的源码 SHA、成功状态、测试数量、应用包与日志摘要。

本记录及导航/门槛说明随后通过仅文档提交保存；该提交没有改变被编译的源码、工作流或构建配置，因此不重复运行相同构建。

## 3. 验证边界

这是无签名 iOS 模拟器 Release 编译。模拟器应用包不能直接安装到 iPhone。本轮不包括启动或交互验收、真机 SQLCipher/钥匙串/生物识别/相机/文件行为、真实 AI 供应商、性能、签名、TestFlight、App Store 或生产部署。数据库测试使用隔离的 `evoloop_two_test`，不修改旧工程、旧业务库或部署，不迁移旧数据。

完整回归和原生编译证据分别记录；不能用其中一项代替另一项。既有共享核心验证记录是本轮云端运行前的历史快照，其中 CRLF 检查问题已由本次构建修正并重新验证。
