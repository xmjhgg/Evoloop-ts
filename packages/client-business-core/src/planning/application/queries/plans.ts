import type { Transaction } from '../../../application/ports/public.ts';
import type { Goal, WeekPlan } from '../../domain/model.ts';

export function goals(tx: Transaction): readonly Goal[] { return tx.store('planning').all<Goal>('goal'); }
export function weeks(tx: Transaction): readonly WeekPlan[] { return tx.store('planning').all<WeekPlan>('week'); }
export function applicableItems(tx: Transaction, day: string) {
  return weeks(tx).flatMap(week => week.published.filter(item => item.businessDate === day && item.disposition === 'PLANNED').map(item => ({ weekId: week.id, goalId: week.goalId, item })));
}
