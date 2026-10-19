import { businessDate, nonnegative, requireThat } from '@evoloop/kernel';
import type { Transaction } from '../../../application/ports/public.ts';
import type { Observation } from '../../domain/model.ts';

export function validateProfileImport(tx: Transaction, now: string): void {
  const slots = new Set<string>();
  for (const observation of tx.store('profile').all<Observation>('observation')) {
    requireThat(businessDate(observation.observedAt) === observation.businessDate && observation.observedAt <= now, 'INVALID_OBSERVATION_DATE');
    if (observation.status !== 'ACTIVE') continue;
    if (observation.kind === 'BODY_STATE') {
      requireThat(!slots.has(observation.businessDate), 'BODY_STATE_DAY_OCCUPIED');
      slots.add(observation.businessDate);
    }
    requireThat(Object.values(observation.values).some(value => value.value !== null), 'EMPTY_OBSERVATION');
    if (observation.kind === 'MEASUREMENT') for (const item of Object.values(observation.values)) if (item.value !== null) nonnegative(item.value);
  }
}
