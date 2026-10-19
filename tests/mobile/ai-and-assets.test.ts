import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { canonical, digest } from '@evoloop/kernel';
import { requestCandidate, readCandidate, acceptCandidate } from '../../apps/mobile/src/gateways/ai.ts';
import { registerImage, synchronizeAttachments } from '../../apps/mobile/src/gateways/sync-attachments.ts';
import { imageReference, parseImageReference } from '../../apps/mobile/src/gateways/assets.ts';
import { mobileFixture } from './fixture.ts';

test('AI request survives a lost HTTP response and retries the persisted request identity', async () => {
  const seen: string[] = [],
    taskId = randomUUID();
  const f = await mobileFixture(async (_url, init) => {
    const request = JSON.parse(init.body!);
    seen.push(request.clientRequestId);
    if (seen.length === 1) throw Error('synthetic lost response');
    return {
      ok: true,
      status: 202,
      async json() {
        return { taskId, status: 'QUEUED', inputDigest: request.inputDigest };
      },
    };
  });
  const input = canonical({ facts: [] }),
    target = {
      kind: 'review' as const,
      id: 'daily|2026-10-17',
      expectedVersion: '1',
      componentId: randomUUID(),
      input,
      inputDigest: digest(JSON.parse(input)),
    };
  await assert.rejects(() => requestCandidate(f.gateway, target, randomUUID), /NETWORK_UNAVAILABLE/);
  const bookmark = await requestCandidate(f.gateway, target, randomUUID);
  assert.equal(bookmark.taskId, taskId);
  assert.equal(seen[0], seen[1]);
  assert.equal(f.bus.snapshot().intents.length, 0);
});

test('AI review candidate acceptance never confirms a review and rejects foreign task input', async () => {
  const f = await mobileFixture();
  await f.send('review.refresh', {
    scope: { period: 'DAILY', date: '2026-10-17', goalId: null, slot: 'LEARNING' },
    expectedVersion: '0',
    manualText: null,
    manualFinal: false,
  });
  const document = f.gateway.reviews()[0]!,
    component = document.components[0]!;
  await acceptCandidate(
    f.send,
    {
      kind: 'review',
      id: document.id,
      expectedVersion: document.version,
      componentId: component.id,
      input: component.input,
      inputDigest: component.inputDigest,
    },
    { text: '候选判断', data: null },
  );
  assert.equal(f.gateway.reviews()[0]!.components[0]!.state, 'AWAITING_CONFIRMATION');
  assert.equal(f.gateway.reviews()[0]!.confirmations.length, 0);
  const other = await mobileFixture(async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        taskId: randomUUID(),
        status: 'SUCCEEDED',
        inputDigest: '0'.repeat(64),
        version: '1',
        errorCode: null,
        output: { text: 'foreign', data: null },
        sourceMetadata: '',
        outputSchemaVersion: 'candidate-v1',
        modelId: 'synthetic',
        promptVersion: 'synthetic',
      };
    },
  }));
  await assert.rejects(
    () =>
      readCandidate(other.gateway, {
        key: 'test',
        target: {
          kind: 'review',
          id: document.id,
          expectedVersion: document.version,
          componentId: component.id,
          input: component.input,
          inputDigest: component.inputDigest,
        },
        taskId: randomUUID(),
        request: {
          clientRequestId: randomUUID(),
          capability: 'REVIEW',
          input: component.input,
          inputDigest: component.inputDigest,
          sourceMetadata: '',
          outputSchemaVersion: 'candidate-v1',
          assetIds: [],
        },
      }),
    /AI_SOURCE_MISMATCH/,
  );
});

test('photo manifests are retained until matching upload acknowledgement; opaque evidence carries immutable digest', async () => {
  const dataBase64 = Buffer.from('synthetic image bytes').toString('base64'),
    asset = {
      id: randomUUID(),
      digest: createHash('sha256').update('synthetic image bytes').digest('hex'),
      mediaType: 'image/jpeg' as const,
      dataBase64,
    };
  let wrongReceipt = true;
  const f = await mobileFixture(async () => ({
    ok: true,
    status: 200,
    async json() {
      return { id: wrongReceipt ? randomUUID() : asset.id, digest: asset.digest, complete: true };
    },
  }));
  await registerImage(f.gateway, asset);
  assert.deepEqual(parseImageReference(imageReference(asset)), { id: asset.id, digest: asset.digest });
  await assert.rejects(() => synchronizeAttachments(f.gateway), /IMAGE_RECEIPT_MISMATCH/);
  assert.equal(f.bus.snapshot().attachments[0]!.complete, false);
  wrongReceipt = false;
  await synchronizeAttachments(f.gateway);
  assert.equal(f.bus.snapshot().attachments[0]!.complete, true);
  assert.equal(f.images.size, 1);
});
