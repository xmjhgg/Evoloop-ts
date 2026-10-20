import { businessDate, canonical, copy, digest, nextVersion, requireThat } from '@evoloop/kernel';
import type { Json } from '@evoloop/kernel';
import { commandSchema, commandRegistry } from '@evoloop/client-business-core/commands';
import type { ExecutionContext, LocalCommand } from '@evoloop/client-business-core/ports';
import { hasActual, hasMealActual } from '@evoloop/client-business-core/execution';
import { deriveReviews, invalidateStale, verifyAdjustmentBasis } from '@evoloop/client-business-core/review';
import type { PlanningCollaborators } from '@evoloop/client-business-core/planning';
import type { AtomicStore, State } from '../ports/public.ts';
import { LocalTransaction } from './transaction.ts';
import { derivedId } from './id.ts';
import { validateRows } from '../changes/validate.ts';
import { diffRows } from '../changes/diff.ts';
import { validateBusiness } from '../changes/validate-business.ts';
import { validateState } from '../changes/state-schema.ts';

export interface RuntimeSettings {
  readonly accountId: string;
  readonly deviceId: string;
  access(): { unlocked: boolean; healthAllowed: boolean; aiAllowed: boolean; rulesVersion: string };
  now(): string;
  readonly fitnessPolicy: PlanningCollaborators['fitnessPolicy'];
}
export class CommandBus {
  private queue: Promise<unknown> = Promise.resolve();
  private state: State | null = null;
  constructor(readonly store: AtomicStore, readonly settings: RuntimeSettings) {}
  serial<T>(work: () => Promise<T>): Promise<T> {
    const promise = this.queue.then(work);
    this.queue = promise.catch(() => undefined);
    return promise;
  }
  async open(): Promise<void> {
    await this.serial(async () => {
      requireThat(this.settings.access().unlocked, 'LOCAL_LOCKED');
      this.state = await this.store.load(this.settings.accountId);
      if (!this.state) {
        const initial: State = { formatVersion: '1', accountId: this.settings.accountId, deviceId: this.settings.deviceId,
          generation: '1', headVersion: '0', pulledSequence: '0', baselineSequence: '0', baselineRows: {}, baselineSnapshotId: null, rows: {}, intents: [], batches: [], remote: [], branches: [], attachments: [] };
        validateState(initial);
        await this.store.commit(initial.accountId, null, initial);
        this.state = initial;
      }
      requireThat(this.state.accountId === this.settings.accountId && this.state.formatVersion === '1', 'LOCAL_FORMAT_UNSUPPORTED');
      validateState(this.state);
      validateRows(this.state.rows, this.state.accountId);
      validateBusiness(this.transaction(), this.settings.now());
    });
  }
  snapshot(): State {
    requireThat(this.state, 'LOCAL_NOT_OPEN');
    requireThat(this.settings.access().unlocked, 'LOCAL_LOCKED');
    return copy(this.state);
  }
  transaction(): LocalTransaction {
    const state = this.snapshot();
    return new LocalTransaction(state.accountId, state.rows, label => derivedId(state.generation, label));
  }
  async persist(next: State): Promise<void> {
    const previous = this.snapshot();
    requireThat(next.accountId === previous.accountId, 'ACCOUNT_MISMATCH');
    const committed = { ...next, generation: nextVersion(previous.generation) };
    validateState(committed);
    await this.store.commit(previous.accountId, previous.generation, committed);
    this.state = copy(committed);
  }
  async reload(): Promise<void> {
    await this.serial(async () => {
      const state = await this.store.load(this.settings.accountId);
      requireThat(state && state.accountId === this.settings.accountId, 'LOCAL_NOT_OPEN');
      this.state = state;
    });
  }
  execute(input: LocalCommand): Promise<Json> {
    return this.serial(async () => {
      commandSchema.parse(input);
      canonical(input);
      const state = this.snapshot();
      requireThat(input.accountId === state.accountId, 'ACCOUNT_MISMATCH');
      const inputDigest = digest(input), previous = state.intents.find(intent => intent.command.commandId === input.commandId);
      if (previous) {
        requireThat(previous.inputDigest === inputDigest, 'LOCAL_IDEMPOTENCY_CONFLICT');
        return previous.result;
      }
      requireThat(input.dependencies.every(id => state.intents.some(intent => intent.command.commandId === id)), 'LOCAL_DEPENDENCY_MISSING');
      requireThat(input.commandVersion === '1', 'LOCAL_COMMAND_VERSION_UNSUPPORTED');
      businessDate(input.occurredAt);
      requireThat(input.occurredAt <= this.settings.now(), 'FUTURE_COMMAND');
      const access = this.settings.access();
      const context: ExecutionContext = { ...access, accountId: state.accountId, now: input.occurredAt, commandId: input.commandId, id: label => derivedId(input.commandId, label) };
      const tx = new LocalTransaction(state.accountId, state.rows, context.id);
      for (const [key, version] of Object.entries(input.expectedVersions)) {
        const separator = key.indexOf('|');
        requireThat(separator > 0, 'EXPECTED_VERSION_KEY_INVALID');
        const collection = key.slice(0, separator), id = key.slice(separator + 1);
        const row = state.rows[collection as keyof State['rows']]?.find(value => value.id === id);
        requireThat((row?.version ?? '0') === version, 'VERSION_CONFLICT');
      }
      const ports: PlanningCollaborators = { hasActual, hasMealActual, verifyAdjustmentBasis, fitnessPolicy: this.settings.fitnessPolicy };
      const handler = commandRegistry(ports)[input.commandType];
      requireThat(handler, 'LOCAL_COMMAND_UNSUPPORTED');
      const result = handler(tx, context, input);
      invalidateStale(tx, context);
      deriveReviews(tx, context, [...tx.changedTokens], input.commandType);
      validateRows(tx.rows, state.accountId);
      validateBusiness(tx, this.settings.now());
      const changes = diffRows(state.rows, tx.rows);
      const next: State = { ...state, rows: tx.rows, intents: [...state.intents, { command: input, inputDigest, result, changes, status: changes.length ? 'PENDING' : 'LOCAL_ONLY' }] };
      await this.persist(next);
      return copy(result);
    });
  }
}
