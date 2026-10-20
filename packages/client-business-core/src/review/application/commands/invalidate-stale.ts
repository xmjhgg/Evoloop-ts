import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { revision } from '../../../application/ports/entity.ts';
import type { Adjustment, ReviewDocument } from '../../domain/model.ts';
import { advanceReviewTokens } from '../../domain/advance-tokens.ts';
import { verifyAdjustmentBasis } from './propose-adjustment.ts';
import { componentFresh } from '../../domain/freshness.ts';

/** Runs before commit; the same freshness predicate also guards reads and confirmations. */
export function invalidateStale(tx: Transaction, context: ExecutionContext): void {
  const repository = tx.store('review');
  let changed = true;
  while (changed) {
    changed = false;
    for (const document of repository.all<ReviewDocument>('document')) {
      const staleIds = document.components.filter(component => !component.stale && !componentFresh(tx, component)).map(component => component.id);
      if (!staleIds.length) continue;
      changed = true;
      repository.save('document', { ...document, ...revision(context, 'invalidate:' + document.id + ':' + document.version, document),
        components: document.components.map(component => staleIds.includes(component.id) ? { ...component, stale: true } : component),
        confirmations: document.confirmations.map(confirmation => confirmation.componentIds.some(id => staleIds.includes(id)) ? { ...confirmation, stale: true } : confirmation) });
      advanceReviewTokens(tx, document, document.components.filter(component => staleIds.includes(component.id)).map(component => component.slot));
    }
  }
  for (const adjustment of repository.all<Adjustment>('adjustment')) {
    if (adjustment.status !== 'READY' || verifyAdjustmentBasis(tx, adjustment.documentId, adjustment.componentIds, adjustment.sources)) continue;
    repository.save('adjustment', { ...adjustment, ...revision(context, 'stale-adjustment:' + adjustment.id, adjustment), status: 'STALE' });
  }
}
