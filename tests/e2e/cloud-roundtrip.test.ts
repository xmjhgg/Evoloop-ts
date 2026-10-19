import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { resolve, join } from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { receiptSchema, pullSchema, capabilitiesSchema, snapshotSchema } from '@evoloop/contracts';
import { syncOnce, reconcile, createSnapshot } from '@evoloop/local-runtime';
import { canonical, digest } from '@evoloop/kernel';
import { setup, training } from '../fixtures/local.ts';
import { sqliteStore } from '../fixtures/stores.ts';

test('real SQLite clients round-trip through Java HTTP/MySQL and preserve a concurrent offline branch', { timeout: 60000 }, async () => {
  assert.match(process.env['EVOLOOP_CLOUD_DB_URL'] ?? '', /^jdbc:mysql:\/\/[^/]+\/evoloop_two_test(?:\?|$)/);
  const executable = process.env['JAVA_HOME'] ? join(process.env['JAVA_HOME'], 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
  const server = spawn(executable, ['-jar', resolve('apps/cloud/target/evoloop-cloud-0.1.0.jar')], { env: {
    ...process.env, EVOLOOP_PORT: '0', PURPOSE_NOTICE_VERSION: 'synthetic-e2e-only', PURPOSE_NOTICE_TEXT: 'Synthetic e2e notice only', AI_ENDPOINT: '', AI_API_KEY: '', AI_MODEL: '',
  }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const port = await new Promise<string>((resolvePort, reject) => {
    const timer = setTimeout(() => reject(new Error('Java HTTP startup timeout')), 30000);
    server.once('exit', code => { clearTimeout(timer); reject(new Error('Java exited before ready: ' + code)); });
    server.stdout.on('data', data => {
      const match = /Tomcat started on port (\d+)/.exec(String(data));
      if (match) { clearTimeout(timer); resolvePort(match[1]!); }
    });
    server.stderr.on('data', () => undefined);
  }).catch(error => { server.kill(); throw error; });
  const base = 'http://127.0.0.1:' + port;
  let firstStore: Awaited<ReturnType<typeof sqliteStore>> | null = null;
  let secondStore: Awaited<ReturnType<typeof sqliteStore>> | null = null;
  let thirdStore: Awaited<ReturnType<typeof sqliteStore>> | null = null;
  try {
    const request = async (method: string, path: string, token: string | null, body?: unknown) => {
      const response = await fetch(base + path, { method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000) });
      const json = await response.json();
      assert.ok(response.ok, JSON.stringify(json));
      return json;
    };
    const username = 'e2e_' + randomUUID().replaceAll('-', '').slice(0, 20), password = 'synthetic-e2e-password';
    const account = await request('POST', '/api/v2/identity/accounts', null, { username, password, declarationVersion: 'registration-v1' }) as { accountId: string };
    const login = await request('POST', '/api/v2/identity/sessions/password', null, { username, password, device: 'e2e' }) as { credential: string };
    await request('PUT', '/api/v2/identity/purposes', login.credential, { aiAllowed: false, healthAllowed: true, noticeVersion: 'synthetic-e2e-only', expectedPurposeVersion: '0' });
    const transport = { capabilities: async () => capabilitiesSchema.parse(await request('GET', '/api/v2/sync/capabilities', login.credential)),
      snapshot: async (id: string) => snapshotSchema.parse(await request('GET', '/api/v2/sync/snapshots/' + id, login.credential)),
      upload: async (batch: unknown) => receiptSchema.parse(await request('POST', '/api/v2/sync/batches', login.credential, batch)),
      pull: async (after: string) => pullSchema.parse(await request('GET', '/api/v2/sync/batches?afterSequence=' + after, login.credential)) };
    firstStore = await sqliteStore(await mkdtemp(join(tmpdir(), 'evoloop-two-e2e-a-')));
    secondStore = await sqliteStore(await mkdtemp(join(tmpdir(), 'evoloop-two-e2e-b-')));
    const first = await setup(firstStore.store, account.accountId), second = await setup(secondStore.store, account.accountId);
    await first.execute('execution.fact.save', training);
    assert.equal(await syncOnce(first.bus, transport), 'SYNCED');
    assert.equal(await syncOnce(second.bus, transport), 'SYNCED');
    assert.equal(canonical(second.bus.snapshot().rows), canonical(first.bus.snapshot().rows));
    await first.execute('profile.condition.edit', { section: 'COMMON', expectedVersion: '0', updateMask: ['routine'], values: { routine: 'updated offline' } });
    assert.equal(await syncOnce(first.bus, transport), 'SYNCED');
    await second.execute('execution.fact.save', { ...training, data: { kind: 'LEARNING', status: 'COMPLETED', durationMinutes: '20', outcome: 'Notes', fragments: [] } });
    assert.equal(await syncOnce(second.bus, transport), 'CONFLICT');
    assert.equal(second.bus.snapshot().rows['execution.fact']?.length, 2);
    await reconcile(second.bus, 'REPLAY', digest(second.bus.snapshot()));
    assert.equal(await syncOnce(second.bus, transport), 'SYNCED');
    assert.equal(await syncOnce(first.bus, transport), 'SYNCED');
    assert.equal(canonical(first.bus.snapshot().rows), canonical(second.bus.snapshot().rows));
    assert.ok(second.bus.snapshot().branches.length > 0);
    const manifest = createSnapshot(first.bus, randomUUID());
    await request('POST', '/api/v2/sync/snapshots', login.credential, manifest);
    await request('POST', '/api/v2/sync/snapshots/' + manifest.snapshotId + '/complete', login.credential, {});
    thirdStore = await sqliteStore(await mkdtemp(join(tmpdir(), 'evoloop-two-e2e-c-')));
    const third = await setup(thirdStore.store, account.accountId);
    assert.equal(await syncOnce(third.bus, transport), 'SYNCED');
    assert.equal(canonical(third.bus.snapshot().rows), canonical(first.bus.snapshot().rows));
  } finally { firstStore?.close(); secondStore?.close(); thirdStore?.close(); server.kill(); }
});
