import { businessDate, requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { expected, required, revision } from '../../../application/ports/entity.ts';
import type { Goal, WeekPlan } from '../../domain/model.ts';
import type { PlanningCollaborators } from '../../ports/collaboration.ts';

export function changeGoalState(tx: Transaction, context: ExecutionContext, ports: PlanningCollaborators, input: {
  goalId: string; expectedVersion: string; action: 'PAUSE' | 'REQUEST_RESUME' | 'ARCHIVE';
}): Goal {
  const repository = tx.store('planning'), goal = required<Goal>(repository, 'goal', input.goalId);
  expected(goal, input.expectedVersion);
  requireThat(goal.status !== 'ARCHIVED', 'GOAL_ARCHIVED');
  requireThat(input.action !== 'REQUEST_RESUME' || goal.status === 'PAUSED', 'INVALID_GOAL_TRANSITION');
  requireThat(input.action !== 'PAUSE' || goal.status === 'ACTIVE', 'INVALID_GOAL_TRANSITION');
  const status = input.action === 'PAUSE' ? 'PAUSED' : input.action === 'ARCHIVE' ? 'ARCHIVED' : 'PENDING_REPLAN';
  const entity: Goal = { ...goal, ...revision(context, 'goal', goal), status };
  repository.save('goal', entity);
  const keys = ['planning:GOAL_SET', 'planning:GOAL_SET:' + goal.category, 'planning:GOAL_STATE:' + goal.id];
  if (input.action !== 'REQUEST_RESUME') {
    for (const week of repository.all<WeekPlan>('week').filter(item => item.goalId === goal.id)) {
      const published = week.published.map(item => {
        if (item.businessDate <= businessDate(context.now) || item.prescription.startAt && item.prescription.startAt <= context.now || ports.hasActual(tx, item.businessDate, item.kind === 'NUTRITION_TOTAL' ? 'MEAL' : item.kind)) return item;
        keys.push('planning:PLAN_DAY:' + item.businessDate, 'planning:PLAN_DAY:' + item.businessDate + ':' + item.kind, 'planning:PLAN_GOAL_WEEK:' + goal.id + '|' + week.weekStart);
        if (item.kind === 'REST') keys.push('planning:PLAN_DAY:' + item.businessDate + ':REST:' + goal.category);
        return { ...item, revisionId: context.id('suspend:' + item.id), disposition: 'SUSPENDED' as const };
      });
      repository.save('week', { ...week, ...revision(context, 'week:' + week.id, week), published, review: null });
    }
  }
  [...new Set(keys)].forEach(key => tx.bump(key));
  tx.invalidate(keys);
  return entity;
}
