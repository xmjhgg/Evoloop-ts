import { requireThat } from '@evoloop/kernel';
import type { Transaction, ExecutionContext } from '../../../application/ports/public.ts';
import { expected, required, revision } from '../../../application/ports/entity.ts';
import type { Adjustment, ReviewDocument } from '../../domain/model.ts';
import { confirmedComponents } from './confirm-scope.ts';
import { weeks, goals } from '../../../planning/public.ts';
import { requireReviewAccess } from '../../domain/scope-access.ts';

export function proposeAdjustment(tx: Transaction, context: ExecutionContext, input: {
  documentId: string; expectedVersion: string; componentIds: readonly string[];
  weekId: string; changes: Adjustment['changes'];
}): Adjustment {
  const repository = tx.store('review'), document = required<ReviewDocument>(repository, 'document', input.documentId);
  expected(document, input.expectedVersion);
  const current = confirmedComponents(tx, document);
  requireThat(input.componentIds.length && new Set(input.componentIds).size === input.componentIds.length && input.componentIds.every(id => current.includes(id)), 'BASIS_STALE');
  const week = weeks(tx).find(value => value.id === input.weekId), goal = goals(tx).find(value => value.id === week?.goalId);
  requireThat(week && goal, 'NOT_FOUND');
  const slots = document.components.filter(component => input.componentIds.includes(component.id)).map(component => component.slot);
  for (const slot of slots) requireReviewAccess(tx, context, slot);
  requireThat(slots.some(slot => slot === 'GOAL:' + goal.id || slot === (goal.category === 'FITNESS' ? 'HEALTH' : 'LEARNING')), 'CONFIRMATION_SCOPE_MISMATCH');
  requireThat(input.changes.length > 0 && new Set(input.changes.map(change => change.itemId)).size === input.changes.length, 'INVALID_ADJUSTMENT');
  requireThat(input.changes.every(change => change.reason.trim() && week.draft.some(item => item.id === change.itemId)
    && change.oldValue.id === change.itemId && change.proposed.id === change.itemId), 'INVALID_ADJUSTMENT');
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
