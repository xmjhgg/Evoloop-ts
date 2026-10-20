import { businessDate } from '@evoloop/kernel';
import type { DaySnapshot } from './day-snapshot.ts';
import { dueAtCutoff } from './plan-metrics.ts';

type PlanMetric = ReturnType<typeof import('./plan-metrics.ts').planMetrics>[number];
export function dimensionCoverage(plans: readonly PlanMetric[], kind: string) {
  const selected = plans.filter((item) => item.kind === kind),
    due = selected.filter((item) => item.due),
    missing = due.filter((item) => !item.factIds.length);
  return {
    expected: String(due.length),
    recorded: String(due.length - missing.length),
    missing: String(missing.length),
    pending: String(selected.filter((item) => item.state === 'PENDING').length),
    paused: String(selected.filter((item) => item.state === 'PAUSED').length),
    missingItemIds: missing.map((item) => item.itemId),
    hasBaseline: selected.some((item) => item.state !== 'REMOVED'),
    completion: due.length
      ? {
          completed: String(
            due.filter(
              (item) =>
                item.completionStates.length > 0 && item.completionStates.every((state) => state === 'COMPLETED'),
            ).length,
          ),
          expected: String(due.length),
        }
      : null,
  };
}
export function mealCoverage(snapshot: DaySnapshot, cutoff: string) {
  const totals = snapshot.plans.filter(
    (ref) => ref.item.kind === 'NUTRITION_TOTAL' && ref.item.disposition === 'PLANNED',
  );
  const meals = totals.flatMap((ref) => ref.item.prescription.nutrition?.meals ?? []);
  const expected = [
    ...new Set(
      meals.filter((meal) => dueAtCutoff(snapshot.day, meal.startAt, null, cutoff)).map((meal) => meal.mealCode),
    ),
  ];
  const recorded = snapshot.nutrition?.recordedMeals ?? [],
    missing = expected.filter((code) => !recorded.includes(code));
  return {
    expected: meals.length ? String(expected.length) : null,
    recorded: String(recorded.length),
    missing: meals.length ? String(missing.length) : null,
    missingMealCodes: missing,
    recordedMealCodes: recorded,
    denominatorKnown: meals.length > 0,
    future: snapshot.day > businessDate(cutoff),
  };
}
export function reviewCoverage(
  snapshots: readonly DaySnapshot[],
  plans: readonly PlanMetric[][],
  cutoff: string,
  slot: string,
) {
  const days = snapshots.map((snapshot, index) => {
    const metrics = plans[index] ?? [];
    return {
      day: snapshot.day,
      state:
        snapshot.day > businessDate(cutoff)
          ? 'FUTURE'
          : snapshot.facts.length || snapshot.body.length
            ? 'RECORDED'
            : 'NO_RECORDS',
      training: dimensionCoverage(metrics, 'TRAINING'),
      learning: dimensionCoverage(metrics, 'LEARNING'),
      sleep: dimensionCoverage(metrics, 'SLEEP'),
      meals: mealCoverage(snapshot, cutoff),
      rest: String(metrics.filter((item) => item.state === 'REST').length),
    };
  });
  const due = plans.flat().filter((item) => item.due),
    missing = due.filter((item) => !item.factIds.length);
  return {
    days: snapshots.map((snapshot) => snapshot.day),
    cutoff,
    scope: slot,
    dimensions: days,
    recordedFactIds: [...new Set(snapshots.flatMap((snapshot) => snapshot.facts.map((fact) => fact.id)))],
    missingScopeCount: String(missing.length),
    expectedScopeCount: String(due.length),
    complete:
      due.length > 0 &&
      missing.length === 0 &&
      !plans.flat().some((item) => item.state === 'PENDING') &&
      days.every((day, index) => (day.meals.expected === null ? !snapshots[index]?.health : day.meals.missing === '0')),
  };
}
