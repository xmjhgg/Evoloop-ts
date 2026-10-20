import { canonical, digest, requireThat } from '@evoloop/kernel';
import type { Transaction } from '../../../application/ports/public.ts';
import { reviewDocuments } from './documents.ts';

export function validateReviewImport(tx: Transaction): void {
  for (const document of reviewDocuments(tx)) {
    requireThat(new Set(document.components.map(component => component.id)).size === document.components.length, 'DUPLICATE_COMPONENT');
    for (const component of document.components) {
      let validInput = false;
      let frozen: Record<string, unknown> = {};
      try { frozen = JSON.parse(component.input) as Record<string, unknown>; validInput = digest(frozen) === component.inputDigest; } catch { /* Invalid external snapshot is rejected below. */ }
      requireThat(validInput, 'REVIEW_INPUT_INVALID');
      const coverage = frozen['summary'] === undefined ? frozen['coverage'] : { ...frozen['coverage'] as object, summary: frozen['summary'] };
      requireThat(canonical(component.metrics) === canonical(frozen['metrics']) && canonical(component.coverage) === canonical(coverage), 'REVIEW_METRICS_MISMATCH');
      requireThat(component.cutoff === frozen['cutoff'] && canonical(component.sources) === canonical(frozen['sources']), 'REVIEW_INPUT_MISMATCH');
      const self = document.period === 'DAILY' ? 'review:DAILY:' + document.date : 'review:GOAL_WEEK:' + document.goalId + '|' + document.date;
      requireThat(!Object.keys(component.sources.tokens).some(key => key === self || key.startsWith(self + ':')), 'SELF_SOURCE_FORBIDDEN');
    }
  }
}
