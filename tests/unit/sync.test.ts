import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareBatch, acknowledge, importEnvelopes, reconcile } from '@evoloop/local-runtime';
import { digest } from '@evoloop/kernel';
import { setup, training, goalInput } from '../fixtures/local.ts';

test('lost ACK retries exactly the same batch; a pulled echo acknowledges only matching intents', async () => {
  const runtime = await setup();
  await runtime.execute('execution.fact.save', training);
  const batch = (await prepareBatch(runtime.bus))!;
  await runtime.execute('planning.goal.save', goalInput);
  assert.deepEqual(await prepareBatch(runtime.bus), batch);
  assert.equal(await importEnvelopes(runtime.bus, [{ serverSequence: '1', batch }], '1'), 'APPLIED');
  assert.deepEqual(runtime.bus.snapshot().intents.map(intent => intent.status), ['STORED', 'PENDING']);
  const next = (await prepareBatch(runtime.bus))!;
  assert.notEqual(next.batchId, batch.batchId);
  assert.equal(next.expectedHeadVersion, '1');
  assert.ok(next.changes.some(change => change.table === 'planning.goal'));
});
test('conflict keeps local facts and branches; deterministic client replay generates a new batch', async () => {
  const local = await setup(), remote = await setup(undefined, local.settings.accountId);
  await local.execute('execution.fact.save', training);
  const oldBatch = (await prepareBatch(local.bus))!;
  await remote.execute('planning.goal.save', goalInput);
  const remoteBatch = (await prepareBatch(remote.bus))!;
  await acknowledge(local.bus, { batchId: oldBatch.batchId, inputDigest: oldBatch.payloadDigest, status: 'CONFLICT', serverSequence: null, currentHeadVersion: '1', code: 'SYNC_VERSION_CONFLICT' });
  assert.equal(await importEnvelopes(local.bus, [{ serverSequence: '1', batch: remoteBatch }], '1'), 'NEEDS_RECONCILIATION');
  assert.equal(local.bus.snapshot().rows['execution.fact']?.length, 1);
  await assert.rejects(prepareBatch(local.bus), /SYNC_RECONCILIATION_REQUIRED/);
  await reconcile(local.bus, 'REPLAY', digest(local.bus.snapshot()));
  assert.equal(local.bus.snapshot().rows['planning.goal']?.length, 1);
  assert.equal(local.bus.snapshot().rows['execution.fact']?.length, 1);
  assert.ok(local.bus.snapshot().branches.length >= 2);
  const rebased = (await prepareBatch(local.bus))!;
  assert.notEqual(rebased.batchId, oldBatch.batchId);
  assert.equal(rebased.expectedHeadVersion, '1');
});
test('sequence gaps and corrupt payloads never replace the local view', async () => {
  const local = await setup(), remote = await setup(undefined, local.settings.accountId);
  await remote.execute('planning.goal.save', goalInput);
  const batch = (await prepareBatch(remote.bus))!, before = digest(local.bus.snapshot());
  await assert.rejects(importEnvelopes(local.bus, [{ serverSequence: '2', batch }], '2'), /SYNC_SEQUENCE_GAP/);
  await assert.rejects(importEnvelopes(local.bus, [{ serverSequence: '1', batch: { ...batch, payloadDigest: '0'.repeat(64) } }], '1'), /DIGEST_MISMATCH/);
  assert.equal(digest(local.bus.snapshot()), before);
  assert.equal(await importEnvelopes(local.bus, [{ serverSequence: '1', batch }], '1'), 'APPLIED');
  assert.equal(local.bus.snapshot().rows['planning.goal']?.length, 1);
});
