import { requireThat } from '@evoloop/kernel';
import type { Transaction, ExecutionContext } from '../../../application/ports/public.ts';
import { required, revision } from '../../../application/ports/entity.ts';
import { mergeAdjustment } from '../../../planning/public.ts';
import type { PlanningCollaborators, AdjustmentMerge } from '../../../planning/public.ts';
import type { Adjustment } from '../../domain/model.ts';

export function submitAdjustment(tx: Transaction, context: ExecutionContext, ports: PlanningCollaborators, input: {
  adjustmentId: string; expectedVersion: string; choices: AdjustmentMerge['choices'];
}): Adjustment {
  const repository = tx.store('review'), adjustment = required<Adjustment>(repository, 'adjustment', input.adjustmentId);
  requireThat(adjustment.status === 'READY', 'ADJUSTMENT_NOT_READY');
  mergeAdjustment(tx, context, ports, { ...adjustment, expectedVersion: input.expectedVersion, choices: input.choices });
  const entity: Adjustment = { ...adjustment, ...revision(context, 'adjustment', adjustment), status: 'SUBMITTED' };
  repository.save('adjustment', entity);
  return entity;
}
