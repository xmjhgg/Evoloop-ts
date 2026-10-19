import { amount, localInstant, requiredText } from '@evoloop/client-model';
import type { FormSpec, FormValues } from '@evoloop/client-model';
import type { Goal, PlanItem, WeekPlan } from '@evoloop/client-business-core/planning';
import type { SendCommand } from '../../gateways/command-session.ts';
import { listValues } from '../form/list-values.ts';
import { planFields } from './fields.ts';

function prescriptionInput(v: FormValues, day: string, prefix: string) {
  const rows = listValues(v['actions']),
    used = new Set(rows.map((row) => row['id']).filter(Boolean));
  const actions = rows.map((row, index) => {
    let id = row['id'];
    if (!id) {
      id = prefix + ':' + index;
      while (used.has(id)) id += ':new';
      used.add(id);
    }
    return {
      id,
      name: row['name'],
      sets: row['sets'],
      quantity: amount(row['quantity']),
      unit: row['unit'],
      restSeconds: amount(row['restSeconds']),
    };
  });
  return {
    title: requiredText(v['title']),
    startAt: v['time']?.trim() ? localInstant(day, v['time']) : null,
    minutes: amount(v['minutes']),
    actions,
    learning:
      v['kind'] === 'LEARNING'
        ? {
            topic: requiredText(v['topic']),
            quantity: amount(v['quantity']),
            unit: v['unit'],
            outcome: v['outcome'] ?? '',
          }
        : null,
    nutrition:
      v['kind'] === 'NUTRITION_TOTAL'
        ? {
            energy: amount(v['energy']),
            protein: amount(v['protein']),
            carbohydrate: amount(v['carbohydrate']),
            fat: amount(v['fat']),
            unit: 'kcal/g',
          }
        : null,
  };
}
export function planForm(
  send: SendCommand,
  goal: Goal,
  start: string,
  day: string,
  week?: WeekPlan,
  item?: PlanItem,
): FormSpec {
  return {
    title: `${day} 的安排`,
    description: '保存仅更新草案。动作处方可逐项修改；审查和发布分别执行。',
    fields: planFields(goal, item),
    async submit(v) {
      if (item && item.kind !== v['kind']) throw Error('已有安排不能改变类型，请移除后另建');
      await send('planning.week.patch-draft', {
        goalId: goal.id,
        weekStart: start,
        expectedVersion: week?.version ?? '0',
        changes: [
          {
            id: item?.id ?? null,
            businessDate: day,
            kind: v['kind'],
            disposition: 'PLANNED',
            prescription: prescriptionInput(v, day, goal.id + ':' + day + ':action'),
          },
        ],
      });
    },
  };
}
