import { addDays, businessDate, compare, date, nonnegative, requireThat } from '@evoloop/kernel';
import type { Fact } from './model.ts';

export function validateFact(data: Fact['data'], day: string, now: string): string {
  date(day);
  requireThat(day <= businessDate(now) || data.kind === 'SLEEP' && data.endAt === null && day <= addDays(businessDate(data.beginAt), 1), 'FUTURE_FACT');
  if (data.kind === 'TRAINING' || data.kind === 'LEARNING') {
    if (data.durationMinutes !== null) nonnegative(data.durationMinutes);
    if (data.status === 'NOT_PERFORMED') {
      requireThat((data.durationMinutes === null || compare(data.durationMinutes, '0') === 0) && (data.kind === 'TRAINING' ? data.actions.length === 0 : data.fragments.length === 0 && !data.outcome.trim()), 'NOT_PERFORMED_HAS_ACTUAL');
    }
  }
  if (data.kind === 'TRAINING') {
    for (const action of data.actions) {
      requireThat(action.name.trim(), 'INVALID_ACTION');
      for (const set of action.sets) {
        nonnegative(set.quantity);
        if (set.loadKg !== null) nonnegative(set.loadKg);
      }
    }
  }
  if (data.kind === 'LEARNING') {
    requireThat(data.status === 'NOT_PERFORMED' || data.durationMinutes !== null || data.fragments.length || data.outcome.trim(), 'EMPTY_LEARNING_RECORD');
    data.fragments.forEach(fragment => nonnegative(fragment.quantity));
  }
  if (data.kind === 'SLEEP') {
    businessDate(data.beginAt);
    requireThat(data.beginAt <= now, 'FUTURE_FACT');
    if (data.endAt) {
      const wakeDate = businessDate(data.endAt);
      requireThat(data.endAt > data.beginAt && data.endAt <= now, 'INVALID_SLEEP_INTERVAL');
      requireThat(wakeDate === day, 'SLEEP_DATE_MISMATCH');
    } else {
      requireThat(date(data.provisionalWakeDate) >= businessDate(data.beginAt) && data.provisionalWakeDate === day, 'SLEEP_DATE_MISMATCH');
    }
  }
  return day;
}
