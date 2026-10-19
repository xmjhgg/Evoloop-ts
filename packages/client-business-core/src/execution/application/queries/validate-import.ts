import { requireThat } from '@evoloop/kernel';
import type { Transaction } from '../../../application/ports/public.ts';
import { weeks } from '../../../planning/public.ts';
import type { Fact, FoodDraft } from '../../domain/model.ts';
import { validateFact } from '../../domain/fact-policy.ts';
import { validateLines } from '../../domain/nutrition-policy.ts';

export function validateExecutionImport(tx: Transaction, now: string): void {
  const plans = weeks(tx), repository = tx.store('execution');
  for (const fact of repository.all<Fact>('fact')) {
    requireThat(fact.baselineDateMismatch === (fact.businessDate !== fact.originalDate), 'BASELINE_DATE_INVALID');
    validateFact(fact.data, fact.businessDate, now);
    if (fact.data.kind === 'MEAL') {
      validateLines(fact.data.lines, true);
      requireThat(repository.get<FoodDraft>('food-draft', fact.data.draftId), 'REFERENCE_MISSING');
    }
    for (const ref of fact.baselineRefs) {
      const week = plans.find(plan => plan.id === ref.weekId && plan.goalId === ref.goalId);
      requireThat(week?.publications.some(publication => publication.items.some(item => item.id === ref.item.id && item.revisionId === ref.item.revisionId)), 'REFERENCE_MISSING');
    }
  }
  for (const draft of repository.all<FoodDraft>('food-draft')) {
    validateLines(draft.lines, false);
    if (draft.factId) requireThat(repository.get<Fact>('fact', draft.factId), 'REFERENCE_MISSING');
  }
}
