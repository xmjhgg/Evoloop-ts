import { add } from '@evoloop/kernel';
import type { Transaction } from '../../application/ports/public.ts';
import { learningQuantities, summarizeIntake } from '../../execution/public.ts';
import type { DaySnapshot } from './day-snapshot.ts';
import { planMetrics } from './plan-metrics.ts';
import { dailyStatus } from './daily-status.ts';
import { bodyChanges } from './body-metrics.ts';

export function dayMetrics(tx: Transaction, snapshot: DaySnapshot, cutoff: string, slot: string, weekly: boolean) {
  return {
    day: snapshot.day,
    factCount: String(snapshot.facts.length),
    comparability: snapshot.comparability,
    plans: planMetrics(tx, snapshot, cutoff),
    nutrition: snapshot.nutrition,
    trainingStates: snapshot.facts.flatMap((fact) => (fact.data.kind === 'TRAINING' ? [fact.data.status] : [])),
    unplannedFactIds: snapshot.facts.filter((fact) => !fact.baselineRefs.length).map((fact) => fact.id),
    movedFactIds: snapshot.facts.filter((fact) => fact.baselineDateMismatch).map((fact) => fact.id),
    training: snapshot.facts.flatMap((fact) =>
      fact.data.kind === 'TRAINING'
        ? [
            {
              factId: fact.id,
              state: fact.data.status,
              durationMinutes: fact.data.durationMinutes,
              actions: fact.data.actions.map((action) => ({
                name: action.name,
                sets: action.sets.map((set) => ({ ...set })),
              })),
            },
          ]
        : [],
    ),
    sleep: snapshot.facts.flatMap((fact) =>
      fact.data.kind === 'SLEEP'
        ? [
            {
              factId: fact.id,
              state: fact.data.endAt ? 'COMPLETED' : 'IN_PROGRESS',
              durationMilliseconds: fact.data.endAt
                ? String(Date.parse(fact.data.endAt) - Date.parse(fact.data.beginAt))
                : null,
            },
          ]
        : [],
    ),
    learning: snapshot.facts
      .filter((fact) => fact.data.kind === 'LEARNING')
      .map((fact) => ({
        factId: fact.id,
        quantities: learningQuantities(fact),
        outcome: fact.data.kind === 'LEARNING' ? fact.data.outcome : '',
      })),
    body: snapshot.body.map((observation) => ({
      factId: observation.id,
      observedAt: observation.observedAt,
      kind: observation.kind,
      values: Object.fromEntries(Object.entries(observation.values).map(([key, value]) => [key, { ...value }])),
    })),
    dailyConclusion: weekly ? dailyStatus(tx, snapshot.day, slot) : null,
  };
}
export function periodSummary(snapshots: readonly DaySnapshot[]) {
  const facts = [...new Map(snapshots.flatMap((snapshot) => snapshot.facts).map((fact) => [fact.id, fact])).values()],
    learning: Record<string, string> = {};
  for (const fact of facts)
    for (const [unit, value] of Object.entries(learningQuantities(fact)))
      learning[unit] = add(learning[unit] ?? '0', value);
  const training = facts.filter((fact) => fact.data.kind === 'TRAINING'),
    completedSleep = facts.filter((fact) => fact.data.kind === 'SLEEP' && fact.data.endAt !== null);
  const { recordedMeals: _recordedMeals, missingMeals: _missingMeals, ...nutrition } = summarizeIntake(facts);
  return {
    factIds: facts.map((fact) => fact.id),
    training: {
      completed: String(
        training.filter((fact) => fact.data.kind === 'TRAINING' && fact.data.status === 'COMPLETED').length,
      ),
      partial: String(
        training.filter((fact) => fact.data.kind === 'TRAINING' && fact.data.status === 'PARTIAL').length,
      ),
      notPerformed: String(
        training.filter((fact) => fact.data.kind === 'TRAINING' && fact.data.status === 'NOT_PERFORMED').length,
      ),
    },
    learning,
    nutrition: {
      ...nutrition,
      basis: 'RECORDED_FACTS_ONLY',
      recordedMealsByDay: snapshots.map((snapshot) => ({
        day: snapshot.day,
        mealCodes: snapshot.nutrition?.recordedMeals ?? [],
      })),
    },
    bodyChanges: bodyChanges(snapshots),
    completedSleepCount: String(completedSleep.length),
    sleepMilliseconds: completedSleep.length
      ? completedSleep.reduce(
          (sum, fact) =>
            fact.data.kind === 'SLEEP' && fact.data.endAt
              ? add(sum, String(Date.parse(fact.data.endAt) - Date.parse(fact.data.beginAt)))
              : sum,
          '0',
        )
      : null,
  };
}
