import { canonical, digest, requireThat, utf8Length } from '@evoloop/kernel';
import { batchSchema, receiptSchema } from '@evoloop/contracts';
import type { SyncBatch, SyncReceipt } from '@evoloop/contracts';
import type { CommandBus } from '../commands/command-bus.ts';
import { derivedId } from '../commands/id.ts';
import { diffRows } from '../changes/diff.ts';
import { cloudRows } from './baseline.ts';
import { applyRows } from '../changes/apply.ts';
import type { Intent } from '../ports/public.ts';
export async function prepareBatch(bus: CommandBus, limits = { maxChanges: 2000, maxBytes: 8388608 }): Promise<SyncBatch | null> {
  return bus.serial(async () => {
    const state = bus.snapshot();
    const pending = state.batches.find(entry => entry.receipt === null);
    if (pending) return pending.batch;
    requireThat(!state.batches.some(entry => entry.receipt?.status !== 'STORED'), 'SYNC_RECONCILIATION_REQUIRED');
    const intents = state.intents.filter(intent => intent.status === 'PENDING');
    if (!intents.length) return null;
    requireThat(BigInt(state.pulledSequence) <= BigInt(state.headVersion), 'SYNC_RECONCILIATION_REQUIRED');
    const baseline = cloudRows(state, true);
    const selected: Intent[] = [];
    let projected = baseline, batch: SyncBatch | null = null;
    for (const intent of intents) {
      const next = applyRows(projected, intent.changes), changes = diffRows(baseline, next);
      const content = { protocolVersion: '1' as const, batchId: derivedId(state.deviceId, 'batch:' + state.generation), deviceId: state.deviceId,
        expectedHeadVersion: state.headVersion, payloadSchemaVersion: 'documents-v1' as const, changes };
      const candidate = { ...content, payloadDigest: digest(content) };
      const bytes = utf8Length(canonical(candidate));
      if (changes.length > Math.min(2000, limits.maxChanges) || bytes > Math.min(8388608, limits.maxBytes)) break;
      selected.push(intent); projected = next; batch = batchSchema.parse(candidate);
    }
    requireThat(batch && selected.length, 'SYNC_BATCH_TOO_LARGE');
    await bus.persist({ ...state, batches: [...state.batches, { batch, commandIds: selected.map(intent => intent.command.commandId), receipt: null }] });
    return batch;
  });
}
export async function acknowledge(bus: CommandBus, receiptInput: SyncReceipt): Promise<void> {
  await bus.serial(async () => {
    const receipt = receiptSchema.parse(receiptInput), state = bus.snapshot();
    const entry = state.batches.find(value => value.batch.batchId === receipt.batchId);
    requireThat(entry && entry.batch.payloadDigest === receipt.inputDigest, 'SYNC_RECEIPT_MISMATCH');
    if (entry.receipt) {
      requireThat(digest(entry.receipt) === digest(receipt), 'SYNC_RECEIPT_MISMATCH');
      return;
    }
    requireThat(receipt.status !== 'STORED' || receipt.serverSequence === (BigInt(entry.batch.expectedHeadVersion) + 1n).toString(), 'SYNC_SEQUENCE_GAP');
    await bus.persist({ ...state, headVersion: receipt.status === 'STORED' ? receipt.serverSequence! : state.headVersion,
      intents: state.intents.map(intent => entry.commandIds.includes(intent.command.commandId) ? { ...intent, status: receipt.status === 'STORED' ? 'STORED' : 'CONFLICT' } : intent),
      batches: state.batches.map(value => value === entry ? { ...value, receipt } : value) });
  });
}
