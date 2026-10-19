import { canonical, digest, nextVersion, requireThat } from '@evoloop/kernel';
import type { AtomicStore, State } from '@evoloop/local-runtime/ports';

export interface JournalFiles {
  read(name: string): Promise<string | null>;
  /** Write a temporary file, flush contents, then atomically rename; do not swallow quota/I/O failures. */
  durableReplace(name: string, body: string): Promise<void>;
  /** Cross-instance/process writer coordination, not an instance-local Promise queue. */
  withLock<T>(accountId: string, work: () => Promise<T>): Promise<T>;
}
interface Head { generation: string; digest: string }
export class JournalStore implements AtomicStore {
  constructor(private readonly files: JournalFiles) {}
  private key(accountId: string): string {
    requireThat(/^[0-9a-f-]{36}$/.test(accountId), 'INVALID_ACCOUNT_ID');
    return accountId;
  }
  async load(accountId: string): Promise<State | null> {
    const key = this.key(accountId), text = await this.files.read(key + '.head');
    if (!text) return null;
    const head = JSON.parse(text) as Head;
    requireThat(/^[1-9]\d*$/.test(head.generation), 'LOCAL_STORAGE_CORRUPT');
    const segment = await this.files.read(key + '.' + head.generation + '.' + head.digest + '.segment');
    requireThat(segment, 'LOCAL_STORAGE_CORRUPT');
    const state = JSON.parse(segment) as State;
    requireThat(digest(state) === head.digest && state.generation === head.generation && state.accountId === accountId, 'LOCAL_STORAGE_CORRUPT');
    return state;
  }
  async commit(accountId: string, expectedGeneration: string | null, state: State): Promise<void> {
    const key = this.key(accountId);
    requireThat(state.accountId === accountId, 'ACCOUNT_MISMATCH');
    requireThat(state.generation === (expectedGeneration === null ? '1' : nextVersion(expectedGeneration)), 'LOCAL_GENERATION_INVALID');
    await this.files.withLock(accountId, async () => {
      const previous = await this.load(accountId);
      requireThat((previous?.generation ?? null) === expectedGeneration, 'LOCAL_WRITER_CONFLICT');
      const head = { generation: state.generation, digest: digest(state) };
      await this.files.durableReplace(key + '.' + head.generation + '.' + head.digest + '.segment', canonical(state));
      await this.files.durableReplace(key + '.head', canonical(head));
    });
  }
}
