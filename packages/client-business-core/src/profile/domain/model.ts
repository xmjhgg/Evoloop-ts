import type { Entity } from '../../application/ports/public.ts';
import type { Json } from '@evoloop/kernel';

export type ConditionSection = 'COMMON' | 'FITNESS' | 'LEARNING';
export interface Condition extends Entity {
  readonly section: ConditionSection;
  readonly values: Readonly<Record<string, Json>>;
}
export interface Observation extends Entity {
  readonly kind: 'MEASUREMENT' | 'BODY_STATE';
  readonly status: 'ACTIVE' | 'REMOVED';
  readonly observedAt: string;
  readonly businessDate: string;
  readonly values: Readonly<Record<string, { readonly value: string | null; readonly unit: string }>>;
}
