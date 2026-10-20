import { canonical, requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { revision } from '../../../application/ports/entity.ts';
import type { BaselineRef, Protection, WeekPlan } from '../../domain/model.ts';

function selectRefs(refs: readonly BaselineRef[], kind: string, itemIds: readonly string[], mode: 'AUTO' | 'SELECTED' | 'UNPLANNED') {
  requireThat(itemIds.every(id => refs.some(ref => ref.item.id === id)), 'BASELINE_CONFLICT');
  if (mode === 'UNPLANNED') {
    requireThat(itemIds.length === 0, 'BASELINE_CONFLICT');
    return [];
  }
  const selected = itemIds.length || mode === 'SELECTED' ? refs.filter(ref => itemIds.includes(ref.item.id)) : kind === 'MEAL' || kind === 'SLEEP' ? refs : [];
  if (kind === 'MEAL' || kind === 'SLEEP') {
    const distinct = new Set(selected.map(ref => canonical(kind === 'MEAL' ? ref.item.prescription.nutrition
      : { startAt: ref.item.prescription.startAt, minutes: ref.item.prescription.minutes })));
    requireThat(distinct.size <= 1, 'BASELINE_SELECTION_REQUIRED');
  }
  return selected;
}
export function protectBaseline(tx: Transaction, context: ExecutionContext, day: string, kind: string, itemIds: readonly string[], mode: 'AUTO' | 'SELECTED' | 'UNPLANNED' = 'AUTO'): readonly BaselineRef[] {
  const repository = tx.store('planning'), guardId = day + '|' + kind;
  const previous = repository.get<Protection>('guard', guardId);
  if (previous) {
    return selectRefs(previous.refs, kind, itemIds, mode);
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
  return selectRefs(refs, kind, itemIds, mode);
}
