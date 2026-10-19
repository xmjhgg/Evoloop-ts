import type { Transaction } from '../../../application/ports/public.ts';
import type { Fact, FoodLine } from '../../domain/model.ts';
import { nutrientTotal } from '../../domain/nutrition-policy.ts';
import { add } from '@evoloop/kernel';

export function factsOn(tx: Transaction, day: string): readonly Fact[] {
  return tx.store('execution').all<Fact>('fact').filter(fact => fact.businessDate === day && fact.status === 'ACTIVE');
}
export function hasActual(tx: Transaction, day: string, kind: string): boolean {
  // Ordinary removal preserves historical protection and must not unlock the range.
  return tx.store('execution').all<Fact>('fact').some(fact => (fact.businessDate === day || fact.originalDate === day) && fact.data.kind === kind);
}
export function intakeSummary(tx: Transaction, day: string) {
  const facts = factsOn(tx, day).filter(fact => fact.data.kind === 'MEAL');
  const lines: FoodLine[] = [], recordedMeals = new Set<string>();
  for (const fact of facts) if (fact.data.kind === 'MEAL') {
    lines.push(...fact.data.lines);
    recordedMeals.add(fact.data.mealCode);
  }
  return { factIds: facts.map(fact => fact.id), recordedMeals: [...recordedMeals],
    missingMeals: ['BREAKFAST', 'LUNCH', 'DINNER'].filter(meal => !recordedMeals.has(meal)),
    energy: nutrientTotal(lines, 'energy'), protein: nutrientTotal(lines, 'protein'),
    carbohydrate: nutrientTotal(lines, 'carbohydrate'), fat: nutrientTotal(lines, 'fat') };
}
export function learningQuantities(fact: Fact): Readonly<Record<string, string>> {
  if (fact.data.kind !== 'LEARNING') return {};
  const totals: Record<string, string> = {};
  for (const fragment of fact.data.fragments) totals[fragment.unit] = add(totals[fragment.unit] ?? '0', fragment.quantity);
  if (fact.data.durationMinutes !== null) totals['MINUTE'] = fact.data.durationMinutes;
  return totals;
}
