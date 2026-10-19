import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { backupCrypto, exportBackup, restoreBackup } from '@evoloop/local-runtime';
import { digest } from '@evoloop/kernel';
import { setup, training, goalInput } from '../fixtures/local.ts';

test('encrypted restore preserves pending branch and history; bad password never modifies current store', async () => {
  const runtime = await setup(), crypto = backupCrypto(length => randomBytes(length));
  await runtime.execute('execution.fact.save', training);
  const backup = await exportBackup(runtime.bus, crypto, 'a-strong-test-password');
  assert.equal(backup.includes('TRAINING'), false);
  await runtime.execute('planning.goal.save', goalInput);
  const before = digest(runtime.bus.snapshot());
  await assert.rejects(restoreBackup(runtime.bus, crypto, backup, 'wrong-password', before), /BACKUP_PASSWORD_OR_INTEGRITY_INVALID/);
  assert.equal(digest(runtime.bus.snapshot()), before);
  await restoreBackup(runtime.bus, crypto, backup, 'a-strong-test-password', before);
  assert.equal(runtime.bus.snapshot().intents.length, 1);
  assert.equal(runtime.bus.snapshot().branches.at(-1)?.intents.length, 2);
  assert.equal(runtime.bus.snapshot().branches.at(-1)?.rows['planning.goal']?.length, 1);
});
test('legacy and unknown local formats reject explicitly while original archive and queue are retained', async () => {
  const runtime = await setup(), crypto = backupCrypto(length => randomBytes(length));
  await runtime.execute('execution.fact.save', training);
  const before = digest(runtime.bus.snapshot());
  const legacyArchive = JSON.stringify({ formatVersion: 'rows-v1', pending: [{ method: 'recordTraining', args: [training] }] });
  const encrypted = await crypto.seal(legacyArchive, 'a-strong-test-password');
  await assert.rejects(restoreBackup(runtime.bus, crypto, encrypted, 'a-strong-test-password', before), /BACKUP_INVALID/);
  assert.equal(digest(runtime.bus.snapshot()), before);
  assert.equal(JSON.parse(legacyArchive).pending.length, 1);
});
