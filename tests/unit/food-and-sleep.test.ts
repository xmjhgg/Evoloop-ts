import test from 'node:test';
import assert from 'node:assert/strict';
import { setup } from '../fixtures/local.ts';
import type { Fact, FoodDraft } from '@evoloop/client-business-core/execution';
import { intakeSummary, foodInputDigest } from '@evoloop/client-business-core/execution';

const known = { state: 'KNOWN', value: '100.125', lower: null, upper: null, unit: 'kcal', source: 'manual' };
const unknown = { state: 'UNKNOWN', value: null, lower: null, upper: null, unit: 'g', source: 'manual' };
const line = { id: 'line1', name: 'Food', personalFactor: '0.5', portionUnit: 'plate', energy: known, protein: unknown, carbohydrate: unknown, fat: unknown };
test('AI candidate acceptance creates no intake; explicit confirmation records half portion and unknowns only once', async () => {
  const { bus, execute } = await setup();
  const draft = await execute<FoodDraft>('execution.food-draft.save', { id: null, expectedVersion: '0', businessDate: '2026-10-17', mealCode: 'LUNCH',
    evidence: ['photo1', 'photo2'], description: 'shared plate', lines: [] });
  const candidate = await execute<FoodDraft>('execution.food-draft.accept-candidate', { draftId: draft.id, expectedVersion: draft.version, inputDigest: foodInputDigest(draft), lines: [line] });
  assert.equal(bus.snapshot().rows['execution.fact']?.length ?? 0, 0);
  const fact = await execute<Fact>('execution.intake.confirm', { draftId: draft.id, expectedVersion: candidate.version, expectedFactVersion: '0', explicitConfirm: true, unknownAccepted: true, planItemIds: [] });
  const latestDraft = bus.transaction().store('execution').get<FoodDraft>('food-draft', draft.id)!;
  const retry = await execute<Fact>('execution.intake.confirm', { draftId: draft.id, expectedVersion: latestDraft.version, expectedFactVersion: fact.version, explicitConfirm: true, unknownAccepted: true, planItemIds: [] });
  assert.equal(retry.id, fact.id);
  const summary = intakeSummary(bus.transaction(), '2026-10-17');
  assert.equal(summary.energy.total, '50.0625');
  assert.equal(summary.protein.total, null);
  assert.deepEqual(summary.recordedMeals, ['LUNCH']);
  assert.equal(summary.factIds.length, 1);
});
test('sleep start and finish update one fact and assign the actual wake-up date', async () => {
  const { bus, execute } = await setup();
  const start = { id: null, expectedVersion: '0', businessDate: '2026-10-17', planItemIds: [], remove: false,
    data: { kind: 'SLEEP', beginAt: '2026-10-16T15:00:00.000Z', endAt: null, provisionalWakeDate: '2026-10-17' } };
  const first = await execute<Fact>('execution.fact.save', start);
  const finished = await execute<Fact>('execution.fact.save', { ...start, id: first.id, expectedVersion: first.version, data: { ...start.data, endAt: '2026-10-16T23:00:00.000Z' } });
  assert.equal(finished.id, first.id);
  assert.equal(bus.snapshot().rows['execution.fact']?.length, 1);
  assert.ok(bus.snapshot().rows['planning.guard']?.some(row => row.id.startsWith('2026-10-16')));
});
