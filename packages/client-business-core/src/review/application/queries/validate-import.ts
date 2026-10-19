import { requireThat } from '@evoloop/kernel';
import type { Transaction } from '../../../application/ports/public.ts';
import { reviewDocuments } from './documents.ts';

export function validateReviewImport(tx: Transaction): void {
  for (const document of reviewDocuments(tx)) {
    requireThat(new Set(document.components.map(component => component.id)).size === document.components.length, 'DUPLICATE_COMPONENT');
    for (const component of document.components) {
      const self = document.period === 'DAILY' ? 'review:DAILY:' + document.date : 'review:GOAL_WEEK:' + document.goalId + '|' + document.date;
      requireThat(!Object.keys(component.sources.tokens).some(key => key === self || key.startsWith(self + ':')), 'SELF_SOURCE_FORBIDDEN');
    }
  }
}
