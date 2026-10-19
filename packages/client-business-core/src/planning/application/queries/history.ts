import type { Transaction } from '../../../application/ports/public.ts';
import type { Goal, WeekPlan, Protection } from '../../domain/model.ts';
type Collections = { goal: Goal; week: WeekPlan; guard: Protection };
export function planningHistory<K extends keyof Collections>(tx: Transaction, collection: K, id: string): readonly Collections[K][] {
  return tx.store('planning').history<Collections[K]>(collection, id);
}
