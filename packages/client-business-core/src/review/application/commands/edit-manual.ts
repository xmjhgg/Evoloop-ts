import { requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { expected, required, revision } from '../../../application/ports/entity.ts';
import type { ReviewDocument, ReviewComponent } from '../../domain/model.ts';
import { collectInput } from '../../domain/collect-input.ts';
import { advanceReviewTokens } from '../../domain/advance-tokens.ts';
import { requireReviewAccess } from '../../domain/scope-access.ts';

export function editManual(tx: Transaction, context: ExecutionContext, input: {
  documentId: string; expectedVersion: string; entryId: string; text: string; remove: boolean;
}): ReviewDocument {
  const repository = tx.store('review'), document = required<ReviewDocument>(repository, 'document', input.documentId);
  expected(document, input.expectedVersion);
  const entry = document.manual.find(item => item.id === input.entryId);
  requireThat(entry && !entry.removed, 'MANUAL_ENTRY_NOT_FOUND');
  requireReviewAccess(tx, context, entry.slot);
  requireThat(input.remove || input.text.trim(), 'EMPTY_MANUAL_NOTE');
  const key = 'review:MANUAL:' + document.id + '|' + entry.slot;
  tx.bump(key);
  const goalId = document.goalId ?? (entry.slot.startsWith('GOAL:') ? entry.slot.slice(5) : null);
  const manual = document.manual.map(item => item.id === entry.id ? { ...item, text: input.text, removed: input.remove } : item);
  const collected = collectInput(tx, { period: document.period, date: document.date, goalId, slot: entry.slot }, context.now, manual);
  const component: ReviewComponent = { ...collected, id: context.id('component'), slot: entry.slot, cutoff: context.now,
    text: '', state: 'SUMMARY_ONLY', stale: false };
  const entity: ReviewDocument = { ...document, ...revision(context, 'review', document),
    manual,
    components: document.components.filter(item => item.slot !== entry.slot).concat(component) };
  repository.save('document', entity);
  advanceReviewTokens(tx, entity, [entry.slot]);
  return entity;
}
