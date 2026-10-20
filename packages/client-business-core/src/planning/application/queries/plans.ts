import type { Transaction } from '../../../application/ports/public.ts';
import type { BaselineRef, Goal, Protection, WeekPlan } from '../../domain/model.ts';

export function goals(tx: Transaction): readonly Goal[] { return tx.store('planning').all<Goal>('goal'); }
export function weeks(tx: Transaction): readonly WeekPlan[] { return tx.store('planning').all<WeekPlan>('week'); }
export function applicableItems(tx: Transaction, day: string) {
  return weeks(tx).flatMap(week => week.published.filter(item => item.businessDate === day && item.disposition === 'PLANNED').map(item => ({ weekId: week.id, goalId: week.goalId, item })));
}
/** Frozen ranges take precedence, including a deliberately frozen absence of a target. */
export function dailyPlanBaselines(tx: Transaction, day: string): readonly BaselineRef[] {
  const guards = tx.store('planning').all<Protection>('guard').filter(guard => guard.businessDate === day);
  const guarded = new Set(guards.map(guard => guard.kind === 'MEAL' ? 'NUTRITION_TOTAL' : guard.kind));
  const current = weeks(tx).flatMap(week => week.published.filter(item => item.businessDate === day && !guarded.has(item.kind))
    .map(item => ({ weekId: week.id, goalId: week.goalId, item })));
  return [...new Map([...current, ...guards.flatMap(guard => guard.refs)].map(ref => [ref.item.id, ref])).values()];
}
export function goalRevision(tx: Transaction, goalId: string, revisionId: string): Goal | null {
  return tx.store('planning').history<Goal>('goal', goalId).find(goal => goal.revisionId === revisionId) ?? null;
}
