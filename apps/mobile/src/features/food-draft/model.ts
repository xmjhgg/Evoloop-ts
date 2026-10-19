import { amount } from '@evoloop/client-model';
import type { FormField, FormSpec } from '@evoloop/client-model';
import type { FoodDraft } from '@evoloop/client-business-core/execution';
import type { SendCommand } from '../../gateways/command-session.ts';
import { listValues } from '../form/list-values.ts';

const nutrients = [
  ['energy', '热量 kcal'],
  ['protein', '蛋白质 g'],
  ['carbohydrate', '碳水 g'],
  ['fat', '脂肪 g'],
] as const;
const nutrientFields: FormField[] = nutrients.flatMap(([key, title]) => [
  {
    key: key + 'State',
    label: title + '状态',
    initial: 'UNKNOWN',
    options: [
      { value: 'UNKNOWN', label: '未知' },
      { value: 'KNOWN', label: '已知' },
      { value: 'ESTIMATED', label: '估算' },
    ],
  },
  { key, label: '每份' + title },
  { key: key + 'Lower', label: title + '下界（可选）' },
  { key: key + 'Upper', label: title + '上界（可选）' },
]);
export function foodForm(send: SendCommand, day: string, lineId: string, draft?: FoodDraft): FormSpec {
  return {
    title: '饮食草案',
    description: '草案不计入摄入；可追加食物并核对本人食用份数。保留估算与未知状态。',
    fields: [
      { key: 'day', label: '日期 YYYY-MM-DD', initial: draft?.businessDate ?? day },
      {
        key: 'meal',
        label: '餐次',
        initial: draft?.mealCode ?? 'SNACK',
        options: [
          { value: 'BREAKFAST', label: '早餐' },
          { value: 'LUNCH', label: '午餐' },
          { value: 'DINNER', label: '晚餐' },
          { value: 'SNACK', label: '加餐' },
        ],
      },
      { key: 'description', label: '餐食说明', initial: draft?.description ?? '' },
      {
        key: 'foods',
        label: '食物明细',
        list: {
          maxRows: 100,
          initial:
            draft?.lines.map((line) => ({
              id: line.id,
              name: line.name,
              factor: line.personalFactor ?? '',
              unit: line.portionUnit,
              ...Object.fromEntries(
                nutrients.flatMap(([key]) => [
                  [key, line[key].value ?? ''],
                  [key + 'State', line[key].state],
                  [key + 'Lower', line[key].lower ?? ''],
                  [key + 'Upper', line[key].upper ?? ''],
                  [key + 'Source', line[key].source],
                ]),
              ),
            })) ?? [],
          fields: [
            { key: 'name', label: '食物名称' },
            { key: 'factor', label: '本人食用份数（如 0.5）' },
            { key: 'unit', label: '每份说明（如 100g）' },
            ...nutrientFields,
          ],
        },
      },
    ],
    async submit(v) {
      const lines = listValues(v['foods']).map((row, index) => ({
        id: row['id'] || lineId + ':' + index,
        name: row['name'],
        personalFactor: amount(row['factor']),
        portionUnit: row['unit'],
        ...Object.fromEntries(
          nutrients.map(([key]) => [
            key,
            {
              state: row[key + 'State'],
              value: amount(row[key]),
              lower: amount(row[key + 'Lower']),
              upper: amount(row[key + 'Upper']),
              unit: key === 'energy' ? 'kcal' : 'g',
              source: row[key + 'Source'] || '人工核对',
            },
          ]),
        ),
      }));
      await send('execution.food-draft.save', {
        id: draft?.id ?? null,
        expectedVersion: draft?.version ?? '0',
        businessDate: v['day'],
        mealCode: v['meal'],
        description: v['description'] ?? '',
        lines,
        evidence: draft?.evidence ?? [],
      });
    },
  };
}
