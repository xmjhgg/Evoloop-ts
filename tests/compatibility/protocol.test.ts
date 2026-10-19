import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canonical, digest } from '@evoloop/kernel';
import { prepareBatch } from '@evoloop/local-runtime';
import { batchSchema, loginSchema } from '@evoloop/contracts';
import { setup, training } from '../fixtures/local.ts';

test('published canonical golden vectors preserve BIGINT/decimal precision, Unicode and null', async () => {
  const samples = JSON.parse(await readFile(new URL('../../contracts/examples/canonical-v1.json', import.meta.url), 'utf8'));
  for (const sample of samples) {
    assert.equal(canonical(sample.value), sample.canonical);
    assert.equal(digest(sample.value), sample.digest);
  }
  assert.throws(() => canonical({ amount: 9007199254740992 }), /CANONICAL_VALUE_INVALID/);
  assert.throws(() => canonical('\uD800'), /INVALID_UNICODE/);
  assert.equal(loginSchema.safeParse({ username: 'abc', password: 'password', device: '😀'.repeat(120) }).success, true);
  assert.equal(loginSchema.safeParse({ username: 'abc', password: 'password', device: '😀'.repeat(121) }).success, false);
});
test('unsupported published payloads and old command intents reject explicitly without deleting queues', async () => {
  const runtime = await setup();
  await runtime.execute('execution.fact.save', training);
  const batch = (await prepareBatch(runtime.bus))!, before = digest(runtime.bus.snapshot());
  assert.equal(batchSchema.safeParse({ ...batch, payloadSchemaVersion: 'rows-v1-c37f47b5a4dc12a2' }).success, false);
  const command = runtime.command('execution.fact.save', training);
  await assert.rejects(runtime.bus.execute({ ...command, commandVersion: '0' }), /./);
  assert.equal(digest(runtime.bus.snapshot()), before);
});
