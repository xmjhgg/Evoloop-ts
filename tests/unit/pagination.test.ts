import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareBatch, acknowledge, syncOnce } from '@evoloop/local-runtime';
import { setup, goalInput } from '../fixtures/local.ts';
import type { Envelope } from '@evoloop/contracts';

test('sync drains consecutive pages before reporting that a new client is caught up', async () => {
  const remote = await setup(), local = await setup(undefined, remote.settings.accountId), envelopes: Envelope[] = [];
  for (let index = 1; index <= 2; index++) {
    await remote.execute('planning.goal.save', { ...goalInput, name: 'Remote ' + index });
    const batch = (await prepareBatch(remote.bus))!;
    envelopes.push({ serverSequence: String(index), batch });
    await acknowledge(remote.bus, { batchId: batch.batchId, inputDigest: batch.payloadDigest, status: 'STORED', serverSequence: String(index), currentHeadVersion: String(index), code: null });
  }
  const cursors: string[] = [];
  const result = await syncOnce(local.bus, {
    capabilities: async () => ({ syncProtocolVersions: ['1'], payloadSchemaVersions: ['documents-v1'], headVersion: '2', rootInitialized: true,
      snapshotId: null, snapshotSequence: null, maxChanges: '2000', maxBytes: '8388608' }),
    snapshot: async () => { throw new Error('unexpected snapshot'); },
    upload: async () => { throw new Error('unexpected upload'); },
    pull: async after => { cursors.push(after); return { envelopes: envelopes.filter(envelope => BigInt(envelope.serverSequence) > BigInt(after)).slice(0, 1), headVersion: '2' }; },
  });
  assert.equal(result, 'SYNCED');
  assert.deepEqual(cursors, ['0', '1']);
  assert.equal(local.bus.snapshot().pulledSequence, '2');
  assert.equal(local.bus.snapshot().rows['planning.goal']?.length, 2);
});
