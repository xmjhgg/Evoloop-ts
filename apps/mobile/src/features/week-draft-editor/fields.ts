import type { FormField } from '@evoloop/client-model';
import type { Goal, PlanItem, Prescription } from '@evoloop/client-business-core/planning';

function trainingField(old: Prescription | undefined): FormField {
  return {
    key: 'actions',
    label: '训练动作处方',
    when: { key: 'kind', values: ['TRAINING'] },
    list: {
      maxRows: 50,
      initial: old?.actions.map((action) => ({ ...action })) ?? [],
      fields: [
        { key: 'name', label: '动作名称' },
        { key: 'sets', label: '组数' },
        { key: 'quantity', label: '每组数量' },
        {
          key: 'unit',
          label: '单位',
          initial: 'REP',
          options: [
            { value: 'REP', label: '次' },
            { value: 'SECOND', label: '秒' },
            { value: 'MINUTE', label: '分钟' },
          ],
        },
        { key: 'restSeconds', label: '组间休息秒数' },
      ],
    },
  };
}
function learningFields(old: Prescription | undefined): readonly FormField[] {
  const when = { key: 'kind', values: ['LEARNING'] };
  return [
    { key: 'topic', label: '学习主题', when, initial: old?.learning?.topic ?? '' },
    { key: 'quantity', label: '学习数量（可选）', when, initial: old?.learning?.quantity ?? '' },
    {
      key: 'unit',
      label: '学习单位',
      when,
      initial: old?.learning?.unit ?? 'MINUTE',
      options: [
        { value: 'MINUTE', label: '分钟' },
        { value: 'PAGE', label: '页' },
        { value: 'QUESTION', label: '题' },
      ],
    },
    { key: 'outcome', label: '学习产出', when, initial: old?.learning?.outcome ?? '' },
  ];
}
export function planFields(goal: Goal, item?: PlanItem): readonly FormField[] {
  const old = item?.prescription;
  return [
    {
      key: 'kind',
      label: '安排类型',
      initial: item?.kind ?? (goal.category === 'LEARNING' ? 'LEARNING' : 'TRAINING'),
      options: (goal.category === 'LEARNING'
        ? [
            ['LEARNING', '学习'],
            ['REST', '休息'],
          ]
        : [
            ['TRAINING', '训练'],
            ['SLEEP', '睡眠'],
            ['NUTRITION_TOTAL', '营养'],
            ['REST', '休息'],
          ]
      ).map(([value, title]) => ({ value: value!, label: title! })),
    },
    { key: 'title', label: '安排标题', initial: old?.title ?? '' },
    {
      key: 'time',
      label: '开始 HH:mm（可选）',
      initial: old?.startAt ? new Date(Date.parse(old.startAt) + 28800000).toISOString().slice(11, 16) : '',
    },
    { key: 'minutes', label: '分钟（可选）', initial: old?.minutes ?? '' },
    trainingField(old),
    ...learningFields(old),
    ...(['energy', 'protein', 'carbohydrate', 'fat'] as const).map((key) => ({
      key,
      label: { energy: '能量 kcal', protein: '蛋白质 g', carbohydrate: '碳水 g', fat: '脂肪 g' }[key],
      when: { key: 'kind', values: ['NUTRITION_TOTAL'] },
      initial: old?.nutrition?.[key] ?? '',
    })),
  ];
}
