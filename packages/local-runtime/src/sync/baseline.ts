import { digest, requireThat } from '@evoloop/kernel';
import type { Envelope } from '@evoloop/contracts';
import type { State } from '../ports/public.ts';
import { applyRows } from '../changes/apply.ts';

export function cloudRows(state: State, includeReceipts = false): State['rows'] {
  let rows = state.baselineRows, sequence = state.baselineSequence;
  const all: Envelope[] = [...state.remote];
  if (includeReceipts) for (const entry of state.batches) if (entry.receipt?.status === 'STORED') {
    all.push({ serverSequence: entry.receipt.serverSequence!, batch: entry.batch });
  }
  const bySequence = new Map<string, Envelope>();
  for (const envelope of all) {
    const previous = bySequence.get(envelope.serverSequence);
    requireThat(!previous || digest(previous) === digest(envelope), 'SYNC_SEQUENCE_REUSED');
    bySequence.set(envelope.serverSequence, envelope);
  }
  for (const envelope of [...bySequence.values()].sort((a, b) => BigInt(a.serverSequence) < BigInt(b.serverSequence) ? -1 : 1)) {
    if (BigInt(envelope.serverSequence) <= BigInt(sequence)) continue;
    requireThat(BigInt(envelope.serverSequence) === BigInt(sequence) + 1n, 'SYNC_SEQUENCE_GAP');
    rows = applyRows(rows, envelope.batch.changes);
    sequence = envelope.serverSequence;
  }
  return rows;
}
