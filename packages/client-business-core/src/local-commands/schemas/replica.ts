import { z } from 'zod';
import { requireThat } from '@evoloop/kernel';
import { id, version, jsonValue } from './common.ts';
import { planItem } from './planning.ts';
import { foodLine, training, learning, sleep } from './execution.ts';

const entity = z.object({ id, version, revisionId: z.string().uuid() });
const sources = z.object({ refs: z.array(z.object({ collection: id, id, revisionId: id }).strict()), tokens: z.record(id, version) }).strict();
const baseline = z.object({ weekId: id, goalId: id, item: planItem }).strict();
const reviewComponent = z.object({ id, slot: id, sources, input: z.string(), inputDigest: id, cutoff: id, metrics: jsonValue, coverage: jsonValue,
  text: z.string(), state: z.enum(['SUMMARY_ONLY', 'MANUAL_FINAL_JUDGMENT', 'AWAITING_CONFIRMATION']), stale: z.boolean() }).strict();
const schemas: Record<string, z.ZodType> = {
  'profile.condition': entity.extend({ section: z.enum(['COMMON', 'FITNESS', 'LEARNING']), values: z.record(id, jsonValue) }).strict(),
  'profile.observation': entity.extend({ kind: z.enum(['MEASUREMENT', 'BODY_STATE']), status: z.enum(['ACTIVE', 'REMOVED']), observedAt: id, businessDate: id,
    values: z.record(id, z.object({ value: z.string().nullable(), unit: id }).strict()) }).strict(),
  'planning.goal': entity.extend({ category: z.enum(['FITNESS', 'LEARNING']), name: id, description: z.string(), measure: z.string(), startDate: id, endDate: id,
    status: z.enum(['ACTIVE', 'PAUSED', 'PENDING_REPLAN', 'ARCHIVED']) }).strict(),
  'planning.week': entity.extend({ goalId: id, weekStart: id, draft: z.array(planItem), published: z.array(planItem),
    review: z.object({ id, channel: z.enum(['RULES', 'AI']), fingerprint: id, input: z.string(), inputDigest: id, rulesVersion: id, sources,
      status: z.enum(['READY', 'BLOCKED', 'INFORMATION_REQUIRED']), issues: z.array(z.string()), candidate: z.string().nullable() }).strict().nullable(),
    publications: z.array(z.object({ id, at: id, items: z.array(planItem) }).strict()) }).strict(),
  'planning.guard': entity.extend({ businessDate: id, kind: id, refs: z.array(baseline), frozenAbsence: z.boolean() }).strict(),
  'planning.candidate': entity.extend({ goalId: id, weekStart: id, expectedWeekVersion: version, sources, input: z.string(), inputDigest: id, status: z.enum(['WAITING', 'ACCEPTED']) }).strict(),
  'execution.fact': entity.extend({ businessDate: id, status: z.enum(['ACTIVE', 'REMOVED']), data: z.discriminatedUnion('kind', [training, learning, sleep,
    z.object({ kind: z.literal('MEAL'), mealCode: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']), lines: z.array(foodLine), draftId: id, unknownAccepted: z.boolean() }).strict()]),
    baselineRefs: z.array(baseline), originalDate: id, baselineDateMismatch: z.boolean() }).strict(),
  'execution.food-draft': entity.extend({ businessDate: id, mealCode: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']), evidence: z.array(id), description: z.string(), lines: z.array(foodLine),
    factId: id.nullable(), candidateDigest: id.nullable(), confirmedRevisionId: id.nullable() }).strict(),
  'review.document': entity.extend({ period: z.enum(['DAILY', 'WEEKLY']), date: id, goalId: id.nullable(), components: z.array(reviewComponent),
    manual: z.array(z.object({ id, slot: id, text: z.string(), removed: z.boolean() }).strict()),
    confirmations: z.array(z.object({ id, componentIds: z.array(id), fingerprint: id, at: id, stale: z.boolean() }).strict()) }).strict(),
  'review.adjustment': entity.extend({ documentId: id, componentIds: z.array(id), sources, weekId: id,
    changes: z.array(z.object({ itemId: id, oldValue: planItem, proposed: planItem, reason: id }).strict()), status: z.enum(['READY', 'SUBMITTED', 'DISMISSED', 'STALE']) }).strict(),
  'system.token': entity.strict(),
};
export function validateDocument(table: string, value: unknown): void {
  const schema = schemas[table];
  requireThat(schema, 'COLLECTION_NOT_ALLOWED');
  schema.parse(value);
}
