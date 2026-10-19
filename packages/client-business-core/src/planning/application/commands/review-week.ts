import { canonical, digest, requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { expected, required, revision } from '../../../application/ports/entity.ts';
import type { Goal, WeekPlan } from '../../domain/model.ts';
import type { PlanningCollaborators } from '../../ports/collaboration.ts';
import { reviewSources } from '../../domain/review-sources.ts';
import { fitnessRestrictions } from '../../domain/fitness-restrictions.ts';
import { conditionSnapshot } from '../../../profile/public.ts';

export function reviewWeek(tx: Transaction, context: ExecutionContext, ports: PlanningCollaborators, input: {
  weekId: string; expectedVersion: string; channel: 'RULES' | 'AI';
}): WeekPlan {
  const repository = tx.store('planning'), week = required<WeekPlan>(repository, 'week', input.weekId);
  expected(week, input.expectedVersion);
  const goal = required<Goal>(repository, 'goal', week.goalId), issues: string[] = [];
  const fitness = goal.category === 'FITNESS' ? fitnessRestrictions(tx, goal, context.rulesVersion, ports) : 'ALLOWED';
  if (fitness !== 'ALLOWED') issues.push(fitness);
  const active = week.draft.filter(item => item.disposition === 'PLANNED');
  if (!active.length) issues.push('EMPTY_PLAN');
  const otherItems = repository.all<WeekPlan>('week').filter(other => other.id !== week.id).flatMap(other => other.published).filter(item => item.disposition === 'PLANNED');
  const intervals = [...active, ...otherItems].filter(item => item.prescription.startAt && item.prescription.minutes);
  for (const item of active) {
    const start = item.prescription.startAt;
    if (!start || !item.prescription.minutes) continue;
    const begin = Date.parse(start), end = begin + Number(item.prescription.minutes) * 60000;
    if (intervals.some(other => other.id !== item.id && Date.parse(other.prescription.startAt!) < end && Date.parse(other.prescription.startAt!) + Number(other.prescription.minutes) * 60000 > begin)) issues.push('CROSS_GOAL_TIME_CONFLICT');
  }
  const sources = reviewSources(tx, week), frozen = { draft: week.draft, goal, sources, rulesVersion: context.rulesVersion,
    common: conditionSnapshot(tx, 'COMMON'), conditions: conditionSnapshot(tx, goal.category) };
  const entity: WeekPlan = { ...week, ...revision(context, 'week', week), review: {
    id: context.id('plan-review'), channel: input.channel, fingerprint: digest(week.draft), rulesVersion: context.rulesVersion,
    sources, input: canonical(frozen), inputDigest: digest(frozen), status: issues.length ? fitness === 'INFORMATION_REQUIRED' ? 'INFORMATION_REQUIRED' : 'BLOCKED' : input.channel === 'AI' ? 'INFORMATION_REQUIRED' : 'READY',
    issues: [...new Set(issues)], candidate: null,
  } };
  repository.save('week', entity);
  return entity;
}
export function acceptPlanCandidate(tx: Transaction, context: ExecutionContext, input: {
  weekId: string; expectedVersion: string; inputDigest: string; text: string;
}): WeekPlan {
  requireThat(context.aiAllowed, 'PURPOSE_REQUIRED');
  const repository = tx.store('planning'), week = required<WeekPlan>(repository, 'week', input.weekId);
  expected(week, input.expectedVersion);
  requireThat(week.review?.channel === 'AI', 'REVIEW_REQUIRED');
  requireThat(week.review.inputDigest === input.inputDigest && digest(week.draft) === week.review.fingerprint && tx.fresh(week.review.sources), 'SOURCE_STALE');
  requireThat(week.review.rulesVersion === context.rulesVersion && week.review.issues.length === 0, 'RULE_COVERAGE_INSUFFICIENT');
  const entity: WeekPlan = { ...week, ...revision(context, 'week', week), review: { ...week.review, status: 'READY', candidate: input.text } };
  repository.save('week', entity);
  return entity;
}
