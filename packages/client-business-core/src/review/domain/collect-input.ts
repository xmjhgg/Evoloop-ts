import { addDays, canonical, date, digest, requireThat, weekStart } from '@evoloop/kernel';
import type { Json } from '@evoloop/kernel';
import type { Transaction } from '../../application/ports/public.ts';
import { goals } from '../../planning/public.ts';
import { conditionSnapshot } from '../../profile/public.ts';
import type { ReviewScope, ReviewDocument } from './model.ts';
import { daySnapshot } from './day-snapshot.ts';
import { dayMetrics, periodSummary } from './metrics.ts';
import { reviewCoverage } from './coverage.ts';
import { metricVersion } from './freshness.ts';

export function documentId(scope: ReviewScope): string {
  date(scope.date);
  requireThat(
    scope.period !== 'WEEKLY' || (scope.goalId && weekStart(scope.date) === scope.date),
    'INVALID_REVIEW_SCOPE',
  );
  const goalScope = scope.goalId && scope.slot === 'GOAL:' + scope.goalId;
  const overview =
    scope.period === 'DAILY' && scope.goalId === null && (scope.slot === 'HEALTH' || scope.slot === 'LEARNING');
  requireThat(goalScope || overview, 'INVALID_REVIEW_SCOPE');
  return scope.period === 'DAILY' ? 'daily|' + scope.date : 'weekly|' + scope.goalId + '|' + scope.date;
}
export function collectInput(
  tx: Transaction,
  scope: ReviewScope,
  cutoff: string,
  manual: ReviewDocument['manual'] = [],
) {
  const rootId = documentId(scope),
    goal = goals(tx).find((value) => value.id === scope.goalId);
  requireThat(!scope.goalId || goal, 'NOT_FOUND');
  const health = scope.slot === 'HEALTH' || goal?.category === 'FITNESS',
    category = health ? 'FITNESS' : 'LEARNING';
  const keys = [
    'review:MANUAL:' + rootId + '|' + scope.slot,
    'planning:GOAL_SET:' + category,
    'profile:CONDITIONS:COMMON',
    'profile:CONDITIONS:' + category,
  ];
  if (goal) keys.push('planning:GOAL_STATE:' + goal.id);
  const days = Array.from({ length: scope.period === 'DAILY' ? 1 : 7 }, (_, index) => addDays(scope.date, index));
  const snapshots = days.map((day) => daySnapshot(tx, scope, day));
  for (const day of days) {
    if (health) keys.push('profile:BODY_DAY:' + day);
    for (const kind of health ? ['TRAINING', 'SLEEP', 'MEAL'] : ['LEARNING']) {
      keys.push(
        'planning:PLAN_DAY:' + day + ':' + (kind === 'MEAL' ? 'NUTRITION_TOTAL' : kind),
        'execution:FACT_DAY:' + day + ':' + kind,
      );
    }
    keys.push('planning:PLAN_DAY:' + day + ':REST:' + category);
    if (scope.period === 'WEEKLY') keys.push('review:DAILY:' + day + ':' + scope.slot);
  }
  const refs = snapshots.flatMap((snapshot) => [
    ...snapshot.facts.map((fact) => ({ collection: 'execution.fact', id: fact.id, revisionId: fact.revisionId })),
    ...snapshot.body.map((observation) => ({
      collection: 'profile.observation',
      id: observation.id,
      revisionId: observation.revisionId,
    })),
  ]);
  if (goal) refs.push({ collection: 'planning.goal', id: goal.id, revisionId: goal.revisionId });
  for (const section of ['COMMON', category] as const) {
    const condition = conditionSnapshot(tx, section);
    if (condition) refs.push({ collection: 'profile.condition', id: condition.id, revisionId: condition.revisionId });
  }
  const sources = tx.capture([...new Set(keys)], refs),
    metrics = snapshots.map((snapshot) => dayMetrics(tx, snapshot, cutoff, scope.slot, scope.period === 'WEEKLY'));
  const coverage = reviewCoverage(
      snapshots,
      metrics.map((metric) => metric.plans),
      cutoff,
      scope.slot,
    ),
    summary = periodSummary(snapshots);
  const frozen = {
    sources,
    cutoff,
    coverage,
    metrics,
    summary,
    metricVersion,
    goal: goal ?? null,
    planned: snapshots.map((snapshot) => ({ day: snapshot.day, plans: snapshot.plans })),
    common: conditionSnapshot(tx, 'COMMON'),
    manual: manual.filter((entry) => entry.slot === scope.slot && !entry.removed),
  };
  return {
    sources,
    metrics: JSON.parse(canonical(metrics)) as Json,
    coverage: JSON.parse(canonical({ ...coverage, summary })) as Json,
    input: canonical(frozen),
    inputDigest: digest(frozen),
  };
}
