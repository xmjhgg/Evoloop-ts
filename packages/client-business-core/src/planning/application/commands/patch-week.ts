import { canonical, requireThat, weekStart } from '@evoloop/kernel';
import type { Transaction, ExecutionContext } from '../../../application/ports/public.ts';
import { expected, required, revision } from '../../../application/ports/entity.ts';
import type { Goal, PlanItem, WeekPlan } from '../../domain/model.ts';
import { validateItem } from '../../domain/prescription-policy.ts';
import { validateDraftSlots } from '../../domain/draft-slots.ts';

export function patchWeek(tx: Transaction, context: ExecutionContext, input: {
  goalId: string; weekStart: string; expectedVersion: string;
  changes: readonly { id: string | null; businessDate: string; kind: PlanItem['kind']; disposition: PlanItem['disposition']; prescription: PlanItem['prescription'] }[];
}): WeekPlan {
  const repository = tx.store('planning'), goal = required<Goal>(repository, 'goal', input.goalId);
  requireThat(goal.status === 'ACTIVE' || goal.status === 'PENDING_REPLAN', 'GOAL_NOT_ACTIVE');
  requireThat(goal.category !== 'FITNESS' || context.healthAllowed, 'PURPOSE_REQUIRED');
  requireThat(weekStart(input.weekStart) === input.weekStart, 'WEEK_MUST_START_MONDAY');
  const id = input.goalId + '|' + input.weekStart, previous = repository.get<WeekPlan>('week', id);
  expected(previous, input.expectedVersion);
  const items = new Map((previous?.draft ?? previous?.published ?? []).map(item => [item.id, item]));
  requireThat(new Set(input.changes.filter(item => item.id).map(item => item.id)).size === input.changes.filter(item => item.id).length, 'DUPLICATE_ITEM');
  input.changes.forEach((change, index) => {
    const old = change.id ? items.get(change.id) : null;
    requireThat(!change.id || old, 'ITEM_NOT_FOUND');
    requireThat(weekStart(change.businessDate) === input.weekStart, 'ITEM_OUTSIDE_WEEK');
    requireThat(change.businessDate >= goal.startDate && change.businessDate <= goal.endDate, 'ITEM_OUTSIDE_GOAL_PERIOD');
    requireThat(goal.category === 'LEARNING' ? change.kind === 'LEARNING' || change.kind === 'REST' : change.kind !== 'LEARNING', 'ITEM_CATEGORY_MISMATCH');
    requireThat(!old || old.businessDate === change.businessDate && old.kind === change.kind, 'IMMUTABLE_SLOT');
    const item: PlanItem = { ...change, id: old?.id ?? context.id('item:' + index),
      revisionId: context.id('item-revision:' + index), goalRevisionId: goal.revisionId };
    validateItem(item);
    items.set(item.id, old && canonical({ ...old, revisionId: '' }) === canonical({ ...item, revisionId: '' }) ? old : item);
  });
  validateDraftSlots([...items.values()]);
  const entity: WeekPlan = { ...revision(context, 'week', previous), id, goalId: goal.id, weekStart: input.weekStart,
    draft: [...items.values()], published: previous?.published ?? [], review: null, publications: previous?.publications ?? [] };
  if (previous && canonical(entity.draft) === canonical(previous.draft)) return previous;
  repository.save('week', entity);
  return entity;
}
