import type { Json } from '@evoloop/kernel';
import type { Entity, SourceSet } from '../../application/ports/public.ts';
import type { PlanItem } from '../../planning/public.ts';

export interface ReviewScope {
  readonly period: 'DAILY' | 'WEEKLY';
  readonly date: string;
  readonly goalId: string | null;
  readonly slot: string;
}
export interface ReviewComponent {
  readonly id: string;
  readonly slot: string;
  readonly sources: SourceSet;
  readonly inputDigest: string;
  readonly input: string;
  readonly cutoff: string;
  readonly metrics: Json;
  readonly coverage: Json;
  readonly text: string;
  readonly state: 'SUMMARY_ONLY' | 'MANUAL_FINAL_JUDGMENT' | 'AWAITING_CONFIRMATION';
  readonly stale: boolean;
}
export interface ReviewDocument extends Entity {
  readonly period: ReviewScope['period'];
  readonly date: string;
  readonly goalId: string | null;
  readonly components: readonly ReviewComponent[];
  readonly manual: readonly { id: string; slot: string; text: string; removed: boolean }[];
  readonly confirmations: readonly { id: string; componentIds: readonly string[]; fingerprint: string; at: string; stale: boolean }[];
}
export interface Adjustment extends Entity {
  readonly documentId: string;
  readonly componentIds: readonly string[];
  readonly sources: SourceSet;
  readonly weekId: string;
  readonly changes: readonly { itemId: string; oldValue: PlanItem; proposed: PlanItem; reason: string }[];
  readonly status: 'READY' | 'SUBMITTED' | 'DISMISSED' | 'STALE';
}
