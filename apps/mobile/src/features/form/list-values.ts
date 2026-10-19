import { z } from 'zod';
export function listValues(input: string | undefined): readonly Readonly<Record<string, string>>[] {
  return z
    .array(z.record(z.string(), z.string()))
    .max(200)
    .parse(JSON.parse(input ?? '[]'));
}
