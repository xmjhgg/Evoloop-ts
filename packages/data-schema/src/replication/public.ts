import { z } from 'zod';

/** Structural replication only. These declarations never import a business handler. */
export const tables = ['profile.condition', 'profile.observation', 'planning.goal', 'planning.week', 'planning.guard', 'planning.candidate',
  'execution.fact', 'execution.food-draft', 'review.document', 'review.adjustment', 'system.token', 'system.revision'] as const;
export const payloadSchemaVersion = 'documents-v1';
export const version = z.string().regex(/^(0|[1-9]\d*)$/).max(30);
/** JSON Schema counts Unicode code points; do not use JS UTF-16 length for protocol bounds. */
export function text(minLength: number, maxLength: number) {
  return z.string().superRefine((value, context) => {
    const length = [...value].length;
    if (length < minLength || length > maxLength) context.addIssue({ code: 'custom', message: 'String length out of range' });
  }).meta({ minLength, maxLength });
}
export const rowSchema = z.object({
  accountId: z.string().uuid(), id: text(1, 240), version, revisionId: z.string().uuid(),
  data: text(2, 1048576),
}).strict();
export const changeSchema = z.object({
  table: z.enum(tables), id: text(1, 240), before: rowSchema.nullable(), after: rowSchema.nullable(),
}).strict();
export type Row = z.infer<typeof rowSchema>;
export type Change = z.infer<typeof changeSchema>;
export type TableName = typeof tables[number];
export type TableRowMap = { [K in TableName]: Row };
