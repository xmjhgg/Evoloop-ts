import type { z } from 'zod';
import type { aiTaskSchema } from '@evoloop/contracts';
export type CandidateTask = z.infer<typeof aiTaskSchema>;
