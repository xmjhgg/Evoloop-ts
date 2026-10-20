import { businessDate, subtract } from '@evoloop/kernel';
import type { Transaction } from '../../application/ports/public.ts';
import type { BaselineRef } from '../../planning/public.ts';
import { goalRevision } from '../../planning/public.ts';
import type { Fact } from '../../execution/public.ts';
import { learningQuantities } from '../../execution/public.ts';
import type { DaySnapshot } from './day-snapshot.ts';

export function dueAtCutoff(day: string, startAt: string | null, minutes: string | null, cutoff: string): boolean {
  if (day > businessDate(cutoff)) return false;
  if (startAt !== null) return Date.parse(startAt) + Number(minutes ?? '0') * 60000 <= Date.parse(cutoff);
  return day < businessDate(cutoff);
}
function comparison(fact: Fact, ref: BaselineRef) {
  const planned = ref.item.prescription;
  if (fact.baselineDateMismatch)
    return { factId: fact.id, status: 'UNAVAILABLE', unit: null, planned: null, actual: null, difference: null };
  if (fact.data.kind === 'TRAINING')
    return {
      factId: fact.id,
      status: 'ORIGINAL_BASELINE',
      unit: 'MINUTE',
      planned: planned.minutes,
      actual: fact.data.durationMinutes,
      difference:
        planned.minutes !== null && fact.data.durationMinutes !== null
          ? subtract(fact.data.durationMinutes, planned.minutes)
          : null,
    };
  if (fact.data.kind === 'LEARNING') {
    const unit = planned.learning?.unit ?? 'MINUTE',
      target = planned.learning?.quantity ?? planned.minutes;
    const actual = learningQuantities(fact)[unit] ?? null;
    return {
      factId: fact.id,
      status: 'ORIGINAL_BASELINE',
      unit,
      planned: target,
      actual,
      difference: target !== null && actual !== null ? subtract(actual, target) : null,
    };
  }
  return { factId: fact.id, status: 'ORIGINAL_BASELINE', unit: null, planned: null, actual: null, difference: null };
}
export function planMetrics(tx: Transaction, snapshot: DaySnapshot, cutoff: string) {
  return snapshot.plans.map((ref) => {
    const item = ref.item,
      goal = goalRevision(tx, ref.goalId, item.goalRevisionId);
    const records = snapshot.facts.filter((fact) => fact.baselineRefs.some((baseline) => baseline.item.id === item.id));
    const due = dueAtCutoff(item.businessDate, item.prescription.startAt, item.prescription.minutes, cutoff);
    const state =
      item.disposition === 'SUSPENDED'
        ? 'PAUSED'
        : item.disposition === 'REMOVED'
          ? 'REMOVED'
          : item.kind === 'REST'
            ? 'REST'
            : records.length
              ? 'RECORDED'
              : due
                ? 'NOT_RECORDED'
                : 'PENDING';
    return {
      itemId: item.id,
      goalId: ref.goalId,
      goalRevisionId: item.goalRevisionId,
      goalName: goal?.name ?? null,
      goalMeasure: goal?.measure ?? null,
      kind: item.kind,
      state,
      due: item.disposition === 'PLANNED' && item.kind !== 'REST' && (due || records.length > 0),
      factIds: records.map((fact) => fact.id),
      completionStates: records.flatMap((fact) =>
        fact.data.kind === 'TRAINING' || fact.data.kind === 'LEARNING' ? [fact.data.status] : [],
      ),
      comparisons: records.map((fact) => comparison(fact, ref)),
    };
  });
}
