import type { Transaction } from '../../../application/ports/public.ts';
import type { Adjustment } from '../../domain/model.ts';
export function adjustments(tx: Transaction, documentId: string): readonly Adjustment[] {
  return tx.store('review').all<Adjustment>('adjustment').filter(value => value.documentId === documentId);
}
