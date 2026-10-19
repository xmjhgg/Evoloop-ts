import { digest, requireThat } from '@evoloop/kernel';
import { envelopeSchema } from '@evoloop/contracts';
import type { Envelope } from '@evoloop/contracts';
import type { CommandBus } from '../commands/command-bus.ts';
import { LocalTransaction } from '../commands/transaction.ts';
import { derivedId } from '../commands/id.ts';
import { validateRows } from '../changes/validate.ts';
import { validateBusiness } from '../changes/validate-business.ts';
import { cloudRows } from './baseline.ts';
import type { State } from '../ports/public.ts';
import { needsUpload } from '../changes/intents.ts';

export async function importEnvelopes(bus: CommandBus, inputs: readonly Envelope[], headVersion: string): Promise<'APPLIED' | 'NEEDS_RECONCILIATION'> {
  return bus.serial(async () => {
    const state = bus.snapshot(), remote = [...state.remote];
    let sequence = state.pulledSequence;
    for (const input of inputs) {
      const envelope = envelopeSchema.parse(input), { payloadDigest, ...content } = envelope.batch;
      requireThat(digest(content) === payloadDigest, 'DIGEST_MISMATCH');
      requireThat(envelope.batch.changes.every(change => [change.before, change.after].every(row => !row || row.accountId === state.accountId)), 'OWNER_MISMATCH');
      const previous = remote.find(value => value.serverSequence === envelope.serverSequence);
      if (previous) { requireThat(digest(previous) === digest(envelope), 'SYNC_SEQUENCE_REUSED'); continue; }
      requireThat(BigInt(envelope.serverSequence) === BigInt(sequence) + 1n, 'SYNC_SEQUENCE_GAP');
      remote.push(envelope); sequence = envelope.serverSequence;
    }
    requireThat(/^(0|[1-9]\d*)$/.test(headVersion) && BigInt(headVersion) >= BigInt(sequence), 'SYNC_HEAD_INVALID');
    const batches = state.batches.map(entry => {
      const echo = remote.find(envelope => envelope.batch.batchId === entry.batch.batchId);
      if (!echo || entry.receipt) return entry;
      requireThat(digest(echo.batch) === digest(entry.batch), 'SYNC_ECHO_MISMATCH');
      return { ...entry, receipt: { batchId: entry.batch.batchId, inputDigest: entry.batch.payloadDigest, status: 'STORED' as const,
        serverSequence: echo.serverSequence, currentHeadVersion: echo.serverSequence, code: null } };
    });
    const storedIds = new Set(batches.filter(entry => entry.receipt?.status === 'STORED').flatMap(entry => entry.commandIds));
    const intents = state.intents.map(intent => storedIds.has(intent.command.commandId) ? { ...intent, status: 'STORED' as const } : intent);
    const next = { ...state, remote, pulledSequence: sequence, batches, intents };
    const rows = cloudRows(next);
    validateRows(rows, state.accountId);
    validateBusiness(new LocalTransaction(state.accountId, rows, label => derivedId(state.generation, label)), bus.settings.now());
    const pending = intents.some(needsUpload);
    const hasForeign = remote.filter(envelope => BigInt(envelope.serverSequence) > BigInt(state.pulledSequence)).some(envelope => !batches.some(entry => entry.batch.batchId === envelope.batch.batchId));
    if (pending && (hasForeign || BigInt(state.pulledSequence) > BigInt(state.headVersion))) {
      const branch: State['branches'][number] = { id: 'before-pull:' + state.generation, rows: state.rows, intents: state.intents, batches: state.batches, headVersion: state.headVersion };
      await bus.persist({ ...next, branches: BigInt(state.pulledSequence) > BigInt(state.headVersion) ? state.branches : [...state.branches, branch] });
      return 'NEEDS_RECONCILIATION';
    }
    await bus.persist(pending ? { ...next, headVersion: sequence } : { ...next, rows, headVersion: sequence });
    return 'APPLIED';
  });
}
