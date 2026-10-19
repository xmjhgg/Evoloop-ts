import type { Transaction } from '../../application/ports/public.ts';
import { recordHistoryIndex } from '../../execution/public.ts';
import { observations } from '../../profile/public.ts';
import { goals, weeks } from '../../planning/public.ts';
import { reviewDocuments } from '../../review/public.ts';

export function historyWorkspace(tx: Transaction, day: string) {
  return { facts: recordHistoryIndex(tx, day), observations: observations(tx, day), goals: goals(tx),
    weeks: weeks(tx), reviews: reviewDocuments(tx).filter(document => document.date === day) };
}
