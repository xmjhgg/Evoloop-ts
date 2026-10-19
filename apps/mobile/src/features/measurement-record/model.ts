import { amount, localInstant, requiredText } from '@evoloop/client-model';
import type { FormSpec } from '@evoloop/client-model';
import type { Observation } from '@evoloop/client-business-core/profile';
import type { SendCommand } from '../../gateways/command-session.ts';

export function measurementForm(send: SendCommand, day: string, previous?: Observation): FormSpec {
  return {
    title: '身体测量',
    description: '未知值留空，修改会保留原修订。',
    fields: [
      { key: 'day', label: '日期', initial: previous?.businessDate ?? day },
      {
        key: 'time',
        label: '测量时间 HH:mm',
        initial: previous ? new Date(Date.parse(previous.observedAt) + 28800000).toISOString().slice(11, 16) : '',
      },
      { key: 'weight', label: '体重 kg', initial: previous?.values['weight']?.value ?? '' },
      { key: 'waist', label: '腰围 cm', initial: previous?.values['waist']?.value ?? '' },
    ],
    async submit(v) {
      await send('profile.observation.save', {
        id: previous?.id ?? null,
        expectedVersion: previous?.version ?? '0',
        kind: 'MEASUREMENT',
        observedAt: localInstant(requiredText(v['day']), requiredText(v['time'])),
        remove: false,
        values: {
          ...previous?.values,
          weight: { value: amount(v['weight']), unit: 'kg' },
          waist: { value: amount(v['waist']), unit: 'cm' },
        },
      });
    },
  };
}
