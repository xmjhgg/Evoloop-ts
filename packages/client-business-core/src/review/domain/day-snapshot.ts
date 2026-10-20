import type { Transaction } from '../../application/ports/public.ts';
import { dailyPlanBaselines, goals } from '../../planning/public.ts';
import { factsOn, summarizeIntake } from '../../execution/public.ts';
import { observations } from '../../profile/public.ts';
import type { ReviewScope } from './model.ts';

export function daySnapshot(tx: Transaction, scope: ReviewScope, day: string) {
  const available = goals(tx),
    goal = available.find((item) => item.id === scope.goalId);
  const health = scope.slot === 'HEALTH' || goal?.category === 'FITNESS',
    category = health ? 'FITNESS' : 'LEARNING';
  const kinds = health ? ['TRAINING', 'SLEEP', 'MEAL'] : ['LEARNING'];
  const facts = factsOn(tx, day).filter(
    (fact) =>
      kinds.includes(fact.data.kind) && (!scope.goalId || fact.baselineRefs.some((ref) => ref.goalId === scope.goalId)),
  );
  const plans = dailyPlanBaselines(tx, day).filter(
    (ref) =>
      (!scope.goalId || ref.goalId === scope.goalId) &&
      available.some((value) => value.id === ref.goalId && value.category === category),
  );
  return {
    day,
    health,
    facts,
    plans,
    body: health ? observations(tx, day) : [],
    nutrition: health ? summarizeIntake(facts) : null,
    comparability: facts.some((fact) => fact.baselineDateMismatch)
      ? 'UNAVAILABLE'
      : plans.some((ref) => ref.item.disposition === 'PLANNED' && ref.item.kind !== 'REST')
        ? 'ORIGINAL_BASELINE'
        : 'NO_BASELINE',
  };
}
export type DaySnapshot = ReturnType<typeof daySnapshot>;
