# EvoLoop-two 工程约束

## 当前授权范围

当前仅建设目录和设计文档；除非用户后续授权，不新增或迁移 TS/TSX/Java/SQL 源码，不创建伪装可运行的 package.json、pom.xml、锁文件、CI 或空通过检查。原 `D:\project\pri\EvoLoop` 只读，保护其未提交修改。

## 架构不可违反项

1. `packages/client-business-core` 是客户端唯一业务规则和用例实现；profile、planning、execution、review 按 domain / application / ports 分层，workspace 仅组合查询。
2. `apps/cloud` 使用 Java，只有 identity、ai、sync 及必需基础设施。禁止加载客户端核心，禁止在 Java 重复实现计划、事实、复盘、营养计算、来源失效和业务命令重放。
3. Java 不能 import TS 包。跨语言只消费受控协议和复制结构产物；生成来源与流程见 `docs/engineering/contracts-and-versions.md`。禁止通过 schema、testing 或工具间接装入业务核心。
4. 禁止整页集中到单个 TS/TSX、巨型 Hook/Service/Controller。路由、Screen、区块、Feature、Hook/Model、Gateway、Platform 分工明确，页面地图同步更新。文件和函数上限遵循工程规范。
5. 跨包只能经受控公开入口；禁止跨包相对导入内部 src。跨域仓储不可直接操作，planning 的反向协作通过端口注入，禁止静态循环。
6. 事实、历史基准、来源 token、幂等记录、本地意图和变化批次同一本地事务提交。同步失败不能回滚可靠保存的事实。
7. 上传的是规范数据批次，不是云端可执行业务命令。单账户版本比较，冲突由客户端重放/人工处理，不允许静默覆盖。
8. 禁止删库重登、静默删队列、以新同步根覆盖现有版本。升级、恢复和账户切换必须保全未同步操作、分支、附件与历史。
9. AI 只返回候选。接纳、摄入确认、复盘确认和计划发布分别执行；未知值不记零；未批准规则不由本地开关或模型替代。
10. 生产/真实入口禁止 mock 自动回退；供应商或数据库不可用应如实失败。
11. 禁止跳过真实数据库测试后宣称完整回归；浏览器成功不等于小程序或 iOS 验收。目标目录存在不等于架构检查通过。
12. 禁止未经字段/历史/队列核对切换业务库；原站与新灰度入口隔离，不修改旧工程或部署。

## 后续实现要求

初始化阶段必须实现依赖、UI 规模、生成一致性检查与 CI，不能仅靠本文宣称约束已执行。TS 严格模式含 strict、noUncheckedIndexedAccess、exactOptionalPropertyTypes；纯包不隐式加载 Node/DOM。Java 以原项目 Java 21/Spring Boot 作为后续初始化参照，确切工具和依赖版本在构建阶段验证并锁定。

验证范围和未运行层次分别记录。需求、领域、ADR、契约、版本矩阵、页面地图、实现和验证证据同步维护。历史阅读副本不能作为新工程当前实现证明。
