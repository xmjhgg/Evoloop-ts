import type { Entity } from '../../application/ports/public.ts';
import type { BaselineRef } from '../../planning/public.ts';

export type Completion = 'COMPLETED' | 'PARTIAL' | 'NOT_PERFORMED';
export interface Training {
  readonly kind: 'TRAINING';
  readonly status: Completion;
  readonly durationMinutes: string | null;
  readonly feeling: string;
  readonly actions: readonly { name: string; sets: readonly { quantity: string; unit: 'REP' | 'SECOND' | 'MINUTE'; loadKg: string | null }[] }[];
}
export interface Learning {
  readonly kind: 'LEARNING';
  readonly status: Completion;
  readonly durationMinutes: string | null;
  readonly outcome: string;
  readonly fragments: readonly { quantity: string; unit: 'MINUTE' | 'PAGE' | 'QUESTION' }[];
}
export interface Sleep {
  readonly kind: 'SLEEP';
  readonly beginAt: string;
  readonly endAt: string | null;
  readonly provisionalWakeDate: string;
}
export interface Nutrition {
  readonly state: 'KNOWN' | 'ESTIMATED' | 'UNKNOWN';
  readonly value: string | null;
  readonly lower: string | null;
  readonly upper: string | null;
  readonly unit: 'kcal' | 'g';
  readonly source: string;
}
export interface FoodLine {
  readonly id: string;
  readonly name: string;
  readonly personalFactor: string | null;
  readonly portionUnit: string;
  readonly energy: Nutrition;
  readonly protein: Nutrition;
  readonly carbohydrate: Nutrition;
  readonly fat: Nutrition;
}
export interface Meal {
  readonly kind: 'MEAL';
  readonly mealCode: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  readonly lines: readonly FoodLine[];
  readonly draftId: string;
  readonly unknownAccepted: boolean;
}
export interface Fact extends Entity {
  readonly businessDate: string;
  readonly status: 'ACTIVE' | 'REMOVED';
  readonly data: Training | Learning | Sleep | Meal;
  readonly baselineRefs: readonly BaselineRef[];
  readonly originalDate: string;
  readonly baselineDateMismatch: boolean;
}
export interface FoodDraft extends Entity {
  readonly businessDate: string;
  readonly mealCode: Meal['mealCode'];
  readonly evidence: readonly string[];
  readonly description: string;
  readonly lines: readonly FoodLine[];
  readonly factId: string | null;
  readonly candidateDigest: string | null;
  readonly confirmedRevisionId: string | null;
}
