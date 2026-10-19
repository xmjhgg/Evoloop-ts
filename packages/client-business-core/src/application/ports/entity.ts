import { nextVersion, requireThat } from '@evoloop/kernel';
import type { Entity, ExecutionContext, Repository } from './public.ts';

export function expected(entity: Entity | null, version: string): void {
  requireThat((entity?.version ?? '0') === version, 'VERSION_CONFLICT');
}
export function revision<T extends Entity>(context: ExecutionContext, label: string, previous: T | null): Entity {
  return { id: previous?.id ?? context.id(label), version: nextVersion(previous?.version ?? '0'), revisionId: context.id(label + ':revision') };
}
export function required<T extends Entity>(repository: Repository, collection: string, id: string): T {
  const entity = repository.get<T>(collection, id);
  requireThat(entity, 'NOT_FOUND');
  return entity;
}
