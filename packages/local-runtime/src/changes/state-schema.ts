import { z } from 'zod';
import { canonical, digest, requireThat } from '@evoloop/kernel';
import { commandSchema } from '@evoloop/client-business-core/commands';
import { rowSchema, changeSchema, tables, version } from '@evoloop/data-schema/replication';
import { batchSchema, receiptSchema, envelopeSchema } from '@evoloop/contracts';
import type { State } from '../ports/public.ts';

const identifier = z.string().uuid(), hash = z.string().regex(/^[a-f0-9]{64}$/);
const rows = z.partialRecord(z.enum(tables), z.array(rowSchema));
const intent = z.object({ command: commandSchema, inputDigest: hash, result: z.json(), changes: z.array(changeSchema),
  status: z.enum(['PENDING', 'STORED', 'CONFLICT', 'LOCAL_ONLY']) }).strict();
const batchEntry = z.object({ batch: batchSchema, commandIds: z.array(identifier), receipt: receiptSchema.nullable() }).strict();
const state = z.object({ formatVersion: z.literal('1'), accountId: identifier, deviceId: identifier, generation: version, headVersion: version,
  pulledSequence: version, baselineSequence: version, baselineRows: rows, baselineSnapshotId: identifier.nullable(), rows, intents: z.array(intent), batches: z.array(batchEntry),
  remote: z.array(envelopeSchema), branches: z.array(z.object({ id: z.string(), rows, intents: z.array(intent), batches: z.array(batchEntry), headVersion: version }).strict()),
  attachments: z.array(z.object({ id: identifier, digest: hash, complete: z.boolean() }).strict()) }).strict();

export function validateState(value: State): void {
  state.parse(value);
  canonical(value);
  requireThat(BigInt(value.baselineSequence) <= BigInt(value.pulledSequence), 'LOCAL_SEQUENCE_INVALID');
  for (const rows of [value.rows, value.baselineRows, ...value.branches.map(branch => branch.rows)]) {
    requireThat(Object.values(rows).every(values => values.every(row => row.accountId === value.accountId)), 'OWNER_MISMATCH');
  }
  for (const envelope of value.remote) {
    const { payloadDigest, ...content } = envelope.batch;
    requireThat(digest(content) === payloadDigest, 'DIGEST_MISMATCH');
  }
  for (const branch of [value, ...value.branches]) {
    requireThat(new Set(branch.intents.map(entry => entry.command.commandId)).size === branch.intents.length, 'LOCAL_INTENT_DUPLICATED');
    for (const entry of branch.intents) {
      requireThat(entry.command.accountId === value.accountId && digest(entry.command) === entry.inputDigest, 'LOCAL_INTENT_INVALID');
    }
    for (const entry of branch.batches) {
      const { payloadDigest, ...content } = entry.batch;
      requireThat(digest(content) === payloadDigest, 'DIGEST_MISMATCH');
      requireThat(!entry.receipt || entry.receipt.batchId === entry.batch.batchId && entry.receipt.inputDigest === payloadDigest, 'SYNC_RECEIPT_MISMATCH');
    }
  }
}
