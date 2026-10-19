import { requireThat } from '@evoloop/kernel';
import type { Transaction, ExecutionContext } from '../../../application/ports/public.ts';
import { expected, required, revision } from '../../../application/ports/entity.ts';
import type { Adjustment, ReviewDocument } from '../../domain/model.ts';
import { confirmedComponents } from './confirm-scope.ts';

export function proposeAdjustment(tx: Transaction, context: ExecutionContext, input: {
  documentId: string; expectedVersion: string; componentIds: readonly string[];
  weekId: string; changes: Adjustment['changes'];
}): Adjustment {
  const repository = tx.store('review'), document = required<ReviewDocument>(repository, 'document', input.documentId);
  expected(document, input.expectedVersion);
  const current = confirmedComponents(tx, document);
  requireThat(input.componentIds.length && input.componentIds.every(id => current.includes(id)), 'BASIS_STALE');
  const sources = tx.capture([], [{ collection: 'review.document', id: document.id, revisionId: document.revisionId }]);
  const entity: Adjustment = { ...revision(context, 'adjustment', null), documentId: document.id,
    componentIds: input.componentIds, sources, weekId: input.weekId, changes: input.changes, status: 'READY' };
  repository.save('adjustment', entity);
  return entity;
}
export function verifyAdjustmentBasis(tx: Transaction, documentId: string, ids: readonly string[], sources: Adjustment['sources']): boolean {
  const document = tx.store('review').get<ReviewDocument>('document', documentId);
  return !!document && tx.fresh(sources) && ids.length > 0 && ids.every(id => confirmedComponents(tx, document).includes(id));
}
