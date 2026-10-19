import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { IDBFactory } from 'fake-indexeddb';
import { IndexedDbStore } from '@evoloop/storage-indexeddb';
import { JournalStore } from '@evoloop/storage-journal';
import { CommandBus } from '@evoloop/local-runtime';
import { canonical, digest } from '@evoloop/kernel';
import { setup, goalInput, training } from '../fixtures/local.ts';
import { sqliteStore, journalStore, journalFiles } from '../fixtures/stores.ts';

test('identical commands produce identical durable business rows in real SQLite/files and IndexedDB emulator', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'evoloop-two-storage-'));
  const sqlite = await sqliteStore(directory), journal = journalStore(directory);
  const indexed = await IndexedDbStore.open(new IDBFactory(), 'storage-contract');
  const accountId = randomUUID(), runtimes = await Promise.all([sqlite.store, journal, indexed].map(store => setup(store, accountId)));
  const commands = [runtimes[0]!.command('planning.goal.save', goalInput), runtimes[0]!.command('execution.fact.save', training)];
  for (const runtime of runtimes) for (const command of commands) await runtime.bus.execute(command);
  const expected = canonical(runtimes[0]!.bus.snapshot().rows);
  for (const runtime of runtimes) {
    assert.equal(canonical(runtime.bus.snapshot().rows), expected);
    const restarted = new CommandBus(runtime.store, runtime.settings);
    await restarted.open();
    assert.equal(canonical(restarted.snapshot().rows), expected);
    assert.equal(restarted.snapshot().intents.length, 2);
    assert.deepEqual(await restarted.execute(commands[1]!), runtime.bus.snapshot().intents[1]!.result);
  }
  indexed.close(); sqlite.close();
});
test('file-log crash between immutable segment and commit marker exposes the complete previous state', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'evoloop-two-crash-'));
  const files = journalFiles(directory), runtime = await setup(new JournalStore(files));
  const before = digest(runtime.bus.snapshot()), original = files.durableReplace;
  files.durableReplace = async (name, body) => { if (name.endsWith('.head')) throw new Error('INJECTED_CRASH'); await original(name, body); };
  await assert.rejects(runtime.execute('execution.fact.save', training), /INJECTED_CRASH/);
  files.durableReplace = original;
  const restarted = new CommandBus(new JournalStore(files), runtime.settings);
  await restarted.open();
  assert.equal(digest(restarted.snapshot()), before);
  await restarted.execute(runtime.command('execution.fact.save', training));
  assert.equal(restarted.snapshot().rows['execution.fact']?.length, 1);
});
