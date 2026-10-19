import { z } from 'zod';
import { refreshReview, editManual, acceptReviewCandidate, confirmScope, proposeAdjustment, submitAdjustment } from '../../review/public.ts';
import type { PlanningCollaborators } from '../../planning/public.ts';
import { handler, id, version } from './common.ts';
import { planItem } from './planning.ts';

export function reviewHandlers(ports: PlanningCollaborators) {
  return {
    'review.manual.edit': handler(z.object({ documentId: id, expectedVersion: version, entryId: id, text: z.string(), remove: z.boolean() }).strict(), editManual),
    'review.refresh': handler(z.object({ scope: z.object({ period: z.enum(['DAILY', 'WEEKLY']), date: z.string(), goalId: id.nullable(), slot: id }).strict(),
      expectedVersion: version, manualText: z.string().nullable(), manualFinal: z.boolean() }).strict(), refreshReview),
    'review.candidate.accept': handler(z.object({ documentId: id, expectedVersion: version, componentId: id, inputDigest: id, text: id }).strict(), acceptReviewCandidate),
    'review.scope.confirm': handler(z.object({ documentId: id, expectedVersion: version, componentIds: z.array(id), fingerprint: id, explicitConfirm: z.boolean() }).strict(), confirmScope),
    'review.adjustment.propose': handler(z.object({ documentId: id, expectedVersion: version, componentIds: z.array(id), weekId: id,
      changes: z.array(z.object({ itemId: id, oldValue: planItem, proposed: planItem, reason: id }).strict()) }).strict(), proposeAdjustment),
    'review.adjustment.submit': handler(z.object({ adjustmentId: id, expectedVersion: version,
      choices: z.array(z.object({ itemId: id, choice: z.enum(['KEEP_CURRENT', 'USE_PROPOSED', 'CUSTOM']), custom: planItem.nullable() }).strict()) }).strict(), (tx, context, input) => submitAdjustment(tx, context, ports, input)),
  };
}
