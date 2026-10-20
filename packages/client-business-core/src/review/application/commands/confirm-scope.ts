import { digest, requireThat } from '@evoloop/kernel';
import type { Transaction, ExecutionContext } from '../../../application/ports/public.ts';
import { expected, required, revision } from '../../../application/ports/entity.ts';
import type { ReviewDocument } from '../../domain/model.ts';
import { advanceReviewTokens } from '../../domain/advance-tokens.ts';
import { requireReviewAccess } from '../../domain/scope-access.ts';
import { componentFresh } from '../../domain/freshness.ts';

export function confirmationFingerprint(document: ReviewDocument, ids: readonly string[]): string {
  return digest(ids.slice().sort().map(id => {
    const component = document.components.find(item => item.id === id);
    requireThat(component, 'CONFIRMATION_SCOPE_MISMATCH');
    return { id, inputDigest: component.inputDigest, cutoff: component.cutoff, coverage: component.coverage, text: component.text };
  }));
}
export function confirmScope(tx: Transaction, context: ExecutionContext, input: {
  documentId: string; expectedVersion: string; componentIds: readonly string[]; fingerprint: string; explicitConfirm: boolean;
}): ReviewDocument {
  requireThat(input.explicitConfirm && input.componentIds.length > 0, 'EXPLICIT_CONFIRMATION_REQUIRED');
  requireThat(new Set(input.componentIds).size === input.componentIds.length, 'CONFIRMATION_SCOPE_MISMATCH');
  const repository = tx.store('review'), document = required<ReviewDocument>(repository, 'document', input.documentId);
  expected(document, input.expectedVersion);
  requireThat(confirmationFingerprint(document, input.componentIds) === input.fingerprint, 'SOURCE_STALE');
  for (const id of input.componentIds) {
    const component = document.components.find(item => item.id === id)!;
    requireThat(componentFresh(tx, component), 'SOURCE_STALE');
    requireThat(component.state !== 'SUMMARY_ONLY', 'FINAL_JUDGMENT_REQUIRED');
    requireReviewAccess(tx, context, component.slot);
  }
  const entity: ReviewDocument = { ...document, ...revision(context, 'review', document), confirmations: [...document.confirmations,
    { id: context.id('confirmation'), componentIds: input.componentIds, fingerprint: input.fingerprint, at: context.now, stale: false }] };
  repository.save('document', entity);
  advanceReviewTokens(tx, entity, document.components.filter(component => input.componentIds.includes(component.id)).map(component => component.slot));
  return entity;
}
export function confirmedComponents(tx: Transaction, document: ReviewDocument): readonly string[] {
  return document.components.filter(component => componentFresh(tx, component) && document.confirmations.some(confirmation => !confirmation.stale && confirmation.componentIds.includes(component.id))).map(component => component.id);
}
