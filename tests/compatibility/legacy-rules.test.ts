import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setup } from '../fixtures/local.ts';

const fixtures = JSON.parse(await readFile(new URL('../fixtures/legacy-business-rules.json', import.meta.url), 'utf8')) as {
  id: string; operation: string; command: { businessDate: string; status?: string; durationMinutes?: number; bedMinute?: number; wakeMinute?: number }; expectedCode: string | null;
}[];
for (const fixture of fixtures) test('legacy frozen business baseline: ' + fixture.id, async () => {
  const runtime = await setup();
  runtime.settings.now = () => '2026-10-15T12:00:00.000Z';
  const command = fixture.command;
  const base = { id: null, expectedVersion: '0', businessDate: command.businessDate, planItemIds: [], remove: false };
  let data;
  if (fixture.operation === 'recordSleep') data = { kind: 'SLEEP', beginAt: '2026-10-14T15:00:00.000Z', endAt: '2026-10-14T23:00:00.000Z', provisionalWakeDate: command.businessDate };
  else if (fixture.operation === 'recordLearning') data = { kind: 'LEARNING', status: command.status, durationMinutes: command.durationMinutes === undefined ? null : String(command.durationMinutes), outcome: '', fragments: [] };
  else data = { kind: 'TRAINING', status: command.status, durationMinutes: command.durationMinutes === undefined ? null : String(command.durationMinutes), feeling: '', actions: [] };
  const input = { ...runtime.command('execution.fact.save', { ...base, data }), occurredAt: runtime.settings.now() };
  if (fixture.expectedCode) await assert.rejects(runtime.bus.execute(input), new RegExp(fixture.expectedCode));
  else await runtime.bus.execute(input);
});
