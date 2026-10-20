import type { Entity, SourceSet } from '../../application/ports/public.ts';

export interface Goal extends Entity {
  readonly category: 'FITNESS' | 'LEARNING';
  readonly name: string;
  readonly description: string;
  readonly measure: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: 'ACTIVE' | 'PAUSED' | 'PENDING_REPLAN' | 'ARCHIVED';
}
export interface NutrientAmounts {
  readonly energy: string | null;
  readonly protein: string | null;
  readonly carbohydrate: string | null;
  readonly fat: string | null;
}
export interface MealAllocation extends NutrientAmounts {
  readonly mealCode: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  readonly startAt: string | null;
  readonly description: string;
}
export interface NutritionTarget extends NutrientAmounts {
  readonly unit: 'kcal/g';
  readonly meals?: readonly MealAllocation[] | undefined;
}
export interface Prescription {
  readonly title: string;
  readonly startAt: string | null;
  readonly minutes: string | null;
  readonly actions: readonly { id: string; name: string; sets: string; quantity: string; unit: 'REP' | 'SECOND' | 'MINUTE'; restSeconds: string }[];
  readonly learning: { topic: string; unit: 'MINUTE' | 'PAGE' | 'QUESTION' | null; quantity: string | null; outcome: string } | null;
  readonly nutrition: NutritionTarget | null;
}
export interface PlanItem {
  readonly id: string;
  readonly revisionId: string;
  readonly goalRevisionId: string;
  readonly businessDate: string;
  readonly kind: 'TRAINING' | 'LEARNING' | 'SLEEP' | 'NUTRITION_TOTAL' | 'REST';
  readonly disposition: 'PLANNED' | 'REMOVED' | 'SUSPENDED';
  readonly prescription: Prescription;
}
export interface PlanReview {
  readonly id: string;
  readonly channel: 'RULES' | 'AI';
  readonly fingerprint: string;
  readonly input: string;
  readonly inputDigest: string;
  readonly rulesVersion: string;
  readonly sources: SourceSet;
  readonly status: 'READY' | 'BLOCKED' | 'INFORMATION_REQUIRED';
  readonly issues: readonly string[];
  readonly candidate: string | null;
}
export interface PlanCandidate extends Entity {
  readonly goalId: string;
  readonly weekStart: string;
  readonly expectedWeekVersion: string;
  readonly sources: SourceSet;
  readonly input: string;
  readonly inputDigest: string;
  readonly status: 'WAITING' | 'ACCEPTED';
}
export interface WeekPlan extends Entity {
  readonly goalId: string;
  readonly weekStart: string;
  readonly draft: readonly PlanItem[];
  readonly published: readonly PlanItem[];
  readonly review: PlanReview | null;
  readonly publications: readonly { id: string; at: string; items: readonly PlanItem[] }[];
}
export interface BaselineRef {
  readonly weekId: string;
  readonly goalId: string;
  readonly item: PlanItem;
}
export interface Protection extends Entity {
  readonly businessDate: string;
  readonly kind: string;
  readonly refs: readonly BaselineRef[];
  readonly frozenAbsence: boolean;
}
