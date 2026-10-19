import type { FormField } from '@evoloop/client-model';
import type { Fact, Training, Learning } from '@evoloop/client-business-core/execution';

function trainingField(previous: Training | null): FormField {
  return {
    key: 'sets',
    label: '实际动作与每组记录',
    list: {
      maxRows: 100,
      initial:
        previous?.actions.flatMap((action, group) =>
          action.sets.map((set) => ({
            group: String(group),
            name: action.name,
            quantity: set.quantity,
            unit: set.unit,
            load: set.loadKg ?? '',
          })),
        ) ?? [],
      fields: [
        { key: 'name', label: '动作名称' },
        { key: 'quantity', label: '本组数量' },
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
        { key: 'load', label: '本组负重 kg（未知留空）' },
      ],
    },
  };
}
function learningField(previous: Learning | null): FormField {
  return {
    key: 'fragments',
    label: '分段学习进度',
    list: {
      maxRows: 100,
      initial: previous?.fragments.map((value) => ({ ...value })) ?? [],
      fields: [
        { key: 'quantity', label: '数量' },
        {
          key: 'unit',
          label: '单位',
          initial: 'PAGE',
          options: [
            { value: 'MINUTE', label: '分钟' },
            { value: 'PAGE', label: '页' },
            { value: 'QUESTION', label: '题' },
          ],
        },
      ],
    },
  };
}
export function activityFields(day: string, kind: 'TRAINING' | 'LEARNING', fact?: Fact): readonly FormField[] {
  const previous = fact?.data.kind === kind ? fact.data : null;
  return [
    { key: 'day', label: '日期 YYYY-MM-DD', initial: fact?.businessDate ?? day },
    {
      key: 'status',
      label: '完成情况',
      initial: previous?.status ?? 'COMPLETED',
      options: [
        { value: 'COMPLETED', label: '完成' },
        { value: 'PARTIAL', label: '部分完成' },
        { value: 'NOT_PERFORMED', label: '未执行' },
      ],
    },
    { key: 'minutes', label: '实际分钟（未知留空）', initial: previous?.durationMinutes ?? '' },
    {
      key: 'note',
      label: kind === 'TRAINING' ? '感受' : '学习成果',
      multiline: true,
      initial: previous ? (previous.kind === 'TRAINING' ? previous.feeling : previous.outcome) : '',
    },
    kind === 'TRAINING'
      ? trainingField(previous?.kind === 'TRAINING' ? previous : null)
      : learningField(previous?.kind === 'LEARNING' ? previous : null),
  ];
}
