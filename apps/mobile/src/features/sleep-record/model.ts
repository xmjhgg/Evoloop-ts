import { localInstant, requiredText } from '@evoloop/client-model';
import type { FormSpec } from '@evoloop/client-model';
import type { Fact } from '@evoloop/client-business-core/execution';
import type { SendCommand } from '../../gateways/command-session.ts';

function parts(instant: string | null | undefined) {
  if (!instant) return ['', ''];
  const local = new Date(Date.parse(instant) + 8 * 3600000).toISOString();
  return [local.slice(0, 10), local.slice(11, 16)];
}
export function sleepForm(send: SendCommand, day: string, fact?: Fact): FormSpec {
  const previous = fact?.data.kind === 'SLEEP' ? fact.data : null;
  const [beginDay, beginTime] = parts(previous?.beginAt),
    [endDay, endTime] = parts(previous?.endAt);
  return {
    title: '睡眠记录',
    description: '时间按北京时间填写。尚未起床时，起床时间留空；之后可完成同一条记录。',
    fields: [
      { key: 'beginDay', label: '入睡日期 YYYY-MM-DD', initial: beginDay ?? '' },
      { key: 'beginTime', label: '入睡 HH:mm', initial: beginTime ?? '' },
      { key: 'endDay', label: '起床日期 YYYY-MM-DD', initial: endDay || day },
      { key: 'endTime', label: '起床 HH:mm（进行中留空）', initial: endTime ?? '' },
    ],
    async submit(v) {
      await send('execution.fact.save', {
        id: fact?.id ?? null,
        expectedVersion: fact?.version ?? '0',
        businessDate: v['endDay'],
        data: {
          kind: 'SLEEP',
          beginAt: localInstant(requiredText(v['beginDay']), requiredText(v['beginTime'])),
          endAt: v['endTime']?.trim() ? localInstant(requiredText(v['endDay']), v['endTime']) : null,
          provisionalWakeDate: v['endDay'],
        },
        planItemIds: [],
        remove: false,
      });
    },
  };
}
