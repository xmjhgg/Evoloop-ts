import type { Transaction, SourceSet } from '../../application/ports/public.ts';
import type { Goal } from '../domain/model.ts';

export interface PlanningCollaborators {
  /** Injected by composition; planning does not statically import execution or review. */
  hasActual(tx: Transaction, day: string, kind: string): boolean;
  hasMealActual(tx: Transaction, day: string, mealCode: string): boolean;
  fitnessPolicy(tx: Transaction, goal: Goal, rulesVersion: string): 'ALLOWED' | 'BLOCKED' | 'INFORMATION_REQUIRED';
  verifyAdjustmentBasis(tx: Transaction, documentId: string, componentIds: readonly string[], sources: SourceSet): boolean;
}
