import type { Prescription } from '@evoloop/client-business-core/planning';
import type { Fact } from '@evoloop/client-business-core/execution';
import { formatAmount, label } from './presentation.ts';

export function localTime(instant: string): string {
  return new Date(Date.parse(instant) + 28800000).toISOString().slice(0, 16).replace('T', ' ');
}
export function prescriptionLines(value: Prescription): readonly string[] {
  const lines = [
    value.title,
    `安排 ${formatAmount(value.minutes, ' 分钟')}${value.startAt ? ' · ' + localTime(value.startAt) : ''}`,
  ];
  lines.push(
    ...value.actions.map(
      (action) =>
        `${action.name} · ${action.sets} 组 × ${action.quantity} ${label(action.unit)} · 休息 ${action.restSeconds} 秒`,
    ),
  );
  if (value.learning)
    lines.push(
      `${value.learning.topic} · ${formatAmount(value.learning.quantity)} ${label(value.learning.unit ?? '')} · ${value.learning.outcome}`,
    );
  if (value.nutrition)
    lines.push(
      `能量 ${formatAmount(value.nutrition.energy, ' kcal')} · 蛋白质 ${formatAmount(value.nutrition.protein, ' g')} · 碳水 ${formatAmount(value.nutrition.carbohydrate, ' g')} · 脂肪 ${formatAmount(value.nutrition.fat, ' g')}`,
    );
  return lines;
}
export function factLines(fact: Fact): readonly string[] {
  const data = fact.data;
  if (data.kind === 'TRAINING')
    return [
      `${label(data.status)} · ${formatAmount(data.durationMinutes, ' 分钟')} · ${data.feeling}`,
      ...data.actions.flatMap((action) =>
        action.sets.map(
          (set, index) =>
            `${action.name} 第 ${index + 1} 组 · ${set.quantity} ${label(set.unit)} · 负重 ${formatAmount(set.loadKg, ' kg')}`,
        ),
      ),
    ];
  if (data.kind === 'LEARNING')
    return [
      `${label(data.status)} · ${formatAmount(data.durationMinutes, ' 分钟')} · ${data.outcome}`,
      ...data.fragments.map((value) => `${value.quantity} ${label(value.unit)}`),
    ];
  if (data.kind === 'SLEEP')
    return [`入睡 ${localTime(data.beginAt)}`, data.endAt ? '起床 ' + localTime(data.endAt) : '睡眠进行中'];
  return data.lines.map(
    (line) =>
      `${line.name} · ${line.personalFactor ?? '未核对'} 份 · 每${line.portionUnit} ${formatAmount(line.energy.value, ' kcal')}`,
  );
}
