import { z } from 'zod';
import { canonical } from '@evoloop/kernel';
import type { Json } from '@evoloop/kernel';
import type { CommandHandler } from '../../application/ports/public.ts';

export const version = z.string().regex(/^(0|[1-9]\d*)$/).max(30);
export const id = z.string().min(1).max(240);
export const amount = z.string().regex(/^-?(0|[1-9]\d*)(\.\d+)?$/).max(40);
export const nullableId = id.nullable();
export const jsonValue: z.ZodType<Json> = z.lazy(() => z.union([z.null(), z.boolean(), z.string(), z.array(jsonValue), z.record(z.string(), jsonValue)]));
export function handler<S extends z.ZodType>(schema: S, run: (tx: Parameters<CommandHandler>[0], context: Parameters<CommandHandler>[1], input: z.output<S>) => unknown): CommandHandler {
  return (tx, context, command): Json => {
    const result = run(tx, context, schema.parse(command.payload));
    return JSON.parse(canonical(result)) as Json;
  };
}
export const commandSchema = z.object({ commandId: z.string().uuid(), commandType: z.string().min(1).max(100),
  commandVersion: z.literal('1'), accountId: z.string().uuid(), occurredAt: z.string(),
  expectedVersions: z.record(z.string(), version), dependencies: z.array(z.string().uuid()).max(1000), payload: z.json() }).strict();
