import { copy, digest, nextVersion, requireThat } from '@evoloop/kernel';
import type { AtomicStore, State } from '@evoloop/local-runtime/ports';

interface Stored { state: State; digest: string }
export class IndexedDbStore implements AtomicStore {
  constructor(private readonly database: IDBDatabase) {}
  static async open(factory: IDBFactory, name: string): Promise<IndexedDbStore> {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('accounts');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('LOCAL_UPGRADE_BLOCKED'));
    });
    return new IndexedDbStore(database);
  }
  close(): void { this.database.close(); }
  async load(accountId: string): Promise<State | null> {
    const stored = await new Promise<Stored | undefined>((resolve, reject) => {
      const transaction = this.database.transaction('accounts', 'readonly');
      const request = transaction.objectStore('accounts').get(accountId);
      request.onsuccess = () => resolve(request.result as Stored | undefined);
      transaction.onerror = () => reject(transaction.error);
    });
    if (!stored) return null;
    requireThat(stored.state.accountId === accountId && stored.digest === digest(stored.state), 'LOCAL_STORAGE_CORRUPT');
    return copy(stored.state);
  }
  async commit(accountId: string, generation: string | null, state: State): Promise<void> {
    requireThat(accountId === state.accountId, 'ACCOUNT_MISMATCH');
    requireThat(state.generation === (generation === null ? '1' : nextVersion(generation)), 'LOCAL_GENERATION_INVALID');
    await new Promise<void>((resolve, reject) => {
      const transaction = this.database.transaction('accounts', 'readwrite', { durability: 'strict' });
      const store = transaction.objectStore('accounts'), request = store.get(accountId);
      request.onsuccess = () => {
        try {
          const stored = request.result as Stored | undefined;
          requireThat((stored?.state.generation ?? null) === generation, 'LOCAL_WRITER_CONFLICT');
          store.put({ state: copy(state), digest: digest(state) }, accountId);
        } catch (error) { transaction.abort(); reject(error); }
      };
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error ?? new Error('LOCAL_TRANSACTION_ABORTED'));
      transaction.onerror = () => reject(transaction.error);
    });
  }
}
