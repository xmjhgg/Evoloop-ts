import { date, digest, requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { expected, revision } from '../../../application/ports/entity.ts';
import type { FoodDraft } from '../../domain/model.ts';
import { validateLines } from '../../domain/nutrition-policy.ts';

export function foodInputDigest(draft: FoodDraft): string {
  return digest({ businessDate: draft.businessDate, mealCode: draft.mealCode, evidence: draft.evidence, description: draft.description, lines: draft.lines });
}
export function saveFoodDraft(tx: Transaction, context: ExecutionContext, input: {
  id: string | null; expectedVersion: string; businessDate: string; mealCode: FoodDraft['mealCode'];
  evidence: readonly string[]; description: string; lines: FoodDraft['lines'];
}): FoodDraft {
  requireThat(context.healthAllowed, 'PURPOSE_REQUIRED');
  date(input.businessDate);
  const repository = tx.store('execution'), previous = input.id ? repository.get<FoodDraft>('food-draft', input.id) : null;
  requireThat(!input.id || previous, 'NOT_FOUND');
  expected(previous, input.expectedVersion);
  validateLines(input.lines, false);
  const { id: _id, expectedVersion: _version, ...content } = input;
  const entity: FoodDraft = { ...content, ...revision(context, 'food-draft', previous), factId: previous?.factId ?? null,
    candidateDigest: null, confirmedRevisionId: previous?.confirmedRevisionId ?? null };
  repository.save('food-draft', entity);
  tx.bump('execution:FOOD_DRAFT:' + entity.id);
  return entity;
}
export function acceptFoodCandidate(tx: Transaction, context: ExecutionContext, input: {
  draftId: string; expectedVersion: string; inputDigest: string; lines: FoodDraft['lines'];
}): FoodDraft {
  requireThat(context.healthAllowed && context.aiAllowed, 'PURPOSE_REQUIRED');
  const repository = tx.store('execution'), draft = repository.get<FoodDraft>('food-draft', input.draftId);
  requireThat(draft, 'NOT_FOUND');
  expected(draft, input.expectedVersion);
  requireThat(foodInputDigest(draft) === input.inputDigest, 'SOURCE_STALE');
  validateLines(input.lines, false);
  const entity: FoodDraft = { ...draft, ...revision(context, 'food-draft', draft), lines: input.lines, candidateDigest: input.inputDigest };
  repository.save('food-draft', entity);
  tx.bump('execution:FOOD_DRAFT:' + entity.id);
  return entity;
}
