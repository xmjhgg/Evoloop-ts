import { canonical, copy, nextVersion, requireThat } from '@evoloop/kernel';
import type { Domain, Entity, Repository, SourceSet, Transaction } from '@evoloop/client-business-core/ports';
import type { Row, TableName } from '@evoloop/data-schema/replication';
import { tables } from '@evoloop/data-schema/replication';
import type { State } from '../ports/public.ts';

export class LocalTransaction implements Transaction {
  readonly rows: Partial<Record<TableName, Row[]>>;
  readonly changedTokens = new Set<string>();
  constructor(readonly accountId: string, rows: State['rows'], private revisionId: (label: string) => string) {
    this.rows = Object.fromEntries(Object.entries(rows).map(([key, values]) => [key, copy([...values])])) as Partial<Record<TableName, Row[]>>;
  }
  store(domain: Domain): Repository {
    const tableFor = (name: string): TableName => {
      const table = domain + '.' + name;
      requireThat(tables.includes(table as TableName), 'COLLECTION_NOT_ALLOWED');
      return table as TableName;
    };
    return {
      get: <T extends Entity>(name: string, id: string): T | null => {
        const row = this.rows[tableFor(name)]?.find(value => value.id === id);
        return row ? JSON.parse(row.data) as T : null;
      },
      all: <T extends Entity>(name: string): readonly T[] => (this.rows[tableFor(name)] ?? []).map(row => JSON.parse(row.data) as T),
      history: <T extends Entity>(name: string, id: string): readonly T[] => {
        const table = tableFor(name);
        const historical = (this.rows['system.revision'] ?? []).filter(row => row.id.startsWith(table + '|' + id + '|'));
        const current = this.rows[table]?.find(row => row.id === id);
        return [...historical, ...current ? [current] : []].map(row => JSON.parse(row.data) as T).filter(entity => entity.id === id).sort((a, b) => BigInt(a.version) < BigInt(b.version) ? -1 : 1);
      },
      save: <T extends Entity>(name: string, entity: T): void => this.save(tableFor(name), entity),
    };
  }
  private save(table: TableName, entity: Entity): void {
    const row: Row = { accountId: this.accountId, id: entity.id, version: entity.version, revisionId: entity.revisionId, data: canonical(entity) };
    const previous = this.rows[table]?.find(value => value.id === row.id);
    if (previous) {
      requireThat(previous.revisionId !== row.revisionId || previous.data === row.data, 'REVISION_REUSED');
      const historical: Row = { ...previous, id: table + '|' + previous.id + '|' + previous.revisionId };
      this.rows['system.revision'] = [...this.rows['system.revision'] ?? []].filter(value => value.id !== historical.id).concat(historical);
    }
    this.rows[table] = (this.rows[table] ?? []).filter(value => value.id !== row.id).concat(row);
  }
  token(key: string): string { return this.rows['system.token']?.find(row => row.id === key)?.version ?? '0'; }
  bump(key: string): void {
    this.changedTokens.add(key);
    this.save('system.token', { id: key, version: nextVersion(this.token(key)), revisionId: this.revisionId('token:' + key + ':' + this.token(key)) });
  }
  capture(keys: readonly string[], refs: SourceSet['refs'] = []): SourceSet {
    return { refs, tokens: Object.fromEntries(keys.slice().sort().map(key => [key, this.token(key)])) };
  }
  fresh(sources: SourceSet): boolean {
    return Object.entries(sources.tokens).every(([key, version]) => this.token(key) === version)
      && sources.refs.every(ref => this.rows[ref.collection as TableName]?.some(row => row.id === ref.id && row.revisionId === ref.revisionId));
  }
  invalidate(_keys: readonly string[]): void { /* The command bus applies core freshness propagation before commit. */ }
  hasRevision(collection: string, id: string, revisionId: string): boolean {
    return this.rows[collection as TableName]?.some(row => row.id === id && row.revisionId === revisionId) === true
      || this.rows['system.revision']?.some(row => row.id === collection + '|' + id + '|' + revisionId) === true;
  }
}
