import type { ExecutionContext, Transaction } from '../../../application/ports/public.ts';
import type { LabelLine } from '../../domain/label-conversion.ts';
import { foodLineFromLabel } from '../../domain/label-conversion.ts';
import { saveFoodDraft } from './save-food-draft.ts';

export function saveLabelDraft(
  tx: Transaction,
  context: ExecutionContext,
  input: Omit<Parameters<typeof saveFoodDraft>[2], 'lines'> & { lines: readonly LabelLine[] },
) {
  return saveFoodDraft(tx, context, { ...input, lines: input.lines.map(foodLineFromLabel) });
}
