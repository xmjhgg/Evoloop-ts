import { date, requireThat } from '@evoloop/kernel';

export function requiredText(value: string | undefined): string {
  requireThat(value?.trim(), '请填写必填内容');
  return value!.trim();
}
export function amount(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const text = value.trim();
  requireThat(/^(0|[1-9]\d*)(\.\d+)?$/.test(text), '请填写非负数字，未知请留空');
  return text;
}
export function localInstant(day: string, time: string): string {
  date(day);
  requireThat(/^([01]\d|2[0-3]):[0-5]\d$/.test(time), '请填写 HH:mm 时间');
  return new Date(`${day}T${time}:00+08:00`).toISOString();
}
export function formatAmount(value: string | null | undefined, unit = ''): string {
  return value == null ? '未知' : `${value}${unit}`;
}
const labels: Readonly<Record<string, string>> = {
  QUEUED: '等待处理',
  RUNNING: '处理中',
  SUCCEEDED: '候选已生成',
  FAILED: '处理失败',
  CANCELLED: '已取消',
  KNOWN: '已知',
  ESTIMATED: '估算',
  UNKNOWN: '未知',
  REP: '次',
  SECOND: '秒',
  MINUTE: '分钟',
  PAGE: '页',
  QUESTION: '题',
  TRAINING: '训练',
  LEARNING: '学习',
  SLEEP: '睡眠',
  MEAL: '饮食',
  NUTRITION_TOTAL: '营养',
  REST: '休息',
  FITNESS: '健身',
  ACTIVE: '进行中',
  PAUSED: '已暂停',
  PENDING_REPLAN: '等待重新安排',
  ARCHIVED: '已归档',
  COMPLETED: '已完成',
  PARTIAL: '部分完成',
  NOT_PERFORMED: '未执行',
  READY: '可确认',
  BLOCKED: '需修改',
  INFORMATION_REQUIRED: '待补充条件或批准规则',
  PLANNED: '已安排',
  REMOVED: '已移除',
  SUSPENDED: '已暂停',
  HEALTH: '健康',
  SUMMARY_ONLY: '事实汇总',
  MANUAL_FINAL_JUDGMENT: '人工判断',
  AWAITING_CONFIRMATION: '待确认',
};
export function label(value: string): string {
  return labels[value] ?? value;
}
const errors: Readonly<Record<string, string>> = {
  SESSION_REQUIRED: '云端会话已过期，请重新登录。本地记录仍已保存。',
  SESSION_EXPIRED: '云端会话已过期，请重新登录。本地记录仍已保存。',
  PURPOSE_VERSION_CONFLICT: '用途设置已在其他设备更新，请先同步后重新核对。',
  PURPOSE_REQUIRED: '请先在设置中查看并授权健康数据用途。',
  AI_PURPOSE_REQUIRED: '请先查看并授权 AI 数据用途。',
  AI_UNAVAILABLE: 'AI 服务暂不可用，已保存内容仍保留。',
  VERSION_CONFLICT: '记录已有更新，请关闭表单后重新打开核对。',
  SOURCE_STALE: '来源已变化，请更新汇总并重新核对。',
  PUBLISH_BLOCKED: '计划审查尚未通过，请查看审查意见。',
  FINAL_JUDGMENT_REQUIRED: '请先保存人工判断或接纳 AI 候选，再确认复盘。',
  DATABASE_ENCRYPTION_UNAVAILABLE: '当前安装包未包含加密数据库，请安装 iOS 开发构建。',
  LOCAL_LOCKED: '本地记录已锁定，请解锁。',
  NETWORK_UNAVAILABLE: '网络暂不可用，本地记录仍保留。',
};
export function errorText(error: unknown): string {
  const code = error instanceof Error ? ('code' in error ? String(error.code) : error.message) : String(error);
  return errors[code] ?? code;
}
