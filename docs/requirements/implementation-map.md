# 本地业务与云服务的实际实现映射

2026-10-17。这里记录源码与验证范围，不将“有核心入口”写成原 AC 已全部通过。44 UC/140 AC 的原文仍以 [use-case-map](use-case-map.md) 为准。

苹果端增量：已接入目标/周日草案/审查发布、四类实际记录、餐食照片与候选、条件/测量、日周复盘/确认、未来调整、历史、身份、用途、同步冲突和当前格式备份。实际文件与测试见[页面地图](../engineering/page-map.md)和[苹果端验证](../verification/20261017-ios-client.md)。下表的“页面待补”保留为核心阶段基线历史；目前代码接入以该增量映射为准，真机与全部原 AC 尚未验收。用户已排除旧数据迁移，不再作为本轮待办。

公开代码入口：`packages/client-business-core/src/{profile,planning,execution,review}/public.ts`、`workspace/public.ts` 和 `local-commands/public.ts`。调用者经本地 CommandBus，不调用旧云端业务 HTTP。

| 原 UC | 当前核心能力 | 仍需验收/补齐的范围 |
| --- | --- | --- |
| UC-FIT-001 | profile.condition.edit、planning.goal.save | 健身页面及字段体验 |
| UC-FIT-002 | 条件掩码更新、目标不可变修订 | 页面与完整历史字段核对 |
| UC-FIT-003 | planning.week.request-candidate / accept-generated-draft | 真实模型计划质量、端上交互 |
| UC-FIT-004 | planning.week.patch-draft，未改项目复用修订 | 表单、全部原 AC 的字段组合 |
| UC-FIT-005 | planning.week.review / accept-ai-candidate | 真实模型审查；获批健身规则当前为空 |
| UC-FIT-006 | planning.week.publish，逐项预期修订与显式确认 | 健身发布继续因未批准政策阻断 |
| UC-FIT-007 | 每日营养处方草案，显式未知/单位 | 个性化公式、完整餐次分配/共享主次选择待批准和扩展 |
| UC-FIT-008 | todayWorkspace、intakeSummary | 今日页面与完整指标/覆盖呈现 |
| UC-FIT-009 | execution.fact.save TRAINING，实际动作/组，四种展示语义 | 表单/设备验收 |
| UC-FIT-010 | 同一睡眠事实开始/完成、起床日、跨日保护 | 设备时区/后台交互 |
| UC-FIT-011 | profile.observation.save、日期/单位/修订 | 指标字段与采集交互 |
| UC-FIT-012 | 多图草案、冻结摘要、候选接纳，云端临时图片/任务 | 真实图片识别、平台照片文件和评测 |
| UC-FIT-013 | execution.intake.confirm，显式份量/未知、单一 factId | 本人摄入交互及全部营养样本 |
| UC-FIT-014 | 手工草案/摄入，不依赖模型 | 表单体验 |
| UC-FIT-015 | 草案编辑后显式再确认，替换同一事实修订 | 完整原字段历史与展示 |
| UC-FIT-016 | execution.fact.remove，历史保护不解除 | 删除确认交互 |
| UC-FIT-017 | review.refresh 日范围、指标/覆盖/来源 | 完整规则指标、自动派生调度与产品验收 |
| UC-FIT-018 | 人工条目、最终判断、组件范围确认 | 页面与完整原 AC |
| UC-FIT-019 | 已确认依据 → typed adjustment 候选 → 合并未来草案 | 真实模型建议与完整 patch 类型扩展 |
| UC-FIT-020 | review.refresh WEEKLY，底层来源及逐日 token | 全部周指标、覆盖计算与产品验收 |
| UC-FIT-021 | 周人工内容/组件确认 | 页面与真实模型 |
| UC-FIT-022 | 四域 history 查询、原基准/修订 | 历史页面与大历史性能 |
| UC-FIT-023 | 同事实纠正/移日、原基准失配明示 | 设备输入、完整原字段 |
| UC-FIT-024 | planning.goal.change-state PAUSE，保护范围保留 | 全部边界日期与交互验收 |
| UC-FIT-025 | PENDING_REPLAN → 草案/审查/未来发布 | 获批健身规则与页面 |
| UC-COM-001 | 新密码注册/登录/会话 | 微信身份迁移尚未适配，不冒充原微信 AC |
| UC-COM-002 | 本地用途上下文，云端显式用途/版本/撤回保护 | 三类原用途及跨处理者完整编排暂缓 |
| UC-COM-003 | 本地密码加密结构化备份、队列/分支/附件清单 | 选定范围导出、照片文件装箱、跨处理者总包 |
| UC-COM-004 | 领域误记删除、来源失效 | 权利请求的历史批次/外部副本清理暂缓 |
| UC-COM-005 | 账号停用、会话撤销、同步访问限制，保留数据 | 完整注销/供应商删除证明暂缓 |
| UC-COM-006 | 条件分区掩码、观测纠正/移除 | 个人资料页面与全部原字段 |
| UC-COM-007 | 分类目标、状态、修订 | 目标页面 |
| UC-COM-008 | goals/weeks 查询 | 当前/下周页面与统计 |
| UC-COM-009 | 周/每日逐项草案、处方校验 | 日编辑交互与完整字段 |
| UC-COM-010 | 规则/AI 审查与选择发布分开 | 全部原审查规则与产品验收 |
| UC-COM-011 | todayWorkspace 组合公开查询 | 今日展开、左右对照和端上性能 |
| UC-COM-012 | 显式 review.refresh、来源实时最新性 | 自动派生刷新调度/全部指标尚未完成 |
| UC-COM-013 | 人工补充/编辑/移除/最终判断/范围确认 | 日复盘页面 |
| UC-COM-014 | 周来源/覆盖、人工最终判断/确认 | 完整周统计与页面 |
| UC-COM-015 | propose/submit、三方选择、只保存草案 | 复杂字段差异与发布交互 |
| UC-COM-016 | 暂停/待重规划/归档状态 | 所有日期边界及产品验收 |
| UC-LRN-001 | 学习目标、周每日内容及独立单位 | 学习页面 |
| UC-LRN-002 | 学习时长/分片/成果；分钟不双计 | 表单/所有 AC 验收 |
| UC-LRN-003 | 稳定 factId 纠正/删除、历史保留 | 历史纠正页面 |

新增 UC-NEXT：注册/会话/用途、异步批次/快照/附件、冲突保存/客户端重放及加密恢复已有实现与分层测试。未同步队列、旧分支、附件清单不会因恢复或账户访问撤销自动删除。旧库/旧命令/旧备份的生产转换器、N/N-1 真样本和灰度切换仍待 M5。

测试对应：`tests/unit` 覆盖事务、事实、计划、来源/组件、AI 候选/调整和批次；`tests/integration` 验证真实 SQLite/文件与 IndexedDB 模拟器；`tests/compatibility` 比较 8 条旧冻结样本和规范字节/拒绝行为；`tests/migration` 验证加密恢复保全；`apps/cloud/src/test` 验证独立 MySQL/HTTP；`tests/e2e` 验证跨进程同步、并发离线和快照新设备恢复。它们不是 140 AC 的全部自动化替代。
