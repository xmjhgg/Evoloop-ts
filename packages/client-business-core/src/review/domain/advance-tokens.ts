import type { Transaction } from '../../application/ports/public.ts';
import type { ReviewDocument } from './model.ts';

export function advanceReviewTokens(tx: Transaction, document: ReviewDocument, slots: readonly string[]): void {
  const root = document.period === 'DAILY' ? 'review:DAILY:' + document.date : 'review:GOAL_WEEK:' + document.goalId + '|' + document.date;
  tx.bump(root);
  [...new Set(slots)].forEach(slot => tx.bump(root + ':' + slot));
}
