import { requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { expected, required, revision } from '../../../application/ports/entity.ts';
import type { FoodDraft, Fact } from '../../domain/model.ts';
import { validateLines } from '../../domain/nutrition-policy.ts';
import { saveFact } from './save-fact.ts';

export function confirmIntake(tx: Transaction, context: ExecutionContext, input: {
  draftId: string; expectedVersion: string; expectedFactVersion: string;
  explicitConfirm: boolean; unknownAccepted: boolean; planItemIds: readonly string[]; baselineMode?: 'AUTO' | 'SELECTED' | 'UNPLANNED' | undefined;
}): Fact {
  requireThat(input.explicitConfirm, 'EXPLICIT_CONFIRMATION_REQUIRED');
  const repository = tx.store('execution'), draft = required<FoodDraft>(repository, 'food-draft', input.draftId);
  expected(draft, input.expectedVersion);
  requireThat(draft.lines.length > 0, 'EMPTY_INTAKE');
  validateLines(draft.lines, true);
  const hasUnknown = draft.lines.some(line => [line.energy, line.protein, line.carbohydrate, line.fat].some(value => value.state === 'UNKNOWN'));
  requireThat(!hasUnknown || input.unknownAccepted, 'UNKNOWN_ACKNOWLEDGEMENT_REQUIRED');
  const previous = draft.factId ? required<Fact>(repository, 'fact', draft.factId) : null;
  if (previous && draft.confirmedRevisionId === draft.revisionId) return previous;
  const fact = saveFact(tx, context, { id: previous?.id ?? null, expectedVersion: input.expectedFactVersion, businessDate: draft.businessDate,
    data: { kind: 'MEAL', mealCode: draft.mealCode, lines: draft.lines, draftId: draft.id, unknownAccepted: input.unknownAccepted }, planItemIds: input.planItemIds, baselineMode: input.baselineMode, remove: false });
  const entity: FoodDraft = { ...draft, ...revision(context, 'food-draft', draft), factId: fact.id, confirmedRevisionId: context.id('food-draft:revision') };
  repository.save('food-draft', entity);
  tx.bump('execution:FOOD_DRAFT:' + entity.id);
  return fact;
}
