import { businessDate, requireThat } from '@evoloop/kernel';
import type { Transaction, ExecutionContext } from '../../../application/ports/public.ts';
import { expected, revision } from '../../../application/ports/entity.ts';
import { protectBaseline } from '../../../planning/public.ts';
import type { Fact } from '../../domain/model.ts';
import { validateFact } from '../../domain/fact-policy.ts';

export function saveFact(tx: Transaction, context: ExecutionContext, input: {
  id: string | null; expectedVersion: string; businessDate: string; data: Fact['data'];
  planItemIds: readonly string[]; remove: boolean;
}): Fact {
  const repository = tx.store('execution'), previous = input.id ? repository.get<Fact>('fact', input.id) : null;
  requireThat(!input.id || previous, 'NOT_FOUND');
  if (previous?.status === 'REMOVED' && input.remove) return previous;
  expected(previous, input.expectedVersion);
  requireThat(previous?.status !== 'REMOVED', 'FACT_REMOVED');
  requireThat(!previous || previous.data.kind === input.data.kind, 'FACT_KIND_MISMATCH');
  requireThat(input.data.kind === 'LEARNING' || context.healthAllowed, 'PURPOSE_REQUIRED');
  const day = input.remove && previous ? previous.businessDate : validateFact(input.data, input.businessDate, context.now);
  const refs = protectBaseline(tx, context, day, input.data.kind, previous && day !== previous.originalDate ? [] : input.planItemIds);
  if (input.data.kind === 'SLEEP' && !input.remove) protectBaseline(tx, context, businessDate(input.data.beginAt), 'SLEEP', []);
  const entity: Fact = { ...revision(context, 'fact', previous), businessDate: day, status: input.remove ? 'REMOVED' : 'ACTIVE',
    data: input.remove && previous ? previous.data : input.data, baselineRefs: previous?.baselineRefs ?? refs,
    originalDate: previous?.originalDate ?? day, baselineDateMismatch: day !== (previous?.originalDate ?? day) };
  repository.save('fact', entity);
  const keys = [...new Set([day, previous?.businessDate ?? day])].map(value => 'execution:FACT_DAY:' + value + ':' + input.data.kind);
  keys.forEach(key => tx.bump(key));
  tx.invalidate(keys);
  return entity;
}
