import type { Transaction } from '../../../application/ports/public.ts';
import type { ReviewDocument } from '../../domain/model.ts';

export function reviewDocument(tx: Transaction, id: string): ReviewDocument | null {
  return tx.store('review').get<ReviewDocument>('document', id);
}
export function reviewDocuments(tx: Transaction): readonly ReviewDocument[] {
  return tx.store('review').all<ReviewDocument>('document');
}
