import { canonical, requireThat, subtract } from '@evoloop/kernel';
import type { Transaction } from '../../../application/ports/public.ts';
import { dailyPlanBaselines } from '../../../planning/public.ts';
import { factsOn, intakeSummary } from './facts.ts';

export function nutritionProgress(tx: Transaction, day: string, selectedItemId: string | null = null) {
  const intake = intakeSummary(tx, day);
  const refs = dailyPlanBaselines(tx, day).filter(
    (ref) => ref.item.kind === 'NUTRITION_TOTAL' && ref.item.disposition === 'PLANNED',
  );
  requireThat(selectedItemId === null || refs.some((ref) => ref.item.id === selectedItemId), 'BASELINE_NOT_FOUND');
  const captured = new Set(
    factsOn(tx, day)
      .filter((fact) => fact.data.kind === 'MEAL' && !fact.baselineDateMismatch)
      .flatMap((fact) => fact.baselineRefs.map((ref) => ref.item.id)),
  );
  const selected =
    selectedItemId !== null
      ? refs.filter((ref) => ref.item.id === selectedItemId)
      : captured.size
        ? refs.filter((ref) => captured.has(ref.item.id))
        : refs;
  const distinct = new Set(selected.map((ref) => canonical(ref.item.prescription.nutrition)));
  const mismatch = factsOn(tx, day).some((fact) => fact.data.kind === 'MEAL' && fact.baselineDateMismatch);
  const status = mismatch
    ? 'UNAVAILABLE'
    : !selected.length
      ? 'NO_BASELINE'
      : distinct.size > 1
        ? 'BASELINE_SELECTION_REQUIRED'
        : 'ORIGINAL_BASELINE';
  const target = status === 'ORIGINAL_BASELINE' ? selected[0]!.item.prescription.nutrition : null;
  return {
    intake,
    status,
    baselineItemIds: selected.map((ref) => ref.item.id),
    basis: 'RECORDED_INTAKE_ONLY',
    differences: Object.fromEntries(
      (['energy', 'protein', 'carbohydrate', 'fat'] as const).map((key) => [
        key,
        target?.[key] !== undefined && target[key] !== null && intake[key].total !== null
          ? subtract(intake[key].total, target[key])
          : null,
      ]),
    ),
  };
}
