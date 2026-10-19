import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareBatch, acknowledge } from '@evoloop/local-runtime';
import { setup, goalInput } from '../fixtures/local.ts';
import type { Goal } from '@evoloop/client-business-core/planning';

test('an offline queue splits at command boundaries without losing later intents', async () => {
  const runtime = await setup();
  for (let index = 0; index < 3; index++) await runtime.execute('planning.goal.save', { ...goalInput, name: 'Goal ' + index });
  const seen = new Set<string>();
  for (let sequence = 1; sequence <= 3; sequence++) {
    const batch = (await prepareBatch(runtime.bus, { maxChanges: 6, maxBytes: 8388608 }))!;
    assert.ok(batch.changes.length <= 6);
    assert.equal(batch.expectedHeadVersion, String(sequence - 1));
    assert.equal(seen.has(batch.batchId), false); seen.add(batch.batchId);
    await acknowledge(runtime.bus, { batchId: batch.batchId, inputDigest: batch.payloadDigest, status: 'STORED', serverSequence: String(sequence), currentHeadVersion: String(sequence), code: null });
  }
  assert.equal(await prepareBatch(runtime.bus), null);
  assert.equal(runtime.bus.snapshot().intents.filter(intent => intent.status === 'STORED').length, 3);
});
test('a no-op command has a durable local receipt without an unsendable empty batch', async () => {
  const runtime = await setup();
  const goal = await runtime.execute<Goal>('planning.goal.save', goalInput);
  const first = (await prepareBatch(runtime.bus))!;
  await acknowledge(runtime.bus, { batchId: first.batchId, inputDigest: first.payloadDigest, status: 'STORED', serverSequence: '1', currentHeadVersion: '1', code: null });
  await runtime.execute('profile.condition.edit', { section: 'COMMON', expectedVersion: '0', updateMask: ['routine'], values: { routine: null } });
  const conditionBatch = (await prepareBatch(runtime.bus))!;
  await acknowledge(runtime.bus, { batchId: conditionBatch.batchId, inputDigest: conditionBatch.payloadDigest, status: 'STORED', serverSequence: '2', currentHeadVersion: '2', code: null });
  await runtime.execute('profile.condition.edit', { section: 'COMMON', expectedVersion: '1', updateMask: ['routine'], values: { routine: null } });
  assert.equal(runtime.bus.snapshot().intents.at(-1)?.status, 'LOCAL_ONLY');
  assert.equal(await prepareBatch(runtime.bus), null);
  assert.ok(goal.id);
});
