import type { Transaction } from '../../application/ports/public.ts';
import type { ReviewComponent } from './model.ts';

export const metricVersion = 'review-metrics-v2';
export function componentFresh(tx: Transaction, component: ReviewComponent): boolean {
  if (component.stale || !tx.fresh(component.sources)) return false;
  try {
    return (JSON.parse(component.input) as { metricVersion?: unknown }).metricVersion === metricVersion;
  } catch {
    return false;
  }
}
