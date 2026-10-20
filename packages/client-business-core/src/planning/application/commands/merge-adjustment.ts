import { businessDate, canonical, requireThat } from '@evoloop/kernel';
import type { Transaction, ExecutionContext, SourceSet } from '../../../application/ports/public.ts';
import { required } from '../../../application/ports/entity.ts';
import type { Goal, PlanItem, Protection, WeekPlan } from '../../domain/model.ts';
import type { PlanningCollaborators } from '../../ports/collaboration.ts';
import { patchWeek } from './patch-week.ts';
import { fitnessRestrictions } from '../../domain/fitness-restrictions.ts';
import { validatePublishableRange } from '../../domain/range-policy.ts';

export interface AdjustmentMerge {
  readonly documentId: string;
  readonly componentIds: readonly string[];
  readonly sources: SourceSet;
  readonly weekId: string;
  readonly expectedVersion: string;
  readonly changes: readonly { itemId: string; oldValue: PlanItem; proposed: PlanItem; reason: string }[];
  readonly choices: readonly { itemId: string; choice: 'KEEP_CURRENT' | 'USE_PROPOSED' | 'CUSTOM'; custom: PlanItem | null }[];
}
export function mergeAdjustment(tx: Transaction, context: ExecutionContext, ports: PlanningCollaborators, input: AdjustmentMerge): WeekPlan {
  requireThat(ports.verifyAdjustmentBasis(tx, input.documentId, input.componentIds, input.sources), 'BASIS_STALE');
  const week = required<WeekPlan>(tx.store('planning'), 'week', input.weekId);
  const goal = required<Goal>(tx.store('planning'), 'goal', week.goalId);
  requireThat(goal.category !== 'FITNESS' || fitnessRestrictions(tx, goal, context.rulesVersion, ports) === 'ALLOWED', 'INFORMATION_REQUIRED');
  requireThat(new Set(input.changes.map(change => change.itemId)).size === input.changes.length
    && new Set(input.choices.map(choice => choice.itemId)).size === input.choices.length
    && input.choices.every(choice => input.changes.some(change => change.itemId === choice.itemId)), 'INVALID_MERGE_CHOICES');
  const changes: Parameters<typeof patchWeek>[2]['changes'][number][] = [];
  for (const patch of input.changes) {
    const current = week.draft.find(item => item.id === patch.itemId);
    requireThat(current && patch.oldValue.id === patch.itemId && patch.proposed.id === patch.itemId, 'ITEM_NOT_FOUND');
    const choice = input.choices.find(item => item.itemId === patch.itemId);
    if (choice?.choice === 'KEEP_CURRENT') continue;
    requireThat(canonical(current) === canonical(patch.oldValue) || choice, 'MERGE_CHOICE_REQUIRED');
    const value = choice?.choice === 'CUSTOM' ? choice.custom : patch.proposed;
    requireThat(value && value.businessDate === current.businessDate && value.kind === current.kind, 'IMMUTABLE_SLOT');
    requireThat(value.id === current.id && (!value.prescription.startAt || value.prescription.startAt > context.now), 'PROTECTED_RANGE');
    validatePublishableRange(tx, context, ports, value, week.published.find(item => item.id === value.id));
    const kind = value.kind === 'NUTRITION_TOTAL' ? 'MEAL' : value.kind;
    requireThat(value.businessDate > businessDate(context.now) && !ports.hasActual(tx, value.businessDate, kind)
      && !tx.store('planning').get<Protection>('guard', value.businessDate + '|' + kind), 'PROTECTED_RANGE');
    changes.push({ ...value, id: current.id });
  }
  return patchWeek(tx, context, { goalId: week.goalId, weekStart: week.weekStart, expectedVersion: input.expectedVersion, changes });
}
