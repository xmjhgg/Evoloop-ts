import { requireThat } from '@evoloop/kernel';
import type { ExecutionContext, Transaction } from '../../application/ports/public.ts';
import { goals } from '../../planning/public.ts';

export function healthSlot(tx: Transaction, slot: string): boolean {
  return (
    slot === 'HEALTH' ||
    (slot.startsWith('GOAL:') && goals(tx).some((goal) => goal.id === slot.slice(5) && goal.category === 'FITNESS'))
  );
}
export function requireReviewAccess(tx: Transaction, context: ExecutionContext, slot: string): void {
  requireThat(!healthSlot(tx, slot) || context.healthAllowed, 'PURPOSE_REQUIRED');
}
