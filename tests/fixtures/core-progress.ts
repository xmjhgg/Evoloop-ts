import { randomUUID } from 'node:crypto';
import { setup, fixedNow } from './local.ts';
import type { Json } from '@evoloop/kernel';
import type { Goal, PlanItem, WeekPlan } from '@evoloop/client-business-core/planning';

export async function progressRuntime() {
  const runtime = await setup();
  let now = fixedNow;
  runtime.settings.now = () => now;
  return {
    ...runtime,
    at(value: string) {
      now = value;
    },
    async execute<T>(type: string, payload: unknown): Promise<T> {
      return (await runtime.bus.execute({ ...runtime.command(type, payload), occurredAt: now })) as T;
    },
  };
}
/** A historical fixture, never a production policy override or a path that approves publication. */
export async function seedHistoricalWeek(
  runtime: Awaited<ReturnType<typeof progressRuntime>>,
  goal: Goal,
  items: readonly PlanItem[],
  start: string,
) {
  const tx = runtime.bus.transaction(),
    id = goal.id + '|' + start;
  const week: WeekPlan = {
    id,
    version: '1',
    revisionId: randomUUID(),
    goalId: goal.id,
    weekStart: start,
    draft: items,
    published: items,
    review: null,
    publications: [{ id: randomUUID(), at: runtime.settings.now(), items }],
  };
  tx.store('planning').save('week', week);
  await runtime.bus.persist({ ...runtime.bus.snapshot(), rows: tx.rows });
  return week;
}
export function asRecord(value: Json): Record<string, Json> {
  return value as Record<string, Json>;
}
