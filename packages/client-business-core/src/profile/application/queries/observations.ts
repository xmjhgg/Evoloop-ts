import type { Transaction } from '../../../application/ports/public.ts';
import type { Observation } from '../../domain/model.ts';

export function observations(tx: Transaction, day: string): readonly Observation[] {
  return tx.store('profile').all<Observation>('observation').filter(item => item.businessDate === day && item.status === 'ACTIVE');
}
