import { randomUUID } from 'node:crypto';
import { copy, requireThat } from '@evoloop/kernel';
import type { Json } from '@evoloop/kernel';
import { CommandBus } from '@evoloop/local-runtime';
import type { AtomicStore, State } from '@evoloop/local-runtime/ports';
import type { LocalCommand } from '@evoloop/client-business-core/ports';

export class MemoryStore implements AtomicStore {
  state: State | null = null;
  fail = false;
  async load(accountId: string): Promise<State | null> {
    requireThat(!this.state || this.state.accountId === accountId, 'ACCOUNT_MISMATCH');
    return copy(this.state);
  }
  async commit(accountId: string, expected: string | null, next: State): Promise<void> {
    requireThat(!this.fail, 'DISK_FULL');
    requireThat((this.state?.generation ?? null) === expected, 'LOCAL_WRITER_CONFLICT');
    this.state = copy(next);
  }
}
export const fixedNow = '2026-10-17T12:00:00.000Z';
export async function setup(store: AtomicStore = new MemoryStore(), accountId: string = randomUUID()) {
  const settings = { accountId, deviceId: randomUUID(), now: () => fixedNow,
    access: () => ({ unlocked: true, healthAllowed: true, aiAllowed: true, rulesVersion: 'unapproved-v1' }),
    fitnessPolicy: () => 'INFORMATION_REQUIRED' as const };
  const bus = new CommandBus(store, settings);
  await bus.open();
  function command(type: string, payload: unknown, commandId = randomUUID()): LocalCommand {
    return { commandId, commandType: type, commandVersion: '1', accountId, occurredAt: fixedNow,
      expectedVersions: {}, dependencies: [], payload: payload as Json };
  }
  async function execute<T>(type: string, payload: unknown): Promise<T> {
    return await bus.execute(command(type, payload)) as T;
  }
  return { bus, store, settings, command, execute };
}
export const goalInput = { id: null, expectedVersion: '0', category: 'LEARNING', name: 'Read', description: 'Read book',
  measure: 'pages', startDate: '2026-10-17', endDate: '2026-12-31' };
export const prescription = { title: 'Read chapter', startAt: '2026-10-19T12:00:00.000Z', minutes: '30',
  actions: [], learning: { topic: 'Types', unit: 'PAGE', quantity: '10', outcome: 'Notes' }, nutrition: null };
export const training = { id: null, expectedVersion: '0', businessDate: '2026-10-17', planItemIds: [], remove: false,
  data: { kind: 'TRAINING', status: 'PARTIAL', durationMinutes: '30.125', feeling: 'OK', actions: [] } };
