import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { foodForm } from '../../apps/mobile/src/features/food-draft/model.ts';
import { apiOrigin, HttpClient } from '../../apps/mobile/src/platform/network/http.ts';
import { signIn } from '../../apps/mobile/src/gateways/identity.ts';
import { mobileFixture, values } from './fixture.ts';
import { z } from 'zod';

test('food form retains estimated/unknown nutrition and confirmation remains an independent fact', async () => {
  const f = await mobileFixture(),
    form = foodForm(f.send, '2026-10-17', randomUUID());
  const row = {
    name: '米饭',
    factor: '0.5',
    unit: '碗',
    energyState: 'ESTIMATED',
    energy: '200',
    energyLower: '180',
    energyUpper: '220',
    proteinState: 'UNKNOWN',
    protein: '',
    carbohydrateState: 'UNKNOWN',
    carbohydrate: '',
    fatState: 'UNKNOWN',
    fat: '',
  };
  await form.submit(values(form, { foods: JSON.stringify([row]) }));
  let draft = f.bus
    .transaction()
    .store('execution')
    .all<import('@evoloop/client-business-core/execution').FoodDraft>('food-draft')[0]!;
  assert.equal(f.gateway.today('2026-10-17').actual.length, 0);
  const editor = foodForm(f.send, '2026-10-17', randomUUID(), draft);
  await editor.submit(values(editor, { description: '核对说明' }));
  draft = f.bus.transaction().store('execution').all<typeof draft>('food-draft')[0]!;
  assert.equal(draft.lines[0]!.energy.state, 'ESTIMATED');
  assert.equal(draft.lines[0]!.energy.lower, '180');
  await f.send('execution.intake.confirm', {
    draftId: draft.id,
    expectedVersion: draft.version,
    expectedFactVersion: '0',
    explicitConfirm: true,
    unknownAccepted: true,
    planItemIds: [],
  });
  assert.equal(f.gateway.today('2026-10-17').intake.energy.total, '100');
  assert.equal(f.gateway.today('2026-10-17').intake.protein.total, null);
});

test('HTTP adapter pins origin and authenticated account; a 401 is surfaced without changing local state', async () => {
  assert.throws(() => apiOrigin('http://example.com', true));
  assert.throws(() => apiOrigin('https://user:password@example.com'));
  assert.equal(apiOrigin('https://example.com/'), 'https://example.com');
  const accountId = randomUUID(),
    credential = 'x'.repeat(43),
    requests: string[] = [];
  const http = new HttpClient(
    'https://synthetic.invalid',
    () => null,
    async (url, init) => {
      requests.push(url);
      const body = url.endsWith('password')
        ? { accountId, credential, expiresAt: '2026-11-17T12:00:00.000Z' }
        : { accountId, username: 'synthetic', healthAllowed: false, aiAllowed: false, purposeVersion: '0' };
      if (url.endsWith('/session')) assert.equal(init.headers['Authorization'], 'Bearer ' + credential);
      return {
        ok: true,
        status: 200,
        async json() {
          return body;
        },
      };
    },
  );
  assert.equal((await signIn(http, 'synthetic', 'not-logged')).accountId, accountId);
  assert.equal(requests.length, 2);
  const revoked = new HttpClient(
    'https://synthetic.invalid',
    () => credential,
    async () => ({
      ok: false,
      status: 401,
      async json() {
        return { code: 'SESSION_REQUIRED' };
      },
    }),
  );
  await assert.rejects(() => revoked.call('GET', '/api/v2/identity/session', z.unknown()), /SESSION_REQUIRED/);
});
