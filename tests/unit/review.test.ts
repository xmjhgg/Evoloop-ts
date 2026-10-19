import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, training } from '../fixtures/local.ts';
import type { ReviewDocument } from '@evoloop/client-business-core/review';
import { confirmationFingerprint, confirmedComponents } from '@evoloop/client-business-core/review';

test('empty-range tokens invalidate confirmed review on first new fact, preserving manual judgment', async () => {
  const { bus, execute } = await setup();
  const document = await execute<ReviewDocument>('review.refresh', { scope: { period: 'DAILY', date: '2026-10-17', goalId: null, slot: 'HEALTH' },
    expectedVersion: '0', manualText: 'I will rest', manualFinal: true });
  const ids = document.components.map(component => component.id);
  const confirmed = await execute<ReviewDocument>('review.scope.confirm', { documentId: document.id, expectedVersion: document.version, componentIds: ids,
    fingerprint: confirmationFingerprint(document, ids), explicitConfirm: true });
  assert.deepEqual(confirmedComponents(bus.transaction(), confirmed), ids);
  const manualToken = bus.transaction().token('review:MANUAL:' + document.id + '|HEALTH');
  assert.equal(manualToken, '1');
  await execute('execution.fact.save', training);
  const changed = bus.transaction().store('review').get<ReviewDocument>('document', document.id)!;
  assert.deepEqual(confirmedComponents(bus.transaction(), changed), []);
  assert.equal(changed.components[0]?.stale, true);
  assert.equal(changed.manual[0]?.text, 'I will rest');
  assert.equal(bus.transaction().token('review:MANUAL:' + document.id + '|HEALTH'), manualToken);
});
test('summary-only content is never implicitly confirmed', async () => {
  const { execute } = await setup();
  const document = await execute<ReviewDocument>('review.refresh', { scope: { period: 'DAILY', date: '2026-10-17', goalId: null, slot: 'LEARNING' },
    expectedVersion: '0', manualText: null, manualFinal: false });
  const ids = document.components.map(component => component.id);
  await assert.rejects(execute('review.scope.confirm', { documentId: document.id, expectedVersion: document.version, componentIds: ids,
    fingerprint: confirmationFingerprint(document, ids), explicitConfirm: true }), /FINAL_JUDGMENT_REQUIRED/);
});
