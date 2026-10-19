import type { Transaction } from '../../../application/ports/public.ts';
import type { PlanCandidate } from '../../domain/model.ts';
export function planCandidates(tx: Transaction, goalId: string, start: string): readonly PlanCandidate[] {
  return tx.store('planning').all<PlanCandidate>('candidate').filter(value => value.goalId === goalId && value.weekStart === start);
}
