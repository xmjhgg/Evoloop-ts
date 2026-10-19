import { z } from 'zod';
import { saveGoal, patchWeek, reviewWeek, publishWeek, changeGoalState, acceptPlanCandidate, requestDraftCandidate, acceptGeneratedDraft } from '../../planning/public.ts';
import type { PlanningCollaborators } from '../../planning/public.ts';
import { amount, handler, id, nullableId, version } from './common.ts';

export const prescription = z.object({ title: id, startAt: z.string().nullable(), minutes: amount.nullable(),
  actions: z.array(z.object({ id, name: id, sets: version, quantity: amount, unit: z.enum(['REP', 'SECOND', 'MINUTE']), restSeconds: amount }).strict()),
  learning: z.object({ topic: id, unit: z.enum(['MINUTE', 'PAGE', 'QUESTION']).nullable(), quantity: amount.nullable(), outcome: z.string() }).strict().nullable(),
  nutrition: z.object({ energy: amount.nullable(), protein: amount.nullable(), carbohydrate: amount.nullable(), fat: amount.nullable(), unit: z.literal('kcal/g') }).strict().nullable() }).strict();
export const planItem = z.object({ id, revisionId: id, goalRevisionId: id, businessDate: z.string(),
  kind: z.enum(['TRAINING', 'LEARNING', 'SLEEP', 'NUTRITION_TOTAL', 'REST']), disposition: z.enum(['PLANNED', 'REMOVED', 'SUSPENDED']), prescription }).strict();
const draftChanges = z.array(planItem.omit({ revisionId: true, goalRevisionId: true }).extend({ id: nullableId })).max(200);
export function planningHandlers(ports: PlanningCollaborators) {
  return {
    'planning.week.request-candidate': handler(z.object({ goalId: id, weekStart: z.string(), expectedVersion: version }).strict(), requestDraftCandidate),
    'planning.week.accept-generated-draft': handler(z.object({ candidateId: id, expectedVersion: version, inputDigest: id, changes: draftChanges }).strict(), acceptGeneratedDraft),
    'planning.goal.save': handler(z.object({ id: nullableId, expectedVersion: version, category: z.enum(['FITNESS', 'LEARNING']),
      name: id, description: z.string(), measure: z.string(), startDate: z.string(), endDate: z.string() }).strict(), saveGoal),
    'planning.week.patch-draft': handler(z.object({ goalId: id, weekStart: z.string(), expectedVersion: version,
      changes: draftChanges }).strict(), patchWeek),
    'planning.week.review': handler(z.object({ weekId: id, expectedVersion: version, channel: z.enum(['RULES', 'AI']) }).strict(), (tx, context, input) => reviewWeek(tx, context, ports, input)),
    'planning.week.accept-ai-candidate': handler(z.object({ weekId: id, expectedVersion: version, inputDigest: id, text: id }).strict(), acceptPlanCandidate),
    'planning.week.publish': handler(z.object({ weekId: id, expectedVersion: version, explicitConfirm: z.boolean(),
      selected: z.array(z.object({ itemId: id, expectedPublishedRevision: nullableId }).strict()).min(1) }).strict(), (tx, context, input) => publishWeek(tx, context, ports, input)),
    'planning.goal.change-state': handler(z.object({ goalId: id, expectedVersion: version, action: z.enum(['PAUSE', 'REQUEST_RESUME', 'ARCHIVE']) }).strict(), (tx, context, input) => changeGoalState(tx, context, ports, input)),
  };
}
