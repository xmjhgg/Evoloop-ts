import { aiRequestSchema } from '@evoloop/contracts';
import { z } from 'zod';
import type { AiBookmark } from './ports.ts';

export const bookmarkSchema = z
  .object({
    key: z.string().min(1).max(240),
    request: aiRequestSchema,
    taskId: z.string().uuid().nullable(),
    target: z
      .object({
        kind: z.enum(['plan-review', 'plan-draft', 'review', 'food']),
        id: z.string(),
        expectedVersion: z.string(),
        componentId: z.string().nullable(),
        input: z.string(),
        inputDigest: z.string().regex(/^[a-f0-9]{64}$/),
        assetRefs: z.array(z.string()).optional(),
      })
      .strict(),
  })
  .strict();
export function parseBookmark(value: unknown): AiBookmark {
  const parsed = bookmarkSchema.parse(value),
    { assetRefs, ...target } = parsed.target;
  return { ...parsed, target: { ...target, ...(assetRefs === undefined ? {} : { assetRefs }) } };
}
