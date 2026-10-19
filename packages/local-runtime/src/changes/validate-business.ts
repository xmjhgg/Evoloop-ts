import { validateProfileImport } from '@evoloop/client-business-core/profile';
import { validatePlanningImport } from '@evoloop/client-business-core/planning';
import { validateExecutionImport } from '@evoloop/client-business-core/execution';
import { validateReviewImport } from '@evoloop/client-business-core/review';
import type { Transaction } from '@evoloop/client-business-core/ports';

export function validateBusiness(tx: Transaction, now: string): void {
  validateProfileImport(tx, now);
  validatePlanningImport(tx);
  validateExecutionImport(tx, now);
  validateReviewImport(tx);
}
