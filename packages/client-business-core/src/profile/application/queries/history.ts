import type { Transaction } from '../../../application/ports/public.ts';
import type { Condition, Observation } from '../../domain/model.ts';
type Collections = { condition: Condition; observation: Observation };
export function profileHistory<K extends keyof Collections>(tx: Transaction, collection: K, id: string): readonly Collections[K][] {
  return tx.store('profile').history<Collections[K]>(collection, id);
}
