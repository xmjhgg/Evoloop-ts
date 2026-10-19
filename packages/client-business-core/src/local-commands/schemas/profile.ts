import { z } from 'zod';
import { editCondition, saveObservation } from '../../profile/public.ts';
import { handler, id, nullableId, version, jsonValue } from './common.ts';

export const profileHandlers = {
  'profile.condition.edit': handler(z.object({ section: z.enum(['COMMON', 'FITNESS', 'LEARNING']), expectedVersion: version,
    updateMask: z.array(id).min(1), values: z.record(z.string(), jsonValue) }).strict(), editCondition),
  'profile.observation.save': handler(z.object({ id: nullableId, expectedVersion: version,
    kind: z.enum(['MEASUREMENT', 'BODY_STATE']), observedAt: z.string(), remove: z.boolean(),
    values: z.record(id, z.object({ value: z.string().nullable(), unit: id }).strict()) }).strict(), saveObservation),
};
