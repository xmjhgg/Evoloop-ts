import { confirmationFingerprint } from '@evoloop/client-business-core/review';
import type { ReviewDocument } from '@evoloop/client-business-core/review';
import type { SendCommand } from '../../gateways/command-session.ts';
import { confirm } from '../../ui/confirm.ts';

export async function confirmReview(send: SendCommand, document: ReviewDocument, componentId: string) {
  const component = document.components.find((value) => value.id === componentId);
  if (!component || !(await confirm('确认本段复盘', component.text + '\n确认只保存这段结论；未来计划另行审查和发布。')))
    return;
  await send('review.scope.confirm', {
    documentId: document.id,
    expectedVersion: document.version,
    componentIds: [componentId],
    fingerprint: confirmationFingerprint(document, [componentId]),
    explicitConfirm: true,
  });
}
