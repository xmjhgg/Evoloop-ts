import type { CommandBus } from '../commands/command-bus.ts';
import type { SyncTransport } from '../ports/public.ts';
import { prepareBatch, acknowledge } from './upload.ts';
import { importEnvelopes } from './pull.ts';
import { needsUpload } from '../changes/intents.ts';
import { importSnapshot } from './snapshots.ts';
import { digest, requireThat } from '@evoloop/kernel';

async function pullCurrent(bus: CommandBus, transport: SyncTransport): Promise<'APPLIED' | 'CONFLICT' | 'REMOTE_PENDING'> {
  let conflict = false;
  for (let page = 0; page < 100; page++) {
    const before = bus.snapshot().pulledSequence, incoming = await transport.pull(before);
    requireThat(incoming.envelopes.length > 0 || BigInt(incoming.headVersion) === BigInt(before), 'SYNC_SEQUENCE_GAP');
    if (await importEnvelopes(bus, incoming.envelopes, incoming.headVersion) === 'NEEDS_RECONCILIATION') conflict = true;
    if (BigInt(bus.snapshot().pulledSequence) >= BigInt(incoming.headVersion)) return conflict ? 'CONFLICT' : 'APPLIED';
  }
  return 'REMOTE_PENDING';
}

/** Network calls never execute within a local storage transaction. */
export async function syncOnce(bus: CommandBus, transport: SyncTransport): Promise<'SYNCED' | 'LOCAL_PENDING' | 'REMOTE_PENDING' | 'CONFLICT'> {
  const capabilities = await transport.capabilities(), current = bus.snapshot();
  let snapshotConflict = false;
  if (!current.baselineSnapshotId && current.pulledSequence === '0' && capabilities.snapshotId) {
    const snapshot = await transport.snapshot(capabilities.snapshotId);
    snapshotConflict = await importSnapshot(bus, snapshot, digest(current)) === 'NEEDS_RECONCILIATION';
  }
  const pulled = await pullCurrent(bus, transport);
  if (pulled === 'REMOTE_PENDING') return pulled;
  if (snapshotConflict || pulled === 'CONFLICT') return 'CONFLICT';
  const batch = await prepareBatch(bus);
  if (!batch) return 'SYNCED';
  const receipt = await transport.upload(batch);
  await acknowledge(bus, receipt);
  const outcome = await pullCurrent(bus, transport);
  if (receipt.status !== 'STORED' || outcome === 'CONFLICT') return 'CONFLICT';
  if (outcome === 'REMOTE_PENDING') return outcome;
  return bus.snapshot().intents.some(needsUpload) ? 'LOCAL_PENDING' : 'SYNCED';
}
export function syncStatus(bus: CommandBus) {
  const state = bus.snapshot();
  return { locallySaved: true, structuredDataCloudSaved: !state.intents.some(needsUpload),
    attachmentsComplete: state.attachments.every(attachment => attachment.complete),
    preservedBranchesWithPendingIntents: state.branches.filter(branch => branch.intents.some(needsUpload)).map(branch => branch.id),
    pendingCommandIds: state.intents.filter(needsUpload).map(intent => intent.command.commandId),
    conflictBatchIds: state.batches.filter(entry => entry.receipt && entry.receipt.status !== 'STORED').map(entry => entry.batch.batchId),
    headVersion: state.headVersion, pulledSequence: state.pulledSequence };
}
