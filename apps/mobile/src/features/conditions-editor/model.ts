import type { FormSpec } from '@evoloop/client-model';
import type { Condition, ConditionSection } from '@evoloop/client-business-core/profile';
import type { SendCommand } from '../../gateways/command-session.ts';

const sections = {
  COMMON: [
    ['routine', '作息'],
    ['availability', '可安排时间'],
  ],
  FITNESS: [
    ['experience', '训练经验'],
    ['equipment', '设备'],
    ['limitations', '身体限制'],
  ],
  LEARNING: [
    ['resources', '学习资源'],
    ['preferences', '学习偏好'],
    ['availability', '学习时间'],
  ],
} as const;
export function conditionForm(send: SendCommand, section: ConditionSection, previous: Condition | null): FormSpec {
  return {
    title: '编辑条件',
    fields: sections[section].map(([key, title]) => ({
      key,
      label: title,
      multiline: true,
      initial: typeof previous?.values[key] === 'string' ? previous.values[key] : '',
    })),
    async submit(v) {
      const keys = sections[section].map(([key]) => key);
      await send('profile.condition.edit', {
        section,
        expectedVersion: previous?.version ?? '0',
        updateMask: keys,
        values: Object.fromEntries(keys.map((key) => [key, v[key]?.trim() || null])),
      });
    },
  };
}
