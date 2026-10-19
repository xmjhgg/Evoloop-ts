import { date } from '@evoloop/kernel';
import type { Transaction } from '../../application/ports/public.ts';
import { goals, applicableItems } from '../../planning/public.ts';
import { factsOn, intakeSummary } from '../../execution/public.ts';
import { observations } from '../../profile/public.ts';
import { confirmedComponents, reviewDocument } from '../../review/public.ts';

/** Composition only: every metric and confirmation check belongs to its owning domain. */
export function todayWorkspace(tx: Transaction, day: string) {
  date(day);
  const review = reviewDocument(tx, 'daily|' + day);
  return { businessDate: day, goals: goals(tx), planned: applicableItems(tx, day), actual: factsOn(tx, day),
    intake: intakeSummary(tx, day), observations: observations(tx, day), review,
    confirmedComponentIds: review ? confirmedComponents(tx, review) : [] };
}
