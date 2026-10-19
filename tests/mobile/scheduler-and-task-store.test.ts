import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { syncScheduler } from '../../apps/mobile/src/gateways/sync-scheduler.ts';
import { taskStore } from '../../apps/mobile/src/platform/database/task-store.ts';
import type { TaskSql } from '../../apps/mobile/src/platform/database/task-store.ts';
import { canonical, digest } from '@evoloop/kernel';

test('foreground scheduler debounces local changes, backs off network failures and cancels timers on lock', async () => {
  let listener = () => {},
    pending = false,
    calls = 0,
    fail = false,
    counter = 0;
  const jobs = new Map<number, { work(): void; delay: number }>();
  const session = {
    unlocked: true,
    status: () => ({ pendingCommandIds: pending ? ['synthetic'] : [], attachmentsComplete: true }),
    subscribe(next: () => void) {
      listener = next;
      return () => {
        listener = () => {};
      };
    },
    async synchronize() {
      calls++;
      if (fail) throw Error('synthetic offline');
      pending = false;
    },
  };
  const scheduler = syncScheduler(session, {
    set(work, delay) {
      const key = ++counter;
      jobs.set(key, { work, delay });
      return key;
    },
    clear(key) {
      jobs.delete(key as number);
    },
  });
  async function next() {
    const [id, job] = [...jobs][0]!;
    jobs.delete(id);
    job.work();
    await new Promise((resolve) => setImmediate(resolve));
  }
  scheduler.network(true);
  await next();
  assert.equal(calls, 1);
  pending = true;
  listener();
  listener();
  assert.equal(jobs.size, 1);
  await next();
  assert.equal(calls, 2);
  pending = true;
  fail = true;
  listener();
  await next();
  assert.equal([...jobs.values()][0]!.delay, 30000);
  session.unlocked = false;
  scheduler.stop();
  assert.equal(jobs.size, 0);
  listener();
  assert.equal(jobs.size, 0);
});

test('real SQLite technical task store preserves conflicting bookmarks and never replaces a known remote task id with null', async () => {
  const sql = new DatabaseSync(':memory:');
  const port: TaskSql = {
    async execAsync(query) {
      sql.exec(query);
    },
    async runAsync(query, parameters) {
      return sql.prepare(query).run(...parameters);
    },
    async getFirstAsync<T>(query: string, parameters: string[]) {
      return (sql.prepare(query).get(...parameters) as T | undefined) ?? null;
    },
    async getAllAsync<T>(query: string) {
      return sql.prepare(query).all() as T[];
    },
  };
  try {
    const store = await taskStore(port),
      input = canonical({ facts: [] }),
      remote = randomUUID();
    const target = {
      kind: 'review' as const,
      id: 'daily|2026-10-17',
      expectedVersion: '1',
      componentId: randomUUID(),
      input,
      inputDigest: digest(JSON.parse(input)),
    };
    const request = {
      clientRequestId: randomUUID(),
      capability: 'REVIEW' as const,
      input,
      inputDigest: target.inputDigest,
      sourceMetadata: '',
      outputSchemaVersion: 'candidate-v1' as const,
      assetIds: [],
    };
    const bookmark = { key: digest(target), request, target, taskId: remote };
    await store.put(bookmark);
    await store.put({ ...bookmark, taskId: null });
    assert.equal((await store.get(bookmark.key))!.taskId, remote);
    await store.put({ ...bookmark, request: { ...request, clientRequestId: randomUUID() }, taskId: randomUUID() });
    assert.equal((await store.all()).length, 2);
    assert.ok((await store.all()).some((value) => value.taskId === remote));
  } finally {
    sql.close();
  }
});
