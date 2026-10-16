# 页面职责地图

状态：目标模块映射，所有组件、Hook、Gateway 和验证均待实现。路由名称为工程规划，精确路由配置后续落实。两端 screens/features 名称对应，UI 分别实现。

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

每个页面实现时需补实际文件、Feature Hook/Model、Gateway 方法、命令/查询代码及测试证据，`check:ui` 应核验实际映射和禁止依赖，不能只验证此表有一行。
