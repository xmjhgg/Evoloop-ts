import { addDays, canonical, date, digest, requireThat, weekStart } from '@evoloop/kernel';
import type { Transaction } from '../../application/ports/public.ts';
import { goals, applicableItems } from '../../planning/public.ts';
import { factsOn, intakeSummary, learningQuantities } from '../../execution/public.ts';
import { observations, conditionSnapshot } from '../../profile/public.ts';
import type { ReviewScope, ReviewDocument } from './model.ts';

export function documentId(scope: ReviewScope): string {
  date(scope.date);
  requireThat(scope.period !== 'WEEKLY' || scope.goalId && weekStart(scope.date) === scope.date, 'INVALID_REVIEW_SCOPE');
  const goalScope = scope.goalId && scope.slot === 'GOAL:' + scope.goalId;
  const overview = scope.period === 'DAILY' && scope.goalId === null && (scope.slot === 'HEALTH' || scope.slot === 'LEARNING');
  requireThat(goalScope || overview, 'INVALID_REVIEW_SCOPE');
  return scope.period === 'DAILY' ? 'daily|' + scope.date : 'weekly|' + scope.goalId + '|' + scope.date;
}
export function collectInput(tx: Transaction, scope: ReviewScope, cutoff: string, manual: ReviewDocument['manual'] = []) {
  const rootId = documentId(scope), availableGoals = goals(tx), goal = availableGoals.find(value => value.id === scope.goalId);
  requireThat(!scope.goalId || goal, 'NOT_FOUND');
  const category = scope.slot === 'HEALTH' || goal?.category === 'FITNESS' ? 'FITNESS' : 'LEARNING';
  const count = scope.period === 'DAILY' ? 1 : 7, keys = ['review:MANUAL:' + rootId + '|' + scope.slot, 'planning:GOAL_SET:' + category, 'profile:CONDITIONS:COMMON'];
  if (goal) keys.push('planning:GOAL_STATE:' + goal.id);
  const days = Array.from({ length: count }, (_, index) => addDays(scope.date, index));
  const snapshots = days.map(day => {
    const health = scope.slot === 'HEALTH' || goal?.category === 'FITNESS';
    keys.push('profile:CONDITIONS:' + (health ? 'FITNESS' : 'LEARNING'));
    if (health) keys.push('profile:BODY_DAY:' + day, 'profile:CONDITIONS:FITNESS');
    const kinds = health ? ['TRAINING', 'SLEEP', 'MEAL'] : ['LEARNING'];
    kinds.forEach(kind => keys.push('planning:PLAN_DAY:' + day + ':' + (kind === 'MEAL' ? 'NUTRITION_TOTAL' : kind)));
    keys.push('planning:PLAN_DAY:' + day + ':REST:' + category);
    kinds.forEach(kind => keys.push('execution:FACT_DAY:' + day + ':' + kind));
    if (scope.period === 'WEEKLY') keys.push('review:DAILY:' + day + ':' + scope.slot);
    const facts = factsOn(tx, day).filter(fact => kinds.includes(fact.data.kind) && (!scope.goalId || fact.baselineRefs.some(ref => ref.goalId === scope.goalId)));
    const plans = applicableItems(tx, day).filter(ref => (!scope.goalId || ref.goalId === scope.goalId) && availableGoals.some(value => value.id === ref.goalId && value.category === category));
    return { day, facts, plans, body: health ? observations(tx, day) : [], nutrition: health ? intakeSummary(tx, day) : null,
      learning: facts.map(fact => ({ factId: fact.id, quantities: learningQuantities(fact) })),
      comparability: facts.some(fact => fact.baselineDateMismatch) ? 'UNAVAILABLE' : facts.some(fact => fact.baselineRefs.length > 0) ? 'ORIGINAL_BASELINE' : 'NO_BASELINE' };
  });
  const refs = snapshots.flatMap(snapshot => [...snapshot.facts.map(fact => ({ collection: 'execution.fact', id: fact.id, revisionId: fact.revisionId })),
    ...snapshot.body.map(observation => ({ collection: 'profile.observation', id: observation.id, revisionId: observation.revisionId }))]);
  if (goal) refs.push({ collection: 'planning.goal', id: goal.id, revisionId: goal.revisionId });
  for (const section of ['COMMON', scope.slot === 'HEALTH' || goal?.category === 'FITNESS' ? 'FITNESS' : 'LEARNING'] as const) {
    const condition = conditionSnapshot(tx, section);
    if (condition) refs.push({ collection: 'profile.condition', id: condition.id, revisionId: condition.revisionId });
  }
  const sources = tx.capture([...new Set(keys)], refs);
  const coverage = { days, cutoff, scope: scope.slot, recordedFactIds: [...new Set(snapshots.flatMap(snapshot => snapshot.facts.map(fact => fact.id)))], complete: false };
  const metrics = snapshots.map(snapshot => ({ day: snapshot.day, factCount: String(snapshot.facts.length),
    trainingStates: snapshot.facts.filter(fact => fact.data.kind === 'TRAINING').map(fact => fact.data.kind === 'TRAINING' ? fact.data.status : ''),
    sleep: snapshot.facts.filter(fact => fact.data.kind === 'SLEEP').map(fact => fact.data.kind === 'SLEEP' ? { factId: fact.id, state: fact.data.endAt ? 'COMPLETED' : 'IN_PROGRESS', durationMilliseconds: fact.data.endAt ? String(Date.parse(fact.data.endAt) - Date.parse(fact.data.beginAt)) : null } : null),
    comparability: snapshot.comparability, nutrition: snapshot.nutrition, learning: snapshot.learning }));
  const frozen = { sources, cutoff, coverage, metrics, planned: snapshots.map(snapshot => ({ day: snapshot.day, plans: snapshot.plans })),
    common: conditionSnapshot(tx, 'COMMON'), manual: manual.filter(entry => entry.slot === scope.slot && !entry.removed) };
  return { sources, metrics, coverage, input: canonical(frozen), inputDigest: digest(frozen) };
}
