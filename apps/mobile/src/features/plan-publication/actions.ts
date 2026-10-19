import type { WeekPlan } from '@evoloop/client-business-core/planning';
import { label, prescriptionLines } from '@evoloop/client-model';
import type { SendCommand } from '../../gateways/command-session.ts';
import { confirm } from '../../ui/confirm.ts';

export async function publishDay(send: SendCommand, week: WeekPlan, day: string) {
  const selected = week.draft.filter(
    (item) =>
      item.businessDate === day && item.revisionId !== week.published.find((old) => old.id === item.id)?.revisionId,
  );
  if (!selected.length) throw Error('这一天没有待发布差异');
  if (
    !(await confirm(
      '确认生效',
      selected
        .map(
          (item) =>
            `${label(item.kind)} · ${label(item.disposition)}\n${prescriptionLines(item.prescription).join('\n')}`,
        )
        .join('\n') + '\n仅发布这一天的所列差异。',
    ))
  )
    return;
  await send('planning.week.publish', {
    weekId: week.id,
    expectedVersion: week.version,
    explicitConfirm: true,
    selected: selected.map((item) => ({
      itemId: item.id,
      expectedPublishedRevision: week.published.find((old) => old.id === item.id)?.revisionId ?? null,
    })),
  });
}
export async function removePlan(send: SendCommand, week: WeekPlan, id: string) {
  const item = week.draft.find((value) => value.id === id);
  if (!item || !(await confirm('从草案移除', item.prescription.title + '\n已发布安排需再次审查并发布后才会变更。')))
    return;
  await send('planning.week.patch-draft', {
    goalId: week.goalId,
    weekStart: week.weekStart,
    expectedVersion: week.version,
    changes: [
      { id, businessDate: item.businessDate, kind: item.kind, disposition: 'REMOVED', prescription: item.prescription },
    ],
  });
}
