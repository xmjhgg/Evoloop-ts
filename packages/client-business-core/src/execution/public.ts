export type { Fact, FoodDraft, FoodLine, Nutrition, Training, Learning, Sleep, Meal } from './domain/model.ts';
export { saveFact } from './application/commands/save-fact.ts';
export { saveFoodDraft, acceptFoodCandidate, foodInputDigest } from './application/commands/save-food-draft.ts';
export { confirmIntake } from './application/commands/confirm-intake.ts';
export { factsOn, hasActual, intakeSummary, learningQuantities } from './application/queries/facts.ts';
export { validateExecutionImport } from './application/queries/validate-import.ts';
export { removeFact } from './application/commands/remove-fact.ts';
export { executionHistory } from './application/queries/history.ts';
export { foodDrafts, recordHistoryIndex, foodEvidence } from './application/queries/food-drafts.ts';
