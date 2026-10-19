import type { FormSpec } from '@evoloop/client-model';
import type { Goal } from '@evoloop/client-business-core/planning';
import type { SendCommand } from '../../gateways/command-session.ts';

export function goalForm(send: SendCommand, today: string, goal?: Goal): FormSpec {
  return {
    title: goal ? '修改目标' : '新建目标',
    fields: [
      {
        key: 'category',
        label: '方向',
        initial: goal?.category ?? 'LEARNING',
        options: [
          { value: 'FITNESS', label: '健身' },
          { value: 'LEARNING', label: '学习' },
        ],
      },
      { key: 'name', label: '目标名称', initial: goal?.name ?? '' },
      { key: 'description', label: '目标说明', multiline: true, initial: goal?.description ?? '' },
      { key: 'measure', label: '衡量方式', initial: goal?.measure ?? '' },
      { key: 'start', label: '开始日期', initial: goal?.startDate ?? today },
      { key: 'end', label: '结束日期', initial: goal?.endDate ?? '' },
    ],
    async submit(v) {
      await send('planning.goal.save', {
        id: goal?.id ?? null,
        expectedVersion: goal?.version ?? '0',
        category: v['category'],
        name: v['name'],
        description: v['description'],
        measure: v['measure'],
        startDate: v['start'],
        endDate: v['end'],
      });
    },
  };
}
