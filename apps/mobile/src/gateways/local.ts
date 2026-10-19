import { CommandBus, syncOnce, syncStatus } from '@evoloop/local-runtime';
import { businessDate } from '@evoloop/kernel';
import type { Json } from '@evoloop/kernel';
import { todayWorkspace } from '@evoloop/client-business-core/workspace';
import { goals, weeks } from '@evoloop/client-business-core/planning';
import { reviewDocuments } from '@evoloop/client-business-core/review';
import type { Identity } from './session-identity.ts';
import { HttpClient } from '../platform/network/http.ts';
import { syncTransport } from './sync-transport.ts';
import type { TaskStore } from './ports.ts';
import type { AssetStore } from './assets.ts';
import { synchronizeAttachments } from './sync-attachments.ts';
import { refreshIdentity } from './identity.ts';

export class LocalGateway {
  private listeners = new Set<() => void>();
  private revision = 0;
  private syncing: Promise<void> | null = null;
  syncError = '';
  unlocked = true;
  constructor(
    readonly bus: CommandBus,
    public identity: Identity,
    readonly http: HttpClient,
    readonly tasks: TaskStore,
    readonly assets: AssetStore,
    private readonly persistIdentity: (identity: Identity) => Promise<void>,
  ) {}
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  version = () => this.revision;
  async idle() {
    await this.syncing?.catch(() => undefined);
  }
  changed() {
    this.revision++;
    this.listeners.forEach((listener) => listener());
  }
  today(day = businessDate(new Date().toISOString())) {
    return todayWorkspace(this.bus.transaction(), day);
  }
  plans() {
    const tx = this.bus.transaction();
    return { goals: goals(tx), weeks: weeks(tx) };
  }
  reviews() {
    return reviewDocuments(this.bus.transaction());
  }
  status() {
    const status = syncStatus(this.bus);
    return {
      ...status,
      requiresAttention:
        status.conflictBatchIds.length > 0 || BigInt(status.pulledSequence) > BigInt(status.headVersion),
    };
  }
  async command(type: string, payload: Json, commandId: string, occurredAt: string): Promise<Json> {
    const result = await this.bus.execute({
      commandId,
      commandType: type,
      commandVersion: '1',
      accountId: this.identity.accountId,
      occurredAt,
      expectedVersions: {},
      dependencies: [],
      payload,
    });
    this.changed();
    return result;
  }
  synchronize(): Promise<void> {
    if (this.syncing) return this.syncing;
    this.syncing = this.runSync().finally(() => {
      this.syncing = null;
      this.changed();
    });
    return this.syncing;
  }
  private async runSync() {
    try {
      this.syncError = '';
      const current = await refreshIdentity(this.http, this.identity);
      await this.persistIdentity(current);
      this.identity = current;
      // Authorization is checked by the cloud on each call; offline local facts never wait for it.
      for (let count = 0; count < 20; count++) {
        const result = await syncOnce(this.bus, syncTransport(this.http));
        this.changed();
        if (result !== 'LOCAL_PENDING' || !this.unlocked) break;
      }
      await synchronizeAttachments(this);
    } catch (error) {
      this.syncError = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }
}
