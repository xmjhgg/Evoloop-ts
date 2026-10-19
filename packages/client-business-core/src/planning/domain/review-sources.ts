import { addDays } from '@evoloop/kernel';
import type { Transaction } from '../../application/ports/public.ts';
import type { WeekPlan } from './model.ts';
import type { Goal } from './model.ts';
import { conditionSnapshot } from '../../profile/public.ts';

export function reviewSources(tx: Transaction, week: Pick<WeekPlan, 'goalId' | 'weekStart'>) {
  const keys = ['planning:GOAL_SET', 'planning:GOAL_STATE:' + week.goalId, 'planning:FITNESS_RULES',
    'profile:CONDITIONS:COMMON', 'profile:CONDITIONS:FITNESS', 'profile:CONDITIONS:LEARNING'];
  for (let offset = 0; offset < 7; offset++) {
    const day = addDays(week.weekStart, offset);
    keys.push('planning:PLAN_DAY:' + day, 'profile:BODY_DAY:' + day);
    for (const kind of ['TRAINING', 'LEARNING', 'SLEEP', 'MEAL']) keys.push('execution:FACT_DAY:' + day + ':' + kind);
  }
  const conditions = (['COMMON', 'FITNESS', 'LEARNING'] as const).flatMap(section => {
    const condition = conditionSnapshot(tx, section);
    return condition ? [{ collection: 'profile.condition', id: condition.id, revisionId: condition.revisionId }] : [];
  });
  const goal = tx.store('planning').get<Goal>('goal', week.goalId);
  return tx.capture(keys, [...conditions, ...goal ? [{ collection: 'planning.goal', id: goal.id, revisionId: goal.revisionId }] : []]);
}
