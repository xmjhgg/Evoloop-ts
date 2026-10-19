import { amount, requiredText } from '@evoloop/client-model';
import type { FormSpec } from '@evoloop/client-model';
import type { ReviewDocument } from '@evoloop/client-business-core/review';
import type { WeekPlan } from '@evoloop/client-business-core/planning';
import type { SendCommand } from '../../gateways/command-session.ts';

export function adjustmentForm(
  send: SendCommand,
  document: ReviewDocument,
  componentId: string,
  weeks: readonly WeekPlan[],
  today: string,
): FormSpec {
  const options = weeks.flatMap((week) =>
    week.draft.filter((item) => item.businessDate > today).map((item) => ({ week, item })),
  );
  if (!options.length) throw Error('先在计划安排中建立未来草案，再提出调整');
  return {
    title: '保存未来调整建议',
    description: '建议单独保存。选择处理方式后才合并为草案，计划仍需重新审查并发布。',
    fields: [
      {
        key: 'item',
        label: '选择未来安排',
        initial: options[0]!.item.id,
        options: options.map((value) => ({
          value: value.item.id,
          label: value.item.businessDate + ' · ' + value.item.prescription.title,
        })),
      },
      { key: 'title', label: '建议标题（空白保留原值）' },
      { key: 'minutes', label: '建议分钟（空白保留原值）' },
      { key: 'reason', label: '调整原因', multiline: true },
    ],
    async submit(v) {
      const choice = options.find((value) => value.item.id === v['item']);
      if (!choice) throw Error('所选安排不存在，请重新打开');
      await send('review.adjustment.propose', {
        documentId: document.id,
        expectedVersion: document.version,
        componentIds: [componentId],
        weekId: choice.week.id,
        changes: [
          {
            itemId: choice.item.id,
            oldValue: choice.item,
            proposed: {
              ...choice.item,
              prescription: {
                ...choice.item.prescription,
                title: v['title']?.trim() || choice.item.prescription.title,
                minutes: amount(v['minutes']) ?? choice.item.prescription.minutes,
              },
            },
            reason: requiredText(v['reason']),
          },
        ],
      });
    },
  };
}
