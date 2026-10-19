import { canonical, digest, requireThat } from '@evoloop/kernel';
import { snapshotSchema } from '@evoloop/contracts';
import type { Snapshot } from '@evoloop/contracts';
import type { CommandBus } from '../commands/command-bus.ts';
import type { State } from '../ports/public.ts';
import { validateRows } from '../changes/validate.ts';
import { validateBusiness } from '../changes/validate-business.ts';
import { LocalTransaction } from '../commands/transaction.ts';
import { derivedId } from '../commands/id.ts';
import { needsUpload } from '../changes/intents.ts';

export function createSnapshot(bus: CommandBus, snapshotId: string): Snapshot {
  const state = bus.snapshot();
  requireThat(!state.intents.some(needsUpload) && state.batches.every(entry => entry.receipt?.status === 'STORED'), 'SNAPSHOT_PENDING_CHANGES');
  requireThat(state.headVersion === state.pulledSequence, 'SNAPSHOT_NOT_CAUGHT_UP');
  const data = canonical({ accountId: state.accountId, rows: state.rows });
  return snapshotSchema.parse({ snapshotId, baseSequence: state.headVersion, payloadSchemaVersion: 'documents-v1',
    chunks: [{ index: '0', data, digest: digest(JSON.parse(data)) }], attachments: state.attachments });
}
export async function importSnapshot(bus: CommandBus, input: Snapshot, expectedDigest: string): Promise<'APPLIED' | 'NEEDS_RECONCILIATION'> {
  const manifest = snapshotSchema.parse(input);
  requireThat(manifest.chunks.length === 1 && manifest.chunks[0]?.index === '0', 'SNAPSHOT_LAYOUT_UNSUPPORTED');
  const chunk = manifest.chunks[0]!;
  const content = JSON.parse(chunk.data) as { accountId: string; rows: State['rows'] };
  requireThat(digest(content) === chunk.digest, 'DIGEST_MISMATCH');
  return bus.serial(async () => {
    const current = bus.snapshot();
    requireThat(digest(current) === expectedDigest, 'RESTORE_STALE');
    requireThat(content.accountId === current.accountId && BigInt(manifest.baseSequence) >= BigInt(current.pulledSequence), 'SNAPSHOT_BASELINE_INVALID');
    const pending = current.intents.some(needsUpload);
    validateRows(content.rows, current.accountId);
    validateBusiness(new LocalTransaction(current.accountId, content.rows, label => derivedId(current.generation, label)), bus.settings.now());
    await bus.persist({ ...current, rows: pending ? current.rows : content.rows, baselineRows: content.rows, baselineSequence: manifest.baseSequence, baselineSnapshotId: manifest.snapshotId,
      headVersion: pending ? current.headVersion : manifest.baseSequence, pulledSequence: manifest.baseSequence, remote: [], batches: pending ? current.batches : [],
      branches: [...current.branches, { id: 'before-snapshot:' + current.generation, rows: current.rows, intents: current.intents, batches: current.batches, headVersion: current.headVersion }],
      attachments: [...new Map([...current.attachments, ...manifest.attachments].map(item => [item.id, item])).values()] });
    return pending ? 'NEEDS_RECONCILIATION' : 'APPLIED';
  });
}
