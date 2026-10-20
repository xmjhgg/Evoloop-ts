import { z } from 'zod';
import { saveFact, removeFact, saveFoodDraft, saveLabelDraft, acceptFoodCandidate, confirmIntake } from '../../execution/public.ts';
import { amount, handler, id, nullableId, version } from './common.ts';

const completion = z.enum(['COMPLETED', 'PARTIAL', 'NOT_PERFORMED']);
const nutrition = z.object({ state: z.enum(['KNOWN', 'ESTIMATED', 'UNKNOWN']), value: amount.nullable(),
  lower: amount.nullable(), upper: amount.nullable(), unit: z.enum(['kcal', 'g']), source: z.string(),
  original: z.object({ unit: z.enum(['kcal', 'kJ', 'g']), value: amount.nullable(), lower: amount.nullable(), upper: amount.nullable(), conversionVersion: z.literal('nutrition-units-v1') }).strict().optional() }).strict();
export const foodLine = z.object({ id, name: id, personalFactor: amount.nullable(), portionUnit: id,
  energy: nutrition, protein: nutrition, carbohydrate: nutrition, fat: nutrition,
  portion: z.object({ referenceAmount: amount, consumedAmount: amount.nullable(), unit: z.enum(['g', 'PORTION']), conversionVersion: z.literal('nutrition-units-v1') }).strict().optional() }).strict();
const labelValue = nutrition.omit({ original: true, unit: true }).extend({ unit: z.enum(['kcal', 'kJ', 'g']) });
const labelLine = z.object({ id, name: id, referenceAmount: amount, consumedAmount: amount.nullable(), quantityUnit: z.enum(['g', 'PORTION']),
  energy: labelValue, protein: labelValue, carbohydrate: labelValue, fat: labelValue }).strict();
const mealCode = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);
export const training = z.object({ kind: z.literal('TRAINING'), status: completion, durationMinutes: amount.nullable(), feeling: z.string(),
  actions: z.array(z.object({ name: id, sets: z.array(z.object({ quantity: amount, unit: z.enum(['REP', 'SECOND', 'MINUTE']), loadKg: amount.nullable() }).strict()) }).strict()) }).strict();
export const learning = z.object({ kind: z.literal('LEARNING'), status: completion, durationMinutes: amount.nullable(), outcome: z.string(),
  fragments: z.array(z.object({ quantity: amount, unit: z.enum(['MINUTE', 'PAGE', 'QUESTION']) }).strict()) }).strict();
export const sleep = z.object({ kind: z.literal('SLEEP'), beginAt: z.string(), endAt: z.string().nullable(), provisionalWakeDate: z.string() }).strict();
export const executionHandlers = {
  'execution.food-draft.save-label': handler(z.object({ id: nullableId, expectedVersion: version, businessDate: z.string(),
    mealCode, evidence: z.array(id), description: z.string(), lines: z.array(labelLine) }).strict(), saveLabelDraft),
  'execution.fact.remove': handler(z.object({ factId: id, expectedVersion: version }).strict(), removeFact),
  'execution.fact.save': handler(z.object({ id: nullableId, expectedVersion: version, businessDate: z.string(),
    data: z.discriminatedUnion('kind', [training, learning, sleep]), planItemIds: z.array(id), remove: z.boolean(), baselineMode: z.enum(['AUTO', 'SELECTED', 'UNPLANNED']).optional() }).strict(), saveFact),
  'execution.food-draft.save': handler(z.object({ id: nullableId, expectedVersion: version, businessDate: z.string(),
    mealCode, evidence: z.array(id), description: z.string(), lines: z.array(foodLine) }).strict(), saveFoodDraft),
  'execution.food-draft.accept-candidate': handler(z.object({ draftId: id, expectedVersion: version, inputDigest: id, lines: z.array(foodLine) }).strict(), acceptFoodCandidate),
  'execution.intake.confirm': handler(z.object({ draftId: id, expectedVersion: version, expectedFactVersion: version,
    explicitConfirm: z.boolean(), unknownAccepted: z.boolean(), planItemIds: z.array(id), baselineMode: z.enum(['AUTO', 'SELECTED', 'UNPLANNED']).optional() }).strict(), confirmIntake),
};
