import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, training } from '../fixtures/local.ts';
import type { Condition, Observation } from '@evoloop/client-business-core/profile';
import type { ReviewDocument } from '@evoloop/client-business-core/review';
import { confirmationFingerprint, confirmedComponents } from '@evoloop/client-business-core/review';

test('masked condition edits preserve omitted values; no-op edits do not bump source tokens', async () => {
  const { bus, execute } = await setup();
  const initial = await execute<Condition>('profile.condition.edit', { section: 'COMMON', expectedVersion: '0', updateMask: ['routine', 'availability'], values: { routine: '23:00', availability: ['MONDAY'] } });
  const next = await execute<Condition>('profile.condition.edit', { section: 'COMMON', expectedVersion: initial.version, updateMask: ['routine'], values: { routine: null } });
  assert.deepEqual(next.values, { routine: null, availability: ['MONDAY'] });
  const before = bus.transaction().token('profile:CONDITIONS:COMMON');
  const same = await execute<Condition>('profile.condition.edit', { section: 'COMMON', expectedVersion: next.version, updateMask: ['routine'], values: { routine: null } });
  assert.equal(same.revisionId, next.revisionId);
  assert.equal(bus.transaction().token('profile:CONDITIONS:COMMON'), before);
  await assert.rejects(execute('profile.condition.edit', { section: 'LEARNING', expectedVersion: '0', updateMask: ['body'], values: { body: null } }), /FIELD_NOT_APPLICABLE/);
});
test('body-state slot conflicts preserve both stable facts and histories', async () => {
  const { bus, execute } = await setup();
  const first = await execute<Observation>('profile.observation.save', { id: null, expectedVersion: '0', kind: 'BODY_STATE', observedAt: '2026-10-16T12:00:00.000Z', remove: false,
    values: { feeling: { value: 'tired', unit: 'SELF_REPORT' } } });
  const second = await execute<Observation>('profile.observation.save', { id: null, expectedVersion: '0', kind: 'BODY_STATE', observedAt: '2026-10-17T12:00:00.000Z', remove: false,
    values: { feeling: { value: 'rested', unit: 'SELF_REPORT' } } });
  await assert.rejects(execute('profile.observation.save', { id: first.id, expectedVersion: first.version, kind: 'BODY_STATE', observedAt: second.observedAt, remove: false, values: first.values }), /BODY_STATE_DAY_OCCUPIED/);
  assert.equal(bus.snapshot().rows['profile.observation']?.length, 2);
});
test('learning-only changes preserve a health component confirmation in the shared daily root', async () => {
  const { bus, execute } = await setup();
  const health = await execute<ReviewDocument>('review.refresh', { scope: { period: 'DAILY', date: '2026-10-17', goalId: null, slot: 'HEALTH' }, expectedVersion: '0', manualText: 'Rest', manualFinal: true });
  const ids = [health.components[0]!.id];
  const confirmed = await execute<ReviewDocument>('review.scope.confirm', { documentId: health.id, expectedVersion: health.version, componentIds: ids, fingerprint: confirmationFingerprint(health, ids), explicitConfirm: true });
  await execute('execution.fact.save', { ...training, data: { kind: 'LEARNING', status: 'COMPLETED', durationMinutes: '20', fragments: [{ unit: 'MINUTE', quantity: '20' }], outcome: 'Notes' } });
  const withLearning = await execute<ReviewDocument>('review.refresh', { scope: { period: 'DAILY', date: '2026-10-17', goalId: null, slot: 'LEARNING' }, expectedVersion: confirmed.version, manualText: 'Learned', manualFinal: true });
  assert.deepEqual(confirmedComponents(bus.transaction(), withLearning), ids);
});
