import test from 'node:test';
import assert from 'node:assert/strict';
import { digest, divide } from '@evoloop/kernel';
import { foodLineFromLabel, intakeSummary, nutritionProgress } from '@evoloop/client-business-core/execution';
import type { FoodDraft, LabelLine } from '@evoloop/client-business-core/execution';
import { mealAllocation } from '@evoloop/client-business-core/planning';
import { progressRuntime } from '../fixtures/core-progress.ts';

const label: LabelLine = {
  id: 'label',
  name: '营养标签',
  referenceAmount: '100',
  consumedAmount: '50',
  quantityUnit: 'g',
  energy: { state: 'ESTIMATED', value: '418.4', lower: '376.56', upper: '460.24', unit: 'kJ', source: 'label' },
  protein: { state: 'KNOWN', value: '20', lower: null, upper: null, unit: 'g', source: 'label' },
  carbohydrate: { state: 'UNKNOWN', value: null, lower: null, upper: null, unit: 'g', source: 'unavailable' },
  fat: { state: 'KNOWN', value: '10', lower: null, upper: null, unit: 'g', source: 'label' },
};
const draftInput = {
  id: null,
  expectedVersion: '0',
  businessDate: '2026-10-17',
  mealCode: 'LUNCH',
  evidence: [],
  description: '标签输入',
};

test('label kJ and per-100g quantities retain provenance, estimated bounds and independent confirmation', async () => {
  const runtime = await progressRuntime();
  const draft = await runtime.execute<FoodDraft>('execution.food-draft.save-label', { ...draftInput, lines: [label] });
  assert.equal(draft.lines[0]?.energy.value, '100');
  assert.equal(draft.lines[0]?.energy.original?.value, '418.4');
  assert.equal(draft.lines[0]?.personalFactor, '0.5');
  assert.equal(intakeSummary(runtime.bus.transaction(), draft.businessDate).energy.total, null);
  await runtime.execute('execution.intake.confirm', {
    draftId: draft.id,
    expectedVersion: draft.version,
    expectedFactVersion: '0',
    explicitConfirm: true,
    unknownAccepted: true,
    planItemIds: [],
  });
  const summary = intakeSummary(runtime.bus.transaction(), draft.businessDate);
  assert.equal(summary.energy.total, '50');
  assert.equal(summary.energy.lower, '45');
  assert.equal(summary.energy.upper, '55');
  assert.equal(summary.energy.estimated, true);
  assert.equal(summary.carbohydrate.total, null);
  assert.equal(summary.carbohydrate.knownSubtotal, null);
  assert.equal(summary.protein.total, '10');
  assert.equal(nutritionProgress(runtime.bus.transaction(), draft.businessDate).status, 'NO_BASELINE');
});

test('unknown and absent meals are not zero; additional meals and corrected portions accumulate once', async () => {
  const runtime = await progressRuntime();
  const empty = intakeSummary(runtime.bus.transaction(), '2026-10-17');
  assert.equal(empty.energy.unknown, true);
  assert.equal(empty.energy.knownSubtotal, null);
  const first = await runtime.execute<FoodDraft>('execution.food-draft.save-label', { ...draftInput, lines: [label] });
  await runtime.execute('execution.intake.confirm', {
    draftId: first.id,
    expectedVersion: first.version,
    expectedFactVersion: '0',
    explicitConfirm: true,
    unknownAccepted: true,
    planItemIds: [],
  });
  const second = await runtime.execute<FoodDraft>('execution.food-draft.save-label', {
    ...draftInput,
    mealCode: 'DINNER',
    lines: [{ ...label, consumedAmount: '25' }],
  });
  await runtime.execute('execution.intake.confirm', {
    draftId: second.id,
    expectedVersion: second.version,
    expectedFactVersion: '0',
    explicitConfirm: true,
    unknownAccepted: true,
    planItemIds: [],
  });
  const summary = intakeSummary(runtime.bus.transaction(), '2026-10-17');
  assert.equal(summary.factIds.length, 2);
  assert.equal(summary.energy.total, '75');
  assert.deepEqual(summary.missingMeals, ['BREAKFAST']);
  assert.equal(summary.carbohydrate.total, null);
});

test('label provenance and reference quantities cannot silently diverge from normalized values', async () => {
  const runtime = await progressRuntime(),
    line = foodLineFromLabel(label),
    before = digest(runtime.bus.snapshot());
  await assert.rejects(
    runtime.execute('execution.food-draft.save', { ...draftInput, lines: [{ ...line, personalFactor: '1' }] }),
    /PORTION_PROVENANCE_MISMATCH/,
  );
  await assert.rejects(
    runtime.execute('execution.food-draft.save', {
      ...draftInput,
      lines: [{ ...line, energy: { ...line.energy, value: '200' } }],
    }),
    /NUTRITION_PROVENANCE_MISMATCH/,
  );
  assert.equal(digest(runtime.bus.snapshot()), before);
  assert.throws(() => foodLineFromLabel({ ...label, referenceAmount: '0' }), /REFERENCE_AMOUNT_REQUIRED/);
  assert.equal(divide('1', '3'), '0.333333');
  assert.equal(divide('-1', '8', 2), '-0.13');
});

test('meal allocation distinguishes incomplete/unknown allocation and rejects inconsistent totals', () => {
  const total = { energy: '100', protein: null, carbohydrate: null, fat: null, unit: 'kcal/g' as const };
  assert.equal(mealAllocation(total).status, 'UNALLOCATED');
  const meal = {
    mealCode: 'LUNCH' as const,
    startAt: null,
    description: '',
    energy: '40',
    protein: null,
    carbohydrate: null,
    fat: null,
  };
  assert.throws(() => mealAllocation({ ...total, meals: [meal] }), /TOTAL_MISMATCH/);
  const partial = mealAllocation({ ...total, meals: [meal, { ...meal, mealCode: 'DINNER', energy: null }] });
  assert.equal(partial.status, 'PARTIAL');
  assert.equal(partial.dimensions[0]?.unallocated, '60');
  assert.throws(() => mealAllocation({ ...total, meals: [{ ...meal, energy: '101' }] }), /EXCEEDS_TOTAL/);
  assert.throws(() => mealAllocation({ ...total, meals: [meal, meal] }), /DUPLICATE_MEAL/);
});

test('an estimated point without supplied bounds does not acquire an invented confidence range', async () => {
  const runtime = await progressRuntime();
  const draft = await runtime.execute<FoodDraft>('execution.food-draft.save-label', {
    ...draftInput,
    lines: [{ ...label, energy: { ...label.energy, lower: null, upper: null } }],
  });
  await runtime.execute('execution.intake.confirm', {
    draftId: draft.id,
    expectedVersion: draft.version,
    expectedFactVersion: '0',
    explicitConfirm: true,
    unknownAccepted: true,
    planItemIds: [],
  });
  const value = intakeSummary(runtime.bus.transaction(), draft.businessDate).energy;
  assert.equal(value.total, '50');
  assert.equal(value.estimated, true);
  assert.equal(value.lower, null);
  assert.equal(value.upper, null);
});
