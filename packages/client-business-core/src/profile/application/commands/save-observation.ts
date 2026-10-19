import { businessDate, nonnegative, requireThat } from '@evoloop/kernel';
import type { Transaction, ExecutionContext } from '../../../application/ports/public.ts';
import { expected, revision } from '../../../application/ports/entity.ts';
import type { Observation } from '../../domain/model.ts';

export function saveObservation(tx: Transaction, context: ExecutionContext, input: {
  id: string | null; expectedVersion: string; kind: Observation['kind']; observedAt: string;
  values: Observation['values']; remove: boolean;
}): Observation {
  requireThat(context.healthAllowed, 'PURPOSE_REQUIRED');
  const repository = tx.store('profile');
  const previous = input.id ? repository.get<Observation>('observation', input.id) : null;
  requireThat(!input.id || previous, 'NOT_FOUND');
  if (previous?.status === 'REMOVED' && input.remove) return previous;
  expected(previous, input.expectedVersion);
  requireThat(previous?.status !== 'REMOVED', 'FACT_REMOVED');
  requireThat(!previous || previous.kind === input.kind, 'FACT_KIND_MISMATCH');
  const day = businessDate(input.observedAt);
  requireThat(input.observedAt <= context.now, 'FUTURE_FACT');
  if (!input.remove) {
    requireThat(Object.values(input.values).some(item => item.value !== null), input.kind === 'MEASUREMENT' ? 'EMPTY_MEASUREMENT' : 'EMPTY_BODY_STATE');
    for (const item of Object.values(input.values)) {
      requireThat(item.unit.trim().length > 0, 'UNIT_REQUIRED');
      if (item.value !== null && input.kind === 'MEASUREMENT') nonnegative(item.value);
    }
    if (input.kind === 'BODY_STATE') {
      requireThat(!repository.all<Observation>('observation').some(item => item.id !== previous?.id && item.kind === 'BODY_STATE' && item.status === 'ACTIVE' && item.businessDate === day), 'BODY_STATE_DAY_OCCUPIED');
    }
  }
  const entity: Observation = { ...revision(context, 'observation', previous), kind: input.kind,
    status: input.remove ? 'REMOVED' : 'ACTIVE', observedAt: input.observedAt, businessDate: day,
    values: input.remove && previous ? previous.values : input.values };
  repository.save('observation', entity);
  const keys = [...new Set([day, previous?.businessDate ?? day])].map(value => 'profile:BODY_DAY:' + value);
  keys.forEach(key => tx.bump(key));
  tx.invalidate(keys);
  return entity;
}
