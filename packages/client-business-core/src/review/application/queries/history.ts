import type { Transaction } from '../../../application/ports/public.ts';
import type { ReviewDocument, Adjustment } from '../../domain/model.ts';
type Collections = { document: ReviewDocument; adjustment: Adjustment };
export function reviewHistory<K extends keyof Collections>(tx: Transaction, collection: K, id: string): readonly Collections[K][] {
  return tx.store('review').history<Collections[K]>(collection, id);
}
