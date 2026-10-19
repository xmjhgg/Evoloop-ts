import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { mkdir, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { sqliteStore } from '../fixtures/stores.ts';
import { setup, fixedNow } from '../fixtures/local.ts';
import { LocalGateway } from '../../apps/mobile/src/gateways/local.ts';
import { HttpClient } from '../../apps/mobile/src/platform/network/http.ts';
import { commandSession } from '../../apps/mobile/src/gateways/command-session.ts';
import { exportMobileBackup, restoreMobileBackup } from '../../apps/mobile/src/gateways/backup.ts';
import { registerImage } from '../../apps/mobile/src/gateways/sync-attachments.ts';
import { backupCrypto } from '@evoloop/local-runtime';
import { digest } from '@evoloop/kernel';
import { technicalStores, offline, mobileFixture } from './fixture.ts';
import { activityForm } from '../../apps/mobile/src/features/training-record/model.ts';
import { values } from './fixture.ts';
import { requestCandidate } from '../../apps/mobile/src/gateways/ai.ts';
import { canonical } from '@evoloop/kernel';

test('real SQLite: client command retry is idempotent and offline facts survive closing/reopening connection', async () => {
  const folder = resolve('.test-data', 'mobile-' + randomUUID());
  assert.ok(folder.startsWith(resolve('.test-data') + sep));
  await mkdir(folder, { recursive: true });
  let db = await sqliteStore(folder);
  try {
    const f = await setup(db.store),
      stores = technicalStores();
    const identity = {
      accountId: f.settings.accountId,
      username: 'synthetic',
      origin: 'https://synthetic.invalid',
      credential: 'test-only',
      expiresAt: fixedNow,
      healthAllowed: true,
      aiAllowed: false,
      purposeVersion: '1',
    };
    const gateway = new LocalGateway(
      f.bus,
      identity,
      new HttpClient(identity.origin, () => null, offline),
      stores.tasks,
      stores.assets,
      async () => undefined,
    );
    const send = commandSession(gateway, randomUUID, () => fixedNow);
    const form = activityForm(send, '2026-10-17', 'LEARNING'),
      input = values(form, { minutes: '12.500', note: '已读 3 页' });
    await form.submit(input);
    await form.submit(input);
    assert.equal(f.bus.snapshot().intents.length, 1);
    await assert.rejects(() => gateway.synchronize(), /NETWORK_UNAVAILABLE/);
    db.close();
    db = await sqliteStore(folder);
    const restored = await setup(db.store, identity.accountId);
    const fact = restored.bus
      .transaction()
      .store('execution')
      .all<import('@evoloop/client-business-core/execution').Fact>('fact')[0]!;
    assert.equal(fact.data.kind === 'LEARNING' && fact.data.durationMinutes, '12.500');
    assert.equal(restored.bus.snapshot().intents[0]!.status, 'PENDING');
  } finally {
    db.close();
    assert.ok(folder.startsWith(resolve('.test-data') + sep));
    await rm(folder, { recursive: true, force: true });
  }
});

test('mobile encrypted backup includes photo bytes, queues and preserved branch; bad password preserves current state', async () => {
  const f = await mobileFixture(),
    crypto = backupCrypto(randomBytes),
    password = 'synthetic-only-backup-password';
  const bytes = Buffer.from('private test image'),
    asset = {
      id: randomUUID(),
      digest: createHash('sha256').update(bytes).digest('hex'),
      mediaType: 'image/jpeg' as const,
      dataBase64: bytes.toString('base64'),
    };
  await registerImage(f.gateway, asset);
  const input = canonical({ facts: [] });
  await assert.rejects(
    () =>
      requestCandidate(
        f.gateway,
        {
          kind: 'review',
          id: 'daily|2026-10-17',
          expectedVersion: '0',
          componentId: null,
          input,
          inputDigest: digest(JSON.parse(input)),
        },
        randomUUID,
      ),
    /NETWORK_UNAVAILABLE/,
  );
  const form = activityForm(f.send, '2026-10-17', 'LEARNING');
  await form.submit(values(form, { minutes: '15' }));
  const pack = await exportMobileBackup(f.gateway, crypto, password);
  assert.equal(pack.includes(asset.dataBase64), false);
  const before = f.bus.snapshot();
  await assert.rejects(
    () => restoreMobileBackup(f.gateway, crypto, 'wrong-password', pack, digest(before), async () => true),
    /BACKUP_PASSWORD_OR_INTEGRITY_INVALID/,
  );
  assert.deepEqual(f.bus.snapshot(), before);
  f.images.clear();
  f.bookmarks.clear();
  await restoreMobileBackup(f.gateway, crypto, password, pack, digest(before), async () => true);
  assert.equal(f.images.get(asset.id)!.dataBase64, asset.dataBase64);
  assert.equal(f.bookmarks.size, 1);
  assert.equal(f.bus.snapshot().branches.length, 1);
  assert.equal(f.bus.snapshot().intents[0]!.status, 'PENDING');
});
