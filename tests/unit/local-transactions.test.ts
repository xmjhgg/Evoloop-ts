import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, goalInput, training, MemoryStore } from '../fixtures/local.ts';
import type { Fact } from '@evoloop/client-business-core/execution';
import { digest } from '@evoloop/kernel';

test('fact, baseline protection, token, intent and history roll back together on failed durable commit', async () => {
  const store = new MemoryStore(), { bus, execute } = await setup(store);
  const before = digest(bus.snapshot());
  store.fail = true;
  await assert.rejects(execute('execution.fact.save', training), /DISK_FULL/);
  assert.equal(digest(bus.snapshot()), before);
  store.fail = false;
  const fact = await execute<Fact>('execution.fact.save', training);
  assert.equal(fact.data.kind, 'TRAINING');
  assert.equal(bus.snapshot().intents.length, 1);
  assert.equal(bus.snapshot().rows['planning.guard']?.length, 1);
  assert.equal(bus.snapshot().rows['execution.fact']?.length, 1);
});
test('same command retry is idempotent and reused command ID rejects changed input', async () => {
  const { bus, command } = await setup();
  const input = command('planning.goal.save', goalInput);
  const first = await bus.execute(input);
  assert.deepEqual(await bus.execute(input), first);
  assert.equal(bus.snapshot().intents.length, 1);
  await assert.rejects(bus.execute({ ...input, payload: { ...goalInput, name: 'Different' } }), /LOCAL_IDEMPOTENCY_CONFLICT/);
});
test('two independent writers reject stale generation without erasing the first writer', async () => {
  const store = new MemoryStore(), first = await setup(store), second = await setup(store, first.settings.accountId);
  await first.execute('planning.goal.save', goalInput);
  await assert.rejects(second.execute('execution.fact.save', training), /LOCAL_WRITER_CONFLICT/);
  assert.equal(store.state?.rows['planning.goal']?.length, 1);
  assert.equal(store.state?.rows['execution.fact']?.length ?? 0, 0);
});
test('fact correction keeps stable ID and original baseline, removes only current effective value', async () => {
  const { bus, execute } = await setup();
  const first = await execute<Fact>('execution.fact.save', training);
  const next = await execute<Fact>('execution.fact.save', { ...training, id: first.id, expectedVersion: first.version, businessDate: '2026-10-16' });
  assert.equal(next.id, first.id);
  assert.equal(next.baselineDateMismatch, true);
  assert.equal(next.originalDate, '2026-10-17');
  assert.equal(bus.snapshot().rows['execution.fact']?.length, 1);
  assert.ok(bus.snapshot().rows['system.revision']?.some(row => row.revisionId === first.revisionId));
  const removed = await execute<Fact>('execution.fact.save', { ...training, id: next.id, expectedVersion: next.version, remove: true });
  assert.equal(removed.status, 'REMOVED');
  assert.equal(bus.snapshot().rows['planning.guard']?.length, 2);
});
