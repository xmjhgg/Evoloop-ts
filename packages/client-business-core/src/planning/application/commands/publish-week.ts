import { digest, requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { expected, required, revision } from '../../../application/ports/entity.ts';
import type { Goal, WeekPlan } from '../../domain/model.ts';
import type { PlanningCollaborators } from '../../ports/collaboration.ts';
import { fitnessRestrictions } from '../../domain/fitness-restrictions.ts';
import { validatePublishableRange } from '../../domain/range-policy.ts';
import { validateDraftSlots } from '../../domain/draft-slots.ts';

export function publishWeek(tx: Transaction, context: ExecutionContext, ports: PlanningCollaborators, input: {
  weekId: string; expectedVersion: string; explicitConfirm: boolean;
  selected: readonly { itemId: string; expectedPublishedRevision: string | null }[];
}): WeekPlan {
  requireThat(input.explicitConfirm && input.selected.length > 0, 'EXPLICIT_CONFIRMATION_REQUIRED');
  requireThat(new Set(input.selected.map(item => item.itemId)).size === input.selected.length, 'DUPLICATE_ITEM');
  const repository = tx.store('planning'), week = required<WeekPlan>(repository, 'week', input.weekId);
  expected(week, input.expectedVersion);
  const goal = required<Goal>(repository, 'goal', week.goalId);
  requireThat(goal.status === 'ACTIVE' || goal.status === 'PENDING_REPLAN', 'GOAL_NOT_ACTIVE');
  requireThat(goal.category !== 'FITNESS' || context.healthAllowed, 'PURPOSE_REQUIRED');
  requireThat(goal.category !== 'FITNESS' || fitnessRestrictions(tx, goal, context.rulesVersion, ports) === 'ALLOWED', 'INFORMATION_REQUIRED');
  const review = week.review;
  requireThat(review?.status === 'READY' && review.fingerprint === digest(week.draft), 'REVIEW_REQUIRED');
  requireThat(review.rulesVersion === context.rulesVersion && tx.fresh(review.sources), 'SOURCE_STALE');
  const published = new Map(week.published.map(item => [item.id, item])), affected: string[] = [];
  for (const selection of input.selected) {
    const item = week.draft.find(value => value.id === selection.itemId);
    requireThat(item, 'ITEM_NOT_FOUND');
    requireThat((published.get(item.id)?.revisionId ?? null) === selection.expectedPublishedRevision, 'VERSION_CONFLICT');
    validatePublishableRange(tx, context, ports, item, published.get(item.id));
    published.set(item.id, item);
    affected.push('planning:PLAN_DAY:' + item.businessDate, 'planning:PLAN_DAY:' + item.businessDate + ':' + item.kind);
    if (item.kind === 'REST') affected.push('planning:PLAN_DAY:' + item.businessDate + ':REST:' + goal.category);
  }
  validateDraftSlots([...published.values()]);
  const entity: WeekPlan = { ...week, ...revision(context, 'week', week), published: [...published.values()], review: null,
    publications: [...week.publications, { id: context.id('publication'), at: context.now, items: [...published.values()] }] };
  repository.save('week', entity);
  if (goal.status === 'PENDING_REPLAN') repository.save('goal', { ...goal, ...revision(context, 'goal', goal), status: 'ACTIVE' });
  const keys = [...new Set([...affected, 'planning:PLAN_GOAL_WEEK:' + goal.id + '|' + week.weekStart])];
  keys.forEach(key => tx.bump(key));
  tx.invalidate(keys);
  return entity;
}
