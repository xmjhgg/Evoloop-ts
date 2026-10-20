import { requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { expected, required, revision } from '../../../application/ports/entity.ts';
import type { Adjustment } from '../../domain/model.ts';

export function dismissAdjustment(
  tx: Transaction,
  context: ExecutionContext,
  input: { adjustmentId: string; expectedVersion: string },
): Adjustment {
  const repository = tx.store('review'),
    previous = required<Adjustment>(repository, 'adjustment', input.adjustmentId);
  expected(previous, input.expectedVersion);
  if (previous.status === 'DISMISSED') return previous;
  requireThat(previous.status !== 'SUBMITTED', 'ADJUSTMENT_ALREADY_SUBMITTED');
  const entity: Adjustment = { ...previous, ...revision(context, 'dismiss-adjustment', previous), status: 'DISMISSED' };
  repository.save('adjustment', entity);
  return entity;
}
