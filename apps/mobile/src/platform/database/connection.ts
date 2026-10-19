import * as SQLite from 'expo-sqlite';
import { File } from 'expo-file-system';
import { requireThat } from '@evoloop/kernel';
import { SqliteStore } from '@evoloop/storage-sqlite';
import { databaseKey } from '../security/vault.ts';
import { taskStore } from './task-store.ts';
import { encryptedAssets } from '../images/encrypted-assets.ts';

export async function openDatabase(name: string) {
  const exists = new File(SQLite.defaultDatabaseDirectory, name).exists;
  const key = await databaseKey(name, exists);
  const db = await SQLite.openDatabaseAsync(name, { useNewConnection: true });
  try {
    await db.execAsync(`PRAGMA key = "x'${key}'"`);
    const cipher = await db.getFirstAsync<Record<string, string>>('PRAGMA cipher_version');
    requireThat(cipher && Object.values(cipher).some(Boolean), 'DATABASE_ENCRYPTION_UNAVAILABLE');
    await db.execAsync('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
    const port = {
      async execute(sql: string, parameters: readonly (string | null)[]) {
        await db.runAsync(sql, [...parameters]);
      },
      one(sql: string, parameters: readonly string[]) {
        return db.getFirstAsync<Record<string, string>>(sql, [...parameters]);
      },
      async transaction<T>(work: () => Promise<T>): Promise<T> {
        // One private connection, only the serialized CommandBus accesses it. SQLCipher key stays on that connection.
        await db.execAsync('BEGIN IMMEDIATE');
        try {
          const result = await work();
          await db.execAsync('COMMIT');
          return result;
        } catch (error) {
          await db.execAsync('ROLLBACK');
          throw error;
        }
      },
    };
    const store = new SqliteStore(port);
    await store.initialize();
    return { store, tasks: await taskStore(db), assets: encryptedAssets(name, key), close: () => db.closeAsync() };
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}
