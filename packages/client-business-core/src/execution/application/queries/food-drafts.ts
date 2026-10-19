import type { Transaction } from '../../../application/ports/public.ts';
import type { FoodDraft, Fact } from '../../domain/model.ts';
export function foodDrafts(tx: Transaction, day: string): readonly FoodDraft[] {
  return tx.store('execution').all<FoodDraft>('food-draft').filter(draft => draft.businessDate === day);
}
export function recordHistoryIndex(tx: Transaction, day: string): readonly Fact[] {
  return tx.store('execution').all<Fact>('fact').filter(fact => fact.businessDate === day || fact.originalDate === day);
}
export function foodEvidence(tx: Transaction): readonly string[] {
  const repository = tx.store('execution'), drafts = repository.all<FoodDraft>('food-draft');
  return [...new Set(drafts.flatMap(draft => [draft, ...repository.history<FoodDraft>('food-draft', draft.id)]).flatMap(draft => draft.evidence))];
}
