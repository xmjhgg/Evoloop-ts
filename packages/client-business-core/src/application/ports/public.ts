import type { Json } from '@evoloop/kernel';

export type Domain = 'profile' | 'planning' | 'execution' | 'review';
export interface Entity {
  readonly id: string;
  readonly version: string;
  readonly revisionId: string;
}
export interface Repository {
  get<T extends Entity>(collection: string, id: string): T | null;
  all<T extends Entity>(collection: string): readonly T[];
  history<T extends Entity>(collection: string, id: string): readonly T[];
  save<T extends Entity>(collection: string, entity: T): void;
}
export interface SourceSet {
  readonly refs: readonly { collection: string; id: string; revisionId: string }[];
  readonly tokens: Readonly<Record<string, string>>;
}
export interface Transaction {
  readonly accountId: string;
  store(domain: Domain): Repository;
  token(key: string): string;
  bump(key: string): void;
  capture(keys: readonly string[], refs?: SourceSet['refs']): SourceSet;
  fresh(sources: SourceSet): boolean;
  hasRevision(collection: string, id: string, revisionId: string): boolean;
  invalidate(keys: readonly string[]): void;
}
export interface ExecutionContext {
  readonly accountId: string;
  readonly unlocked: boolean;
  readonly healthAllowed: boolean;
  readonly aiAllowed: boolean;
  readonly now: string;
  readonly commandId: string;
  readonly rulesVersion: string;
  /** IDs are derived from a frozen command seed; replay reuses the same IDs. */
  id(label: string): string;
}
export interface LocalCommand {
  readonly commandId: string;
  readonly commandType: string;
  readonly commandVersion: string;
  readonly accountId: string;
  readonly occurredAt: string;
  readonly expectedVersions: Readonly<Record<string, string>>;
  readonly dependencies: readonly string[];
  readonly payload: Json;
}
export type CommandHandler = (tx: Transaction, context: ExecutionContext, command: LocalCommand) => Json;
