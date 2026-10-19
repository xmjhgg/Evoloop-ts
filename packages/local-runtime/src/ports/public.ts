import type { Row, TableName, Change } from '@evoloop/data-schema/replication';
import type { Json } from '@evoloop/kernel';
import type { LocalCommand } from '@evoloop/client-business-core/ports';
import type { SyncBatch, SyncReceipt, Envelope, Capabilities, Snapshot } from '@evoloop/contracts';

export interface Intent {
  readonly command: LocalCommand;
  readonly inputDigest: string;
  readonly result: Json;
  readonly changes: readonly Change[];
  readonly status: 'PENDING' | 'STORED' | 'CONFLICT' | 'LOCAL_ONLY';
}
export interface State {
  readonly formatVersion: '1';
  readonly accountId: string;
  readonly deviceId: string;
  readonly generation: string;
  readonly headVersion: string;
  readonly pulledSequence: string;
  readonly baselineSequence: string;
  readonly baselineRows: State['rows'];
  readonly baselineSnapshotId: string | null;
  readonly rows: Readonly<Partial<Record<TableName, readonly Row[]>>>;
  readonly intents: readonly Intent[];
  readonly batches: readonly { batch: SyncBatch; commandIds: readonly string[]; receipt: SyncReceipt | null }[];
  readonly remote: readonly Envelope[];
  readonly branches: readonly { id: string; rows: State['rows']; intents: readonly Intent[]; batches: State['batches']; headVersion: string }[];
  readonly attachments: readonly { id: string; digest: string; complete: boolean }[];
}
export interface AtomicStore {
  load(accountId: string): Promise<State | null>;
  /** Atomic compare-and-swap across all writers. Reject stale generations; never silently overwrite. */
  commit(accountId: string, expectedGeneration: string | null, state: State): Promise<void>;
}
export interface SyncTransport {
  capabilities(): Promise<Capabilities>;
  snapshot(id: string): Promise<Snapshot>;
  upload(batch: SyncBatch): Promise<SyncReceipt>;
  pull(afterSequence: string): Promise<{ envelopes: readonly Envelope[]; headVersion: string }>;
}
export interface CryptoPort {
  seal(plaintext: string, password: string): Promise<string>;
  open(ciphertext: string, password: string): Promise<string>;
}
