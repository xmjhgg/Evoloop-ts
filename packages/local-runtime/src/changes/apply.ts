import { canonical, copy, requireThat } from '@evoloop/kernel';
import type { Change, Row, TableName } from '@evoloop/data-schema/replication';
import type { State } from '../ports/public.ts';

export function applyRows(rows: State['rows'], changes: readonly Change[]): State['rows'] {
  const next: Partial<Record<TableName, Row[]>> = Object.fromEntries(Object.entries(rows).map(([key, values]) => [key, copy([...values])]));
  const keys = new Set<string>();
  for (const change of changes) {
    const key = change.table + '|' + change.id;
    requireThat(!keys.has(key), 'DUPLICATE_CHANGE');
    keys.add(key);
    const previous = next[change.table]?.find(row => row.id === change.id) ?? null;
    requireThat(canonical(previous) === canonical(change.before), 'SYNC_BEFORE_IMAGE_MISMATCH');
    next[change.table] = [...next[change.table] ?? []].filter(row => row.id !== change.id);
    if (change.after) next[change.table]!.push(copy(change.after));
  }
  return next;
}
