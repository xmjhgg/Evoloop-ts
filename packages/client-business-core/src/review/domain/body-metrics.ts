import { subtract } from '@evoloop/kernel';
import type { DaySnapshot } from './day-snapshot.ts';

/** Descriptive changes only: units and observation dates are retained, without a health judgment. */
export function bodyChanges(snapshots: readonly DaySnapshot[]) {
  const observations = [
    ...new Map(snapshots.flatMap((snapshot) => snapshot.body).map((value) => [value.id, value])).values(),
  ]
    .filter((value) => value.kind === 'MEASUREMENT')
    .sort((a, b) => (a.observedAt < b.observedAt ? -1 : a.observedAt > b.observedAt ? 1 : a.id < b.id ? -1 : 1));
  const groups = new Map<
    string,
    { field: string; unit: string; observations: { id: string; observedAt: string; value: string }[] }
  >();
  for (const observation of observations)
    for (const [field, value] of Object.entries(observation.values)) {
      if (value.value === null) continue;
      const key = field + '|' + value.unit,
        group = groups.get(key) ?? { field, unit: value.unit, observations: [] };
      group.observations.push({ id: observation.id, observedAt: observation.observedAt, value: value.value });
      groups.set(key, group);
    }
  return [...groups.values()].map((group) => ({
    ...group,
    change:
      group.observations.length < 2 ? null : subtract(group.observations.at(-1)!.value, group.observations[0]!.value),
    interpretation: 'DESCRIPTIVE_ONLY',
  }));
}
