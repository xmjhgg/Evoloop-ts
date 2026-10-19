import { copy, digest, requireThat } from '@evoloop/kernel';
import { CommandBus } from '../commands/command-bus.ts';
import { cloudRows } from '../sync/baseline.ts';
import type { AtomicStore, State } from '../ports/public.ts';
import { needsUpload } from '../changes/intents.ts';

class TemporaryView implements AtomicStore {
  constructor(private state: State) {}
  async load(): Promise<State> { return copy(this.state); }
  async commit(_accountId: string, generation: string | null, state: State): Promise<void> {
    requireThat(this.state.generation === generation, 'LOCAL_WRITER_CONFLICT');
    this.state = copy(state);
  }
}
export async function reconcile(bus: CommandBus, choice: 'REPLAY' | 'ADOPT_CLOUD', expectedDigest: string): Promise<void> {
  const before = bus.snapshot();
  requireThat(digest(before) === expectedDigest, 'RECONCILIATION_STALE');
  const cloud: State = { ...before, generation: '1', rows: cloudRows(before), headVersion: before.pulledSequence,
    batches: [], intents: before.intents.filter(intent => !needsUpload(intent)) };
  const temporary = new CommandBus(new TemporaryView(cloud), bus.settings);
  await temporary.open();
  if (choice === 'REPLAY') {
    for (const intent of before.intents.filter(needsUpload)) {
      const type = intent.command.commandType;
      requireThat(!type.includes('publish') && !type.includes('confirm') && !type.includes('adjustment.submit') && !(intent.command.payload as Record<string, unknown> | null)?.['manualFinal'], 'REPLAY_REQUIRES_CONFIRMATION');
      const replayed = await temporary.execute(intent.command);
      requireThat(digest(replayed) === digest(intent.result), 'REPLAY_SEMANTIC_CONFLICT');
    }
  }
  const rebased = temporary.snapshot();
  await bus.serial(async () => {
    const current = bus.snapshot();
    requireThat(digest(current) === expectedDigest, 'RECONCILIATION_STALE');
    await bus.persist({ ...rebased, branches: [...current.branches, { id: 'before-reconcile:' + current.generation,
      rows: current.rows, intents: current.intents, batches: current.batches, headVersion: current.headVersion }] });
  });
}
