import { amount } from '@evoloop/client-model';
import type { FormSpec } from '@evoloop/client-model';
import type { Fact } from '@evoloop/client-business-core/execution';
import type { SendCommand } from '../../gateways/command-session.ts';
import { listValues } from '../form/list-values.ts';
import { activityFields } from './fields.ts';

function actionInput(input: string | undefined) {
  const groups = new Map<
    string,
    { name: string | undefined; sets: { quantity: string | null; unit: string | undefined; loadKg: string | null }[] }
  >();
  listValues(input).forEach((row, index) => {
    const key = (row['group'] ?? 'new:' + index) + ':' + row['name'];
    const group = groups.get(key) ?? { name: row['name'], sets: [] };
    group.sets.push({ quantity: amount(row['quantity']), unit: row['unit'], loadKg: amount(row['load']) });
    groups.set(key, group);
  });
  return [...groups.values()];
}
export function activityForm(
  send: SendCommand,
  day: string,
  kind: 'TRAINING' | 'LEARNING',
  fact?: Fact,
  planItemId?: string,
): FormSpec {
  return {
    title: kind === 'TRAINING' ? '训练记录' : '学习记录',
    fields: activityFields(day, kind, fact),
    description: '可逐项纠正动作和进度，保存会追加修订，原历史与计划基准保留。未知分钟留空，未执行需明确选择。',
    async submit(v) {
      const data =
        kind === 'TRAINING'
          ? {
              kind,
              status: v['status'],
              durationMinutes: amount(v['minutes']),
              feeling: v['note'] ?? '',
              actions: actionInput(v['sets']),
            }
          : {
              kind,
              status: v['status'],
              durationMinutes: amount(v['minutes']),
              outcome: v['note'] ?? '',
              fragments: listValues(v['fragments']).map((row) => ({
                quantity: amount(row['quantity']),
                unit: row['unit'],
              })),
            };
      await send('execution.fact.save', {
        id: fact?.id ?? null,
        expectedVersion: fact?.version ?? '0',
        businessDate: v['day'],
        data,
        planItemIds: planItemId ? [planItemId] : (fact?.baselineRefs.map((ref) => ref.item.id) ?? []),
        remove: false,
      });
    },
  };
}
