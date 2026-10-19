import type { FormSpec } from '@evoloop/client-model';
import type { ReviewDocument, ReviewScope } from '@evoloop/client-business-core/review';
import type { SendCommand } from '../../gateways/command-session.ts';

export function reviewForm(send: SendCommand, scope: ReviewScope, document?: ReviewDocument | null): FormSpec {
  return {
    title: '保存复盘判断',
    description: '人工判断与确认分开。保存判断会更新来源快照，随后可核对并确认本段复盘。',
    fields: [{ key: 'text', label: '我的判断', multiline: true }],
    async submit(v) {
      await send('review.refresh', {
        scope,
        expectedVersion: document?.version ?? '0',
        manualText: v['text'] ?? '',
        manualFinal: true,
      });
    },
  };
}
