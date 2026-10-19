import { requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { revision } from '../../../application/ports/entity.ts';
import type { BaselineRef, Protection, WeekPlan } from '../../domain/model.ts';

export function protectBaseline(tx: Transaction, context: ExecutionContext, day: string, kind: string, itemIds: readonly string[]): readonly BaselineRef[] {
  const repository = tx.store('planning'), guardId = day + '|' + kind;
  const previous = repository.get<Protection>('guard', guardId);
  if (previous) {
    requireThat(itemIds.every(id => previous.refs.some(ref => ref.item.id === id)), 'BASELINE_CONFLICT');
    return previous.refs.filter(ref => kind === 'MEAL' || itemIds.includes(ref.item.id));
  }
  const refs: BaselineRef[] = [];
  for (const week of repository.all<WeekPlan>('week')) {
    for (const item of week.published) {
      const matchingKind = item.kind === (kind === 'MEAL' ? 'NUTRITION_TOTAL' : kind);
      if (item.businessDate === day && matchingKind && item.disposition === 'PLANNED') refs.push({ weekId: week.id, goalId: week.goalId, item });
    }
  }
  requireThat(itemIds.every(id => refs.some(ref => ref.item.id === id)), 'BASELINE_CONFLICT');
  const guard: Protection = { ...revision(context, 'guard:' + guardId, null), id: guardId, businessDate: day, kind, refs, frozenAbsence: refs.length === 0 };
  repository.save('guard', guard);
  const key = 'planning:PLAN_DAY:' + day;
  tx.bump(key);
  const dimension = key + ':' + (kind === 'MEAL' ? 'NUTRITION_TOTAL' : kind);
  tx.bump(dimension);
  tx.invalidate([key, dimension]);
  return refs.filter(ref => kind === 'MEAL' || itemIds.includes(ref.item.id));
}
