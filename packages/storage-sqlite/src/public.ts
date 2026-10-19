import { canonical, digest, nextVersion, requireThat } from '@evoloop/kernel';
import type { AtomicStore, State } from '@evoloop/local-runtime/ports';

export interface SqlitePort {
  execute(sql: string, parameters: readonly (string | null)[]): Promise<void>;
  one(sql: string, parameters: readonly string[]): Promise<Record<string, string> | null>;
  /** Must serialize the callback on the same connection using BEGIN IMMEDIATE. */
  transaction<T>(work: () => Promise<T>): Promise<T>;
}
/** Same adapter accepts a platform SQLCipher connection. This class never owns encryption keys. */
export class SqliteStore implements AtomicStore {
  constructor(private readonly sql: SqlitePort) {}
  async initialize(): Promise<void> {
    await this.sql.execute('CREATE TABLE IF NOT EXISTS local_state (account_id TEXT PRIMARY KEY, generation TEXT NOT NULL, digest TEXT NOT NULL, body TEXT NOT NULL)', []);
  }
  async load(accountId: string): Promise<State | null> {
    const row = await this.sql.one('SELECT body, digest FROM local_state WHERE account_id = ?', [accountId]);
    if (!row) return null;
    const state = JSON.parse(row['body']!) as State;
    requireThat(digest(state) === row['digest'] && state.accountId === accountId, 'LOCAL_STORAGE_CORRUPT');
    return state;
  }
  async commit(accountId: string, generation: string | null, state: State): Promise<void> {
    requireThat(state.accountId === accountId, 'ACCOUNT_MISMATCH');
    requireThat(state.generation === (generation === null ? '1' : nextVersion(generation)), 'LOCAL_GENERATION_INVALID');
    await this.sql.transaction(async () => {
      const row = await this.sql.one('SELECT generation FROM local_state WHERE account_id = ?', [accountId]);
      requireThat((row?.['generation'] ?? null) === generation, 'LOCAL_WRITER_CONFLICT');
      await this.sql.execute('INSERT INTO local_state (account_id, generation, digest, body) VALUES (?, ?, ?, ?) ON CONFLICT(account_id) DO UPDATE SET generation = excluded.generation, digest = excluded.digest, body = excluded.body',
        [accountId, state.generation, digest(state), canonical(state)]);
    });
  }
}
