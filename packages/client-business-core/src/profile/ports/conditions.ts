import type { Transaction } from '../../application/ports/public.ts';
import type { Condition, ConditionSection } from '../domain/model.ts';

export function conditionSnapshot(tx: Transaction, section: ConditionSection): Condition | null {
  return tx.store('profile').get<Condition>('condition', section);
}
