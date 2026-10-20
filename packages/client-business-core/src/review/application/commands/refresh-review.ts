import { businessDate, requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { expected, revision } from '../../../application/ports/entity.ts';
import type { ReviewComponent, ReviewDocument, ReviewScope } from '../../domain/model.ts';
import { collectInput, documentId } from '../../domain/collect-input.ts';
import { advanceReviewTokens } from '../../domain/advance-tokens.ts';
import { requireReviewAccess } from '../../domain/scope-access.ts';

export function refreshReview(tx: Transaction, context: ExecutionContext, input: {
  scope: ReviewScope; expectedVersion: string; manualText: string | null; manualFinal: boolean;
}): ReviewDocument {
  requireThat(input.scope.date <= businessDate(context.now), 'FUTURE_REVIEW');
  requireReviewAccess(tx, context, input.scope.slot);
  requireThat(!input.manualFinal || input.manualText?.trim(), 'MANUAL_JUDGMENT_REQUIRED');
  const repository = tx.store('review'), id = documentId(input.scope), previous = repository.get<ReviewDocument>('document', id);
  expected(previous, input.expectedVersion);
  const manual = [...previous?.manual ?? []];
  if (input.manualText !== null) {
    requireThat(input.manualText.trim(), 'EMPTY_MANUAL_NOTE');
    manual.push({ id: context.id('manual'), slot: input.scope.slot, text: input.manualText, removed: false });
    tx.bump('review:MANUAL:' + id + '|' + input.scope.slot);
  }
  const collected = collectInput(tx, input.scope, context.now, manual);
  const component: ReviewComponent = { id: context.id('component'), slot: input.scope.slot, ...collected,
    cutoff: context.now, text: input.manualText ?? '', state: input.manualFinal ? 'MANUAL_FINAL_JUDGMENT' : 'SUMMARY_ONLY', stale: false };
  const entity: ReviewDocument = { ...revision(context, 'review', previous), id, period: input.scope.period, date: input.scope.date,
    goalId: input.scope.period === 'DAILY' ? null : input.scope.goalId,
    components: [...previous?.components.filter(item => item.slot !== input.scope.slot) ?? [], component], manual,
    confirmations: previous?.confirmations ?? [] };
  repository.save('document', entity);
  advanceReviewTokens(tx, entity, [input.scope.slot]);
  return entity;
}
