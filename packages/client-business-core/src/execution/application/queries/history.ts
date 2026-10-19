import type { Transaction } from '../../../application/ports/public.ts';
import type { Fact, FoodDraft } from '../../domain/model.ts';
type Collections = { fact: Fact; 'food-draft': FoodDraft };
export function executionHistory<K extends keyof Collections>(tx: Transaction, collection: K, id: string): readonly Collections[K][] {
  return tx.store('execution').history<Collections[K]>(collection, id);
}
