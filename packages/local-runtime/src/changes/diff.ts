import { canonical } from '@evoloop/kernel';
import { tables } from '@evoloop/data-schema/replication';
import type { Change } from '@evoloop/data-schema/replication';
import type { State } from '../ports/public.ts';

export function diffRows(before: State['rows'], after: State['rows']): Change[] {
  const changes: Change[] = [];
  for (const table of tables) {
    const old = new Map((before[table] ?? []).map(row => [row.id, row]));
    const next = new Map((after[table] ?? []).map(row => [row.id, row]));
    for (const id of new Set([...old.keys(), ...next.keys()])) {
      const previous = old.get(id) ?? null, current = next.get(id) ?? null;
      if (canonical(previous) !== canonical(current)) changes.push({ table, id, before: previous, after: current });
    }
  }
  return changes.sort((a, b) => (a.table + '|' + a.id).localeCompare(b.table + '|' + b.id, 'en'));
}
