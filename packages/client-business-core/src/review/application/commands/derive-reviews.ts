import { businessDate } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import { dailyPlanBaselines } from '../../../planning/public.ts';
import type { ReviewDocument, ReviewScope } from '../../domain/model.ts';
import { healthSlot } from '../../domain/scope-access.ts';
import { componentFresh } from '../../domain/freshness.ts';
import { refreshReview } from './refresh-review.ts';
import { invalidateStale } from './invalidate-stale.ts';

function changedDayScopes(tx: Transaction, keys: readonly string[]): ReviewScope[] {
  const scopes: ReviewScope[] = [];
  for (const key of keys) {
    const match =
      /^(execution:FACT_DAY|profile:BODY_DAY|planning:PLAN_DAY):(\d{4}-\d\d-\d\d)(?::([^:]+))?(?::([^:]+))?$/.exec(key);
    if (!match) continue;
    if (match[1] === 'planning:PLAN_DAY' && !match[3]) continue;
    const day = match[2]!,
      learning = match[3] === 'LEARNING' || (match[3] === 'REST' && match[4] === 'LEARNING'),
      health = !learning;
    scopes.push({ period: 'DAILY', date: day, goalId: null, slot: health ? 'HEALTH' : 'LEARNING' });
    for (const ref of dailyPlanBaselines(tx, day)) {
      if (learning !== (ref.item.kind === 'LEARNING')) continue;
      scopes.push({ period: 'DAILY', date: day, goalId: ref.goalId, slot: 'GOAL:' + ref.goalId });
    }
  }
  return scopes;
}
function staleScopes(tx: Transaction, period: ReviewScope['period']): ReviewScope[] {
  return tx
    .store('review')
    .all<ReviewDocument>('document')
    .filter((document) => document.period === period)
    .flatMap((document) =>
      document.components
        .filter((component) => !componentFresh(tx, component))
        .map((component) => ({
          period,
          date: document.date,
          goalId: document.goalId ?? (component.slot.startsWith('GOAL:') ? component.slot.slice(5) : null),
          slot: component.slot,
        })),
    );
}
function deriveScopes(tx: Transaction, context: ExecutionContext, scopes: readonly ReviewScope[]): void {
  const unique = new Map(scopes.map((scope) => [scope.period + '|' + scope.date + '|' + scope.slot, scope]));
  for (const [key, scope] of [...unique].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (scope.date > businessDate(context.now) || (healthSlot(tx, scope.slot) && !context.healthAllowed)) continue;
    const id = scope.period === 'DAILY' ? 'daily|' + scope.date : 'weekly|' + scope.goalId + '|' + scope.date;
    const previous = tx.store('review').get<ReviewDocument>('document', id);
    refreshReview(
      tx,
      { ...context, id: (label) => context.id('derive:' + key + ':' + label) },
      {
        scope,
        expectedVersion: previous?.version ?? '0',
        manualText: null,
        manualFinal: false,
      },
    );
  }
}
/** Deterministic summaries run in the same local transaction; no AI, network, or implicit confirmation. */
export function deriveReviews(
  tx: Transaction,
  context: ExecutionContext,
  changedKeys: readonly string[],
  commandType: string,
): void {
  if (!changedKeys.length) return;
  if (!commandType.startsWith('review.'))
    deriveScopes(tx, context, [...changedDayScopes(tx, changedKeys), ...staleScopes(tx, 'DAILY')]);
  invalidateStale(tx, context);
  deriveScopes(tx, context, staleScopes(tx, 'WEEKLY'));
  invalidateStale(tx, context);
}
