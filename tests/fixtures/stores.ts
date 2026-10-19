import { DatabaseSync } from 'node:sqlite';
import { mkdir, readFile, rename, open, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { SqliteStore } from '@evoloop/storage-sqlite';
import { JournalStore } from '@evoloop/storage-journal';
import type { JournalFiles } from '@evoloop/storage-journal';

export async function sqliteStore(directory: string) {
  const database = new DatabaseSync(join(directory, 'local.sqlite'));
  database.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;');
  const store = new SqliteStore({
    async execute(sql, parameters) { database.prepare(sql).run(...parameters); },
    async one(sql, parameters) { return database.prepare(sql).get(...parameters) as Record<string, string> | undefined ?? null; },
    async transaction(work) {
      database.exec('BEGIN IMMEDIATE');
      try { const result = await work(); database.exec('COMMIT'); return result; }
      catch (error) { database.exec('ROLLBACK'); throw error; }
    },
  });
  await store.initialize();
  return { store, close: () => database.close() };
}
export function journalFiles(directory: string): JournalFiles {
  return {
    async read(name) {
      try { return await readFile(join(directory, name), 'utf8'); }
      catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
    },
    async durableReplace(name, body) {
      const temporary = join(directory, name + '.' + randomUUID() + '.tmp');
      const file = await open(temporary, 'wx');
      try { await file.writeFile(body, 'utf8'); await file.sync(); } finally { await file.close(); }
      await rename(temporary, join(directory, name));
    },
    async withLock(accountId, work) {
      const lock = join(directory, accountId + '.lock');
      let locked = false;
      for (let attempt = 0; attempt < 100 && !locked; attempt++) {
        try { await mkdir(lock); locked = true; }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; await setTimeout(5); }
      }
      if (!locked) throw new Error('LOCAL_WRITER_BUSY');
      try { return await work(); } finally { await rm(lock, { recursive: true }); }
    },
  };
}
export function journalStore(directory: string) { return new JournalStore(journalFiles(directory)); }
