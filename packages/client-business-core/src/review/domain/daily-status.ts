import type { Transaction } from '../../application/ports/public.ts';
import type { ReviewDocument } from './model.ts';
import { componentFresh } from './freshness.ts';

export function dailyStatus(tx: Transaction, day: string, slot: string) {
  const document = tx.store('review').get<ReviewDocument>('document', 'daily|' + day);
  const component = document?.components.find((value) => value.slot === slot);
  if (!document || !component) return { day, state: 'MISSING', componentId: null, cutoff: null, text: null };
  const stale = !componentFresh(tx, component);
  const confirmed =
    !stale && document.confirmations.some((value) => !value.stale && value.componentIds.includes(component.id));
  return {
    day,
    state: stale ? 'STALE' : confirmed ? 'CONFIRMED' : component.state,
    componentId: component.id,
    cutoff: component.cutoff,
    text: component.text,
  };
}
