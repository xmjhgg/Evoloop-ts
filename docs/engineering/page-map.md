# 页面职责地图

2026-10-17：苹果客户端已新增 8 个实际 Screen 与独立 Feature/Model、Gateway、平台适配。下表列页面职责，下方列实际代码；小程序仍是目录目标。静态映射与 Hermes 构建不能代替 iOS 真机交互验收。

2026-10-20 共享核心提供新增标签/份量输入、基准选择、餐次分配和日周指标/覆盖；本次未新增 Screen 或表单控件。原事实保存路径已经触发同事务摘要派生；新增核心输入和指标展示仍须分别接入对应 Feature，再做端上验收，见[本轮记录](../verification/20261020-shared-core.md)。

| 页面/路由槽 | Screen | 区块 | 独立 Feature | Gateway / 共享能力 | 关键交互验收 |
| --- | --- | --- | --- | --- | --- |
| today | TodayScreen | Header、GoalOverview、Training、Learning、Sleep、Nutrition、DailyReview、SyncHint | today-overview、training-record、learning-record、sleep-record、food-draft、intake-confirmation、review-note、review-confirmation、sync-status | 本地 get-today-workspace；execution 四类事实/摄入命令；review 补充/确认 | 训练/学习/睡眠/饮食分别提交；单目标展开，左右对照；保存失败保留输入；今日与复盘同对象 |
| plan | PlanScreen | 目标、周/日选择、摘要、草案/发布状态 | goal-editor、week-draft-editor、plan-publication、ai-candidate | 本地 planning 命令/历史查询；AI OnlineGateway | 改动作旧审查失效；保护范围不可追改；发布前明确差异 |
| review | ReviewScreen | 日/周、目标段、计划/实际、指标、判断与确认 | review-note、review-confirmation、ai-candidate | 本地 review 日周命令/查询；planning 接受未来差异 | 人工判断保留；旧来源拒绝；周确认不代日确认、不发布未来计划 |
| profile | ProfileScreen | 账户、身体/作息、条件摘要、设置入口 | conditions-editor、measurement-record、account-login | 本地 profile；当前账户/用途快照 | 我的与今日同 factId；学习不要求健康字段；账户切换保留队列 |
| settings | SettingsScreen | 外观、同步、冲突、备份恢复 | sync-status、conflict-resolution、backup-restore | local-runtime 与平台主题持久化 | 主题在我的→系统设置→界面主题；错误密码/冲突/空间失败保全 |
| login | LoginScreen | 方式、输入、忙碌、错误 | account-login | Identity OnlineGateway | 会话恢复、过期、错误字段及原输入保留 |
| register | RegisterScreen | 用户名、密码/确认、提交结果 | account-register | Identity OnlineGateway | 唯一账号；注册失败无半账户；不创建领域表 |
| history | HistoryScreen | 日期/目标筛选、修订、原基准与来源 | 各事实纠正功能、复盘查看 | 本地四域历史查询与原命令 | 旧版本只读；纠正追加修订；移日基准失配明示 |

## 苹果端实际映射

| 实际 Screen | Feature / Model | Gateway / 核心入口 | 自动验证 |
| --- | --- | --- | --- |
| apps/mobile/src/screens/today/TodayScreen.tsx | today-overview/ActivitySection、training-record/model、sleep-record/model、food-draft/model、intake-confirmation、review-note/ReviewSection | gateways/local、queries；workspace.todayWorkspace；execution / review 命令 | tests/mobile/workflows.test.ts、food-and-http.test.ts |
| apps/mobile/src/screens/plan/PlanScreen.tsx | goal-editor/model、week-draft-editor/model、plan-publication、ai-candidate/GeneratePlan | local.plans / command；planning 公开入口 | workflows.test.ts、ai-and-assets.test.ts |
| apps/mobile/src/screens/review/ReviewScreen.tsx | review-note、review-confirmation、review-adjustment | local.reviews；review 范围确认与未来调整命令 | workflows.test.ts、ai-and-assets.test.ts；核心 candidates-and-adjustments.test.ts |
| apps/mobile/src/screens/profile/ProfileScreen.tsx | conditions-editor、measurement-record | queries.details；profile 掩码更新与观测命令 | 核心 profile-and-scopes.test.ts；设备表单待验收 |
| apps/mobile/src/screens/settings/SettingsScreen.tsx | sync-status、conflict-resolution、backup-restore、account-login/PurposeSection | sync-transport、sync-attachments、backup；本地冲突/备份；identity notice / purposes | durability-and-backup.test.ts、ai-and-assets.test.ts；Java IdentityTest |
| apps/mobile/src/screens/login/LoginScreen.tsx | account-login/AuthForm | gateways/identity；platform/security/vault；bootstrap/open-account | food-and-http.test.ts；钥匙串解锁待 iOS 验收 |
| apps/mobile/src/screens/register/RegisterScreen.tsx | account-login/AuthForm（注册模式） | identity.register；受控注册 Schema | Java IdentityTest；实际键盘/网络待设备验收 |
| apps/mobile/src/screens/history/HistoryScreen.tsx | history/FactHistory、原记录纠正 Feature | queries.historyIndex / history；四域公开历史查询 | workflows.test.ts；核心历史测试；大历史性能待实测 |

入口为 apps/mobile/src/app/App.tsx；路由仅在 app/navigation/WorkspaceNavigation.tsx 组合。ThemeProvider、WorkspaceProvider、useAccount 分管外观、订阅/表单上下文和账户生命周期。原子提交由 CommandBus / SqliteStore 实现，Screen 不直接读写数据库或请求 HTTP。
