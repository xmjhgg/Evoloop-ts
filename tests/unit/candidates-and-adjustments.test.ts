import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, goalInput, prescription } from '../fixtures/local.ts';
import type { Goal, PlanCandidate, WeekPlan } from '@evoloop/client-business-core/planning';
import type { ReviewDocument, Adjustment } from '@evoloop/client-business-core/review';
import { confirmationFingerprint } from '@evoloop/client-business-core/review';

test('frozen AI draft can be accepted only against current sources; acceptance creates an unpublished draft', async () => {
  const { bus, execute } = await setup();
  const goal = await execute<Goal>('planning.goal.save', goalInput);
  const request = await execute<PlanCandidate>('planning.week.request-candidate', { goalId: goal.id, weekStart: '2026-10-19', expectedVersion: '0' });
  assert.equal(JSON.parse(request.input).goal.id, goal.id);
  const week = await execute<WeekPlan>('planning.week.accept-generated-draft', { candidateId: request.id, expectedVersion: request.version, inputDigest: request.inputDigest,
    changes: [{ id: null, businessDate: '2026-10-19', kind: 'LEARNING', disposition: 'PLANNED', prescription }] });
  assert.equal(week.published.length, 0);
  const stale = await execute<PlanCandidate>('planning.week.request-candidate', { goalId: goal.id, weekStart: '2026-10-19', expectedVersion: week.version });
  await execute('profile.condition.edit', { section: 'LEARNING', expectedVersion: '0', updateMask: ['preferences'], values: { preferences: 'new' } });
  await assert.rejects(execute('planning.week.accept-generated-draft', { candidateId: stale.id, expectedVersion: stale.version, inputDigest: stale.inputDigest, changes: [] }), /SOURCE_STALE/);
  assert.equal(bus.transaction().store('planning').get<WeekPlan>('week', week.id)?.draft.length, 1);
});
test('confirmed basis can propose and merge future adjustment without publishing it', async () => {
  const { execute } = await setup();
  const goal = await execute<Goal>('planning.goal.save', goalInput);
  const week = await execute<WeekPlan>('planning.week.patch-draft', { goalId: goal.id, weekStart: '2026-10-19', expectedVersion: '0',
    changes: [{ id: null, businessDate: '2026-10-19', kind: 'LEARNING', disposition: 'PLANNED', prescription }] });
  const document = await execute<ReviewDocument>('review.refresh', { scope: { period: 'DAILY', date: '2026-10-17', goalId: goal.id, slot: 'GOAL:' + goal.id }, expectedVersion: '0', manualText: 'Reduce tomorrow load', manualFinal: true });
  const ids = [document.components[0]!.id];
  const confirmed = await execute<ReviewDocument>('review.scope.confirm', { documentId: document.id, expectedVersion: document.version, componentIds: ids,
    fingerprint: confirmationFingerprint(document, ids), explicitConfirm: true });
  const old = week.draft[0]!;
  const suggestion = await execute<Adjustment>('review.adjustment.propose', { documentId: document.id, expectedVersion: confirmed.version, componentIds: ids, weekId: week.id,
    changes: [{ itemId: old.id, oldValue: old, proposed: { ...old, prescription: { ...old.prescription, title: 'Reduced' } }, reason: 'Explicit judgment' }] });
  const submitted = await execute<Adjustment>('review.adjustment.submit', { adjustmentId: suggestion.id, expectedVersion: week.version, choices: [] });
  assert.equal(submitted.status, 'SUBMITTED');
});
