# review：本地命令、查询与版本

| 能力 | 输入与输出 |
| --- | --- |
| review.daily.refresh / review.weekly.refresh | 选定范围、cutoff、必要来源；本地摘要/指标及可选 AI 冻结输入 |
| review.candidate.accept | task/inputDigest、组件/人工/来源版本；核验后保存候选，不人工确认 |
| review.manual.append/patch/remove | 稳定 entryId、expectedVersion、判断类型与内容；新人工修订/token |
| review.manual.finalize | 明确最终判断、当前来源/覆盖；新可确认 MANUAL 组件 |
| review.scope.confirm | explicitConfirm、组件 IDs、预期版本、来源指纹/覆盖；仅选定范围确认 |
| review.adjustment.propose/submit | 最新确认 basis、typed patches、单一归属周与明确选择；候选或提交引用 |
| get-daily/get-goal-weekly/get-review-history | 共享根/组合/组件、覆盖、当前来源最新性与范围确认 |
| verify-adjustment-basis | 由 planning 自有端口注入；当前组合/确认组件与底层来源必须匹配 |

写命令遵守[本地事务协议](../../02-local-transactions.md)。人工变化先写修订与 MANUAL token，再采集新组件来源；同事务更新受影响确认头与 DAILY/GOAL_WEEK，重新提交批次/意图。确认自身不使自己的来源立即失配。

SOURCE_STALE、CONFIRMATION_SCOPE_MISMATCH、VERSION_CONFLICT、BASIS_STALE 保留当前组件/人工内容与原用户输入，要求重新查看差异。AI 失败只改变任务/候选状态，不撤销事实；来源没变的其他组件保持其确认。

DailyConclusionUpdated/Confirmed、WeeklyReviewConfirmed、ConclusionSourceChanged 是本地通知。同步与 Java AI 的技术状态不是这些业务事件，不能在服务端回调里自动确认。
