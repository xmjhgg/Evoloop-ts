import { requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { expected, required, revision } from '../../../application/ports/entity.ts';
import type { ReviewDocument } from '../../domain/model.ts';
import { advanceReviewTokens } from '../../domain/advance-tokens.ts';

export function acceptReviewCandidate(tx: Transaction, context: ExecutionContext, input: {
  documentId: string; expectedVersion: string; componentId: string; inputDigest: string; text: string;
}): ReviewDocument {
  requireThat(context.aiAllowed && input.text.trim(), 'PURPOSE_REQUIRED');
  const repository = tx.store('review'), document = required<ReviewDocument>(repository, 'document', input.documentId);
  expected(document, input.expectedVersion);
  const component = document.components.find(item => item.id === input.componentId);
  requireThat(component && component.state !== 'MANUAL_FINAL_JUDGMENT', 'COMPONENT_NOT_ACCEPTABLE');
  requireThat(component.inputDigest === input.inputDigest && !component.stale && tx.fresh(component.sources), 'SOURCE_STALE');
  const entity: ReviewDocument = { ...document, ...revision(context, 'review', document), components: document.components.map(item => item.id === component.id
    ? { ...item, id: context.id('component'), text: input.text, state: 'AWAITING_CONFIRMATION' } : item) };
  repository.save('document', entity);
  advanceReviewTokens(tx, entity, [component.slot]);
  return entity;
}
