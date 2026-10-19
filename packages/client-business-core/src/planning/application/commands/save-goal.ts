import { date, requireThat } from '@evoloop/kernel';
import type { Transaction, ExecutionContext } from '../../../application/ports/public.ts';
import { expected, revision } from '../../../application/ports/entity.ts';
import type { Goal, WeekPlan } from '../../domain/model.ts';

export function saveGoal(tx: Transaction, context: ExecutionContext, input: {
  id: string | null; expectedVersion: string; category: Goal['category']; name: string; description: string;
  measure: string; startDate: string; endDate: string;
}): Goal {
  requireThat(input.category !== 'FITNESS' || context.healthAllowed, 'PURPOSE_REQUIRED');
  requireThat(input.name.trim().length > 0 && date(input.startDate) <= date(input.endDate), 'INVALID_GOAL');
  const repository = tx.store('planning'), previous = input.id ? repository.get<Goal>('goal', input.id) : null;
  requireThat(!input.id || previous, 'NOT_FOUND');
  expected(previous, input.expectedVersion);
  requireThat(previous?.status !== 'ARCHIVED', 'GOAL_ARCHIVED');
  if (previous?.category !== input.category && previous) {
    requireThat(!repository.all<WeekPlan>('week').some(week => week.goalId === previous.id), 'GOAL_CATEGORY_LOCKED');
  }
  const { id: _id, expectedVersion: _expected, ...content } = input;
  const entity: Goal = { ...content, ...revision(context, 'goal', previous), status: previous?.status ?? 'ACTIVE' };
  repository.save('goal', entity);
  const keys = [...new Set(['planning:GOAL_SET', 'planning:GOAL_SET:' + entity.category, 'planning:GOAL_SET:' + (previous?.category ?? entity.category), 'planning:GOAL_STATE:' + entity.id])];
  keys.forEach(key => tx.bump(key));
  tx.invalidate(keys);
  return entity;
}
