import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { required } from '../../../application/ports/entity.ts';
import type { Fact } from '../../domain/model.ts';
import { saveFact } from './save-fact.ts';

export function removeFact(tx: Transaction, context: ExecutionContext, input: { factId: string; expectedVersion: string }): Fact {
  const fact = required<Fact>(tx.store('execution'), 'fact', input.factId);
  return saveFact(tx, context, { id: fact.id, expectedVersion: input.expectedVersion, businessDate: fact.businessDate,
    data: fact.data, planItemIds: fact.baselineRefs.map(ref => ref.item.id), remove: true });
}
