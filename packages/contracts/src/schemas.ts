import { z } from 'zod';
import { changeSchema, rowSchema, tables, text, version } from '@evoloop/data-schema/replication';

export const identifier = z.string().uuid();
const digest = z.string().regex(/^[0-9a-f]{64}$/);
export const batchContentSchema = z.object({ protocolVersion: z.literal('1'), batchId: identifier, deviceId: identifier,
  expectedHeadVersion: version, payloadSchemaVersion: z.literal('documents-v1'), changes: z.array(changeSchema).min(1).max(2000) }).strict();
export const batchSchema = batchContentSchema.extend({ payloadDigest: digest });
export const receiptSchema = z.object({ batchId: identifier, inputDigest: digest, status: z.enum(['STORED', 'CONFLICT', 'REJECTED']),
  serverSequence: version.nullable(), currentHeadVersion: version, code: z.string().nullable() }).strict();
export const envelopeSchema = z.object({ serverSequence: version, batch: batchSchema }).strict();
export const pullSchema = z.object({ envelopes: z.array(envelopeSchema).max(100), nextSequence: version, headVersion: version }).strict();
export const registrationSchema = z.object({ username: z.string().regex(/^[a-z0-9_]{3,32}$/),
  password: text(16, 128), declarationVersion: z.literal('registration-v1') }).strict();
export const loginSchema = z.object({ username: text(1, 64), password: text(1, 128), device: text(0, 120) }).strict();
export const purposeSchema = z.object({ aiAllowed: z.boolean(), healthAllowed: z.boolean(), noticeVersion: z.string(), expectedPurposeVersion: version }).strict();
export const purposeNoticeSchema = z.object({ version: text(1, 120), text: text(1, 32768) }).strict();
export const deactivateSchema = z.object({ explicitConfirm: z.literal(true), expectedPurposeVersion: version }).strict();
export const aiRequestSchema = z.object({ clientRequestId: identifier, capability: z.enum(['PLAN_REVIEW', 'FOOD_ANALYSIS', 'REVIEW', 'ADJUSTMENT']),
  input: text(2, 262144), inputDigest: digest, sourceMetadata: text(0, 65536), outputSchemaVersion: z.literal('candidate-v1'), assetIds: z.array(identifier).max(5).default([]) }).strict();
export const assetSchema = z.object({ id: identifier, digest, mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/octet-stream']), dataBase64: z.string().min(4).max(5592408) }).strict();
export const snapshotSchema = z.object({ snapshotId: identifier, baseSequence: version, payloadSchemaVersion: z.literal('documents-v1'),
  chunks: z.array(z.object({ index: version, data: text(2, 1048576), digest }).strict()).min(1).max(64),
  attachments: z.array(z.object({ id: identifier, digest, complete: z.boolean() }).strict()).max(1000) }).strict();
export const snapshotChunkSchema = z.object({ accountId: identifier, rows: z.partialRecord(z.enum(tables), z.array(rowSchema)) }).strict();
export const accountResultSchema = z.object({ accountId: identifier, username: z.string() }).strict();
export const sessionResultSchema = z.object({ accountId: identifier, credential: z.string().regex(/^[A-Za-z0-9_-]{43}$/), expiresAt: z.string() }).strict();
export const accountSnapshotSchema = accountResultSchema.extend({ aiAllowed: z.boolean(), healthAllowed: z.boolean(), purposeVersion: version });
export const capabilitiesSchema = z.object({ syncProtocolVersions: z.array(z.literal('1')), payloadSchemaVersions: z.array(z.literal('documents-v1')),
  headVersion: version, rootInitialized: z.boolean(), snapshotId: identifier.nullable(), snapshotSequence: version.nullable(), maxChanges: z.literal('2000'), maxBytes: z.literal('8388608') }).strict();
export const aiSubmissionSchema = z.object({ taskId: identifier, status: z.enum(['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED']), inputDigest: digest }).strict();
export const aiTaskSchema = aiSubmissionSchema.extend({ version, errorCode: z.string().nullable(), output: z.json().nullable(), sourceMetadata: z.string(),
  outputSchemaVersion: z.literal('candidate-v1'), modelId: z.string(), promptVersion: z.string() });
export const schemas = { SyncBatch: batchSchema, SyncReceipt: receiptSchema, PullEnvelope: pullSchema, Registration: registrationSchema,
  Login: loginSchema, Purpose: purposeSchema, PurposeNotice: purposeNoticeSchema, Deactivate: deactivateSchema, AiRequest: aiRequestSchema, Snapshot: snapshotSchema, Asset: assetSchema,
  SnapshotChunk: snapshotChunkSchema,
  AccountResult: accountResultSchema, SessionResult: sessionResultSchema, AccountSnapshot: accountSnapshotSchema, Capabilities: capabilitiesSchema,
  AiSubmission: aiSubmissionSchema, AiTask: aiTaskSchema,
  PurposeResult: z.object({ updated: z.literal(true), noticeVersion: z.string() }).strict(),
  DeactivationResult: z.object({ status: z.literal('DISABLED'), dataRetained: z.literal(true) }).strict(),
  SnapshotResult: z.object({ snapshotId: identifier, status: z.enum(['TEMPORARY', 'COMPLETE']) }).strict(),
  RootRequest: z.object({ snapshotId: identifier }).strict(),
  CancelResult: z.object({ status: z.literal('CANCELLED') }).strict(),
  AssetResult: z.object({ id: identifier, digest, complete: z.literal(true) }).strict(),
  Error: z.object({ code: z.string(), requestId: identifier }).strict(),
};
