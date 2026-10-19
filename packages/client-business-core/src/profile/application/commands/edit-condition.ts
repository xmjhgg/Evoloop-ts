import { canonical, requireThat } from '@evoloop/kernel';
import type { Json } from '@evoloop/kernel';
import type { Transaction, ExecutionContext } from '../../../application/ports/public.ts';
import { expected, revision } from '../../../application/ports/entity.ts';
import type { Condition, ConditionSection } from '../../domain/model.ts';

const fields: Record<ConditionSection, readonly string[]> = {
  COMMON: ['timezone', 'routine', 'availability'],
  FITNESS: ['experience', 'equipment', 'limitations', 'body', 'discomfort'],
  LEARNING: ['resources', 'preferences', 'availability'],
};
export function editCondition(tx: Transaction, context: ExecutionContext, input: {
  section: ConditionSection; expectedVersion: string; updateMask: readonly string[]; values: Readonly<Record<string, Json>>;
}): Condition {
  requireThat(input.section !== 'FITNESS' || context.healthAllowed, 'PURPOSE_REQUIRED');
  const repository = tx.store('profile'), previous = repository.get<Condition>('condition', input.section);
  expected(previous, input.expectedVersion);
  requireThat(input.updateMask.length > 0 && new Set(input.updateMask).size === input.updateMask.length, 'INVALID_UPDATE_MASK');
  const values = { ...previous?.values };
  for (const field of input.updateMask) {
    requireThat(fields[input.section].includes(field) && Object.hasOwn(input.values, field), 'FIELD_NOT_APPLICABLE');
    values[field] = input.values[field]!;
  }
  if (previous && canonical(values) === canonical(previous.values)) return previous;
  const entity: Condition = { ...revision(context, 'condition:' + input.section, previous), id: input.section, section: input.section, values };
  repository.save('condition', entity);
  const key = 'profile:CONDITIONS:' + input.section;
  tx.bump(key);
  tx.invalidate([key]);
  return entity;
}
