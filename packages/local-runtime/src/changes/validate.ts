import { canonical, requireThat } from '@evoloop/kernel';
import { rowSchema, tables } from '@evoloop/data-schema/replication';
import type { TableName } from '@evoloop/data-schema/replication';
import { validateDocument } from '@evoloop/client-business-core/commands';
import type { State } from '../ports/public.ts';

export function validateRows(rows: State['rows'], accountId: string): void {
  for (const [name, values] of Object.entries(rows)) {
    requireThat(tables.includes(name as TableName), 'COLLECTION_NOT_ALLOWED');
    const seen = new Set<string>();
    for (const input of values) {
      const row = rowSchema.parse(input);
      requireThat(row.accountId === accountId && !seen.has(row.id), 'OWNER_OR_KEY_INVALID');
      seen.add(row.id);
      const value = JSON.parse(row.data) as { id: string; revisionId: string; version: string };
      requireThat(canonical(value) === row.data && value.revisionId === row.revisionId && value.version === row.version, 'DOCUMENT_INVALID');
      if (name === 'system.revision') {
        const separator = row.id.indexOf('|'), original = row.id.slice(0, separator);
        requireThat(separator > 0 && row.id === original + '|' + value.id + '|' + value.revisionId, 'HISTORY_KEY_INVALID');
        validateDocument(original, value);
      } else {
        requireThat(value.id === row.id, 'KEY_MISMATCH');
        validateDocument(name, value);
      }
    }
  }
}
