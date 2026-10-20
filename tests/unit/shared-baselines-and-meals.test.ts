import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { ExecutionContext } from '@evoloop/client-business-core/ports';
import type { Goal, PlanItem, NutritionTarget, PlanningCollaborators } from '@evoloop/client-business-core/planning';
import { validateNutritionReallocation, validatePublishableRange } from '@evoloop/client-business-core/planning';
import type { Fact, FoodDraft, FoodLine } from '@evoloop/client-business-core/execution';
import { hasActual, hasMealActual, intakeSummary, nutritionProgress } from '@evoloop/client-business-core/execution';
import { verifyAdjustmentBasis } from '@evoloop/client-business-core/review';
import { goalInput } from '../fixtures/local.ts';
import { progressRuntime, seedHistoricalWeek } from '../fixtures/core-progress.ts';

const known = {
  state: 'KNOWN' as const,
  value: '50',
  lower: null,
  upper: null,
  unit: 'kcal' as const,
  source: 'manual',
};
const zero = { ...known, value: '0', unit: 'g' as const };
const food: FoodLine = {
  id: 'food',
  name: 'Meal',
  personalFactor: '1',
  portionUnit: 'plate',
  energy: known,
  protein: zero,
  carbohydrate: zero,
  fat: zero,
};
const target: NutritionTarget = {
  energy: '150',
  protein: '0',
  carbohydrate: '0',
  fat: '0',
  unit: 'kcal/g',
  meals: [
    {
      mealCode: 'LUNCH',
      startAt: '2026-10-19T04:00:00.000Z',
      description: '',
      energy: '50',
      protein: '0',
      carbohydrate: '0',
      fat: '0',
    },
    {
      mealCode: 'DINNER',
      startAt: '2026-10-19T12:00:00.000Z',
      description: '',
      energy: '50',
      protein: '0',
      carbohydrate: '0',
      fat: '0',
    },
    {
      mealCode: 'SNACK',
      startAt: '2026-10-19T13:00:00.000Z',
      description: '',
      energy: '50',
      protein: '0',
      carbohydrate: '0',
      fat: '0',
    },
  ],
};
const ports: PlanningCollaborators = {
  hasActual,
  hasMealActual,
  verifyAdjustmentBasis,
  fitnessPolicy: () => 'INFORMATION_REQUIRED',
};
function context(runtime: Awaited<ReturnType<typeof progressRuntime>>): ExecutionContext {
  return {
    ...runtime.settings.access(),
    accountId: runtime.settings.accountId,
    commandId: randomUUID(),
    now: runtime.settings.now(),
    id: () => randomUUID(),
  };
}
function item(goal: Goal, nutrition: NutritionTarget, id = randomUUID()): PlanItem {
  return {
    id,
    revisionId: randomUUID(),
    goalRevisionId: goal.revisionId,
    businessDate: '2026-10-19',
    kind: 'NUTRITION_TOTAL',
    disposition: 'PLANNED',
    prescription: { title: 'Daily intake', startAt: null, minutes: null, actions: [], learning: null, nutrition },
  };
}
async function draft(runtime: Awaited<ReturnType<typeof progressRuntime>>) {
  return runtime.execute<FoodDraft>('execution.food-draft.save', {
    id: null,
    expectedVersion: '0',
    businessDate: '2026-10-19',
    mealCode: 'LUNCH',
    evidence: [],
    description: '',
    lines: [food],
  });
}

test('shared facts require an explicit choice for conflicting targets and remain one fact in the overview', async () => {
  const runtime = await progressRuntime();
  const firstGoal = await runtime.execute<Goal>('planning.goal.save', { ...goalInput, category: 'FITNESS' });
  const secondGoal = await runtime.execute<Goal>('planning.goal.save', {
    ...goalInput,
    category: 'FITNESS',
    name: 'Other',
  });
  const first = item(firstGoal, target),
    second = item(secondGoal, { ...target, energy: '200', meals: undefined });
  // Omitted optional fields, rather than undefined, are what persisted JSON permits.
  const { meals: _meals, ...otherTarget } = second.prescription.nutrition!;
  const other = { ...second, prescription: { ...second.prescription, nutrition: otherTarget } };
  await seedHistoricalWeek(runtime, firstGoal, [first], '2026-10-19');
  await seedHistoricalWeek(runtime, secondGoal, [other], '2026-10-19');
  runtime.at('2026-10-19T09:00:00.000Z');
  const input = await draft(runtime),
    confirm = {
      draftId: input.id,
      expectedVersion: input.version,
      expectedFactVersion: '0',
      explicitConfirm: true,
      unknownAccepted: false,
      planItemIds: [],
    };
  await assert.rejects(runtime.execute('execution.intake.confirm', confirm), /BASELINE_SELECTION_REQUIRED/);
  const saved = await runtime.execute<Fact>('execution.intake.confirm', {
    ...confirm,
    baselineMode: 'SELECTED',
    planItemIds: [first.id],
  });
  assert.deepEqual(
    saved.baselineRefs.map((ref) => ref.item.id),
    [first.id],
  );
  assert.equal(intakeSummary(runtime.bus.transaction(), '2026-10-19').energy.total, '50');
  const progress = nutritionProgress(runtime.bus.transaction(), '2026-10-19');
  assert.equal(progress.status, 'ORIGINAL_BASELINE');
  assert.equal(progress.differences['energy'], '-100');
  assert.equal(progress.basis, 'RECORDED_INTAKE_ONLY');
  const corrected = await runtime.execute<FoodDraft>('execution.food-draft.save', {
    id: input.id,
    expectedVersion: '2',
    businessDate: '2026-10-19',
    mealCode: 'LUNCH',
    evidence: [],
    description: 'corrected',
    lines: [{ ...food, personalFactor: '2' }],
  });
  const replacement = await runtime.execute<Fact>('execution.intake.confirm', {
    ...confirm,
    expectedVersion: corrected.version,
    expectedFactVersion: saved.version,
  });
  assert.equal(replacement.id, saved.id);
  assert.deepEqual(replacement.baselineRefs, saved.baselineRefs);
  assert.equal(intakeSummary(runtime.bus.transaction(), '2026-10-19').factIds.length, 1);
});

test('an explicit unplanned intake can be saved without resolving target conflicts, while totals stay frozen', async () => {
  const runtime = await progressRuntime(),
    goal = await runtime.execute<Goal>('planning.goal.save', { ...goalInput, category: 'FITNESS' });
  await seedHistoricalWeek(runtime, goal, [item(goal, target)], '2026-10-19');
  runtime.at('2026-10-19T09:00:00.000Z');
  const input = await draft(runtime);
  const saved = await runtime.execute<Fact>('execution.intake.confirm', {
    draftId: input.id,
    expectedVersion: input.version,
    expectedFactVersion: '0',
    explicitConfirm: true,
    unknownAccepted: false,
    planItemIds: [],
    baselineMode: 'UNPLANNED',
  });
  assert.deepEqual(saved.baselineRefs, []);
  assert.equal(runtime.bus.snapshot().rows['planning.guard']?.length, 1);
});

test('same-day reallocation preserves the frozen daily total and consumed/started meal shares', async () => {
  const runtime = await progressRuntime(),
    goal = await runtime.execute<Goal>('planning.goal.save', { ...goalInput, category: 'FITNESS' });
  const original = item(goal, target);
  await seedHistoricalWeek(runtime, goal, [original], '2026-10-19');
  runtime.at('2026-10-19T09:00:00.000Z');
  const input = await draft(runtime);
  await runtime.execute('execution.intake.confirm', {
    draftId: input.id,
    expectedVersion: input.version,
    expectedFactVersion: '0',
    explicitConfirm: true,
    unknownAccepted: false,
    planItemIds: [original.id],
  });
  const changed = {
    ...original,
    prescription: {
      ...original.prescription,
      nutrition: {
        ...target,
        meals: target.meals!.map((meal) => ({
          ...meal,
          energy: meal.mealCode === 'DINNER' ? '70' : meal.mealCode === 'SNACK' ? '30' : meal.energy,
        })),
      },
    },
  };
  assert.doesNotThrow(() =>
    validateNutritionReallocation(runtime.bus.transaction(), context(runtime), ports, changed, original),
  );
  assert.throws(
    () =>
      validateNutritionReallocation(
        runtime.bus.transaction(),
        context(runtime),
        ports,
        {
          ...changed,
          prescription: { ...changed.prescription, nutrition: { ...changed.prescription.nutrition, energy: '160' } },
        },
        original,
      ),
    /PROTECTED_NUTRITION_TOTAL/,
  );
  const alteredMeal = {
    ...original,
    prescription: {
      ...original.prescription,
      nutrition: {
        ...target,
        meals: target.meals!.map((meal) => ({
          ...meal,
          energy: meal.mealCode === 'LUNCH' ? '40' : meal.mealCode === 'DINNER' ? '60' : meal.energy,
        })),
      },
    },
  };
  assert.throws(
    () => validateNutritionReallocation(runtime.bus.transaction(), context(runtime), ports, alteredMeal, original),
    /PROTECTED_MEAL/,
  );
});

test('moving a meal or removing it preserves the original meal protection', async () => {
  const runtime = await progressRuntime();
  runtime.at('2026-10-19T09:00:00.000Z');
  const input = await draft(runtime);
  const first = await runtime.execute<Fact>('execution.intake.confirm', {
    draftId: input.id,
    expectedVersion: input.version,
    expectedFactVersion: '0',
    explicitConfirm: true,
    unknownAccepted: false,
    planItemIds: [],
  });
  const edited = await runtime.execute<FoodDraft>('execution.food-draft.save', {
    id: input.id,
    expectedVersion: '2',
    businessDate: '2026-10-19',
    mealCode: 'DINNER',
    evidence: [],
    description: 'corrected meal',
    lines: [food],
  });
  const second = await runtime.execute<Fact>('execution.intake.confirm', {
    draftId: input.id,
    expectedVersion: edited.version,
    expectedFactVersion: first.version,
    explicitConfirm: true,
    unknownAccepted: false,
    planItemIds: [],
  });
  await runtime.execute('execution.fact.remove', { factId: second.id, expectedVersion: second.version });
  assert.equal(hasMealActual(runtime.bus.transaction(), '2026-10-19', 'LUNCH'), true);
  assert.equal(hasMealActual(runtime.bus.transaction(), '2026-10-19', 'DINNER'), true);
});

test('an already-started overnight plan cannot be unlocked by changing its draft start time', async () => {
  const runtime = await progressRuntime();
  runtime.at('2026-10-18T14:00:00.000Z');
  const original: PlanItem = {
    id: randomUUID(),
    revisionId: randomUUID(),
    goalRevisionId: randomUUID(),
    businessDate: '2026-10-19',
    kind: 'SLEEP',
    disposition: 'PLANNED',
    prescription: {
      title: 'Sleep',
      startAt: '2026-10-18T13:00:00.000Z',
      minutes: '480',
      actions: [],
      learning: null,
      nutrition: null,
    },
  };
  const changed = { ...original, prescription: { ...original.prescription, startAt: '2026-10-19T01:00:00.000Z' } };
  assert.throws(
    () => validatePublishableRange(runtime.bus.transaction(), context(runtime), ports, changed, original),
    /PROTECTED_RANGE/,
  );
});
