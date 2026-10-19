import { date, requireThat, weekStart } from '@evoloop/kernel';
import type { Transaction } from '../../../application/ports/public.ts';
import { goals, weeks } from './plans.ts';
import { validateItem } from '../../domain/prescription-policy.ts';

export function validatePlanningImport(tx: Transaction): void {
  const available = goals(tx), seen = new Set<string>();
  for (const goal of available) requireThat(date(goal.startDate) <= date(goal.endDate), 'INVALID_GOAL');
  for (const week of weeks(tx)) {
    requireThat(available.some(goal => goal.id === week.goalId), 'REFERENCE_MISSING');
    requireThat(weekStart(week.weekStart) === week.weekStart && !seen.has(week.goalId + '|' + week.weekStart), 'WEEK_KEY_INVALID');
    seen.add(week.goalId + '|' + week.weekStart);
    for (const items of [week.draft, week.published, ...week.publications.map(publication => publication.items)]) {
      requireThat(new Set(items.map(item => item.id)).size === items.length, 'DUPLICATE_ITEM');
      for (const item of items) {
        validateItem(item);
        requireThat(weekStart(item.businessDate) === week.weekStart, 'ITEM_OUTSIDE_WEEK');
        requireThat(tx.hasRevision('planning.goal', week.goalId, item.goalRevisionId), 'REFERENCE_MISSING');
      }
    }
  }
}
