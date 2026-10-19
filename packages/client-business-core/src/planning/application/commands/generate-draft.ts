import { canonical, digest, requireThat, weekStart } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { expected, required, revision } from '../../../application/ports/entity.ts';
import { conditionSnapshot } from '../../../profile/public.ts';
import type { Goal, PlanCandidate, WeekPlan } from '../../domain/model.ts';
import { reviewSources } from '../../domain/review-sources.ts';
import { patchWeek } from './patch-week.ts';

export function requestDraftCandidate(tx: Transaction, context: ExecutionContext, input: {
  goalId: string; weekStart: string; expectedVersion: string;
}): PlanCandidate {
  requireThat(context.aiAllowed, 'PURPOSE_REQUIRED');
  const repository = tx.store('planning'), goal = required<Goal>(repository, 'goal', input.goalId);
  requireThat(goal.category !== 'FITNESS' || context.healthAllowed, 'PURPOSE_REQUIRED');
  requireThat(weekStart(input.weekStart) === input.weekStart, 'WEEK_MUST_START_MONDAY');
  const week = repository.get<WeekPlan>('week', goal.id + '|' + input.weekStart);
  expected(week, input.expectedVersion);
  const sources = reviewSources(tx, week ?? { goalId: goal.id, weekStart: input.weekStart });
  const frozen = { goal, week: week?.draft ?? [], weekStart: input.weekStart, sources,
    common: conditionSnapshot(tx, 'COMMON'), conditions: conditionSnapshot(tx, goal.category), rulesVersion: context.rulesVersion };
  const entity: PlanCandidate = { ...revision(context, 'plan-candidate', null), goalId: goal.id, weekStart: input.weekStart,
    expectedWeekVersion: week?.version ?? '0', sources, input: canonical(frozen), inputDigest: digest(frozen), status: 'WAITING' };
  repository.save('candidate', entity);
  return entity;
}
export function acceptGeneratedDraft(tx: Transaction, context: ExecutionContext, input: {
  candidateId: string; expectedVersion: string; inputDigest: string; changes: Parameters<typeof patchWeek>[2]['changes'];
}): WeekPlan {
  requireThat(context.aiAllowed, 'PURPOSE_REQUIRED');
  const repository = tx.store('planning'), candidate = required<PlanCandidate>(repository, 'candidate', input.candidateId);
  expected(candidate, input.expectedVersion);
  requireThat(candidate.status === 'WAITING' && candidate.inputDigest === input.inputDigest && tx.fresh(candidate.sources), 'SOURCE_STALE');
  const week = patchWeek(tx, context, { goalId: candidate.goalId, weekStart: candidate.weekStart, expectedVersion: candidate.expectedWeekVersion, changes: input.changes });
  repository.save('candidate', { ...candidate, ...revision(context, 'plan-candidate', candidate), status: 'ACCEPTED' });
  return week;
}
