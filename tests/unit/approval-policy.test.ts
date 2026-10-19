import test from 'node:test';
import assert from 'node:assert/strict';
import { CommandBus } from '@evoloop/local-runtime';
import type { Goal, WeekPlan } from '@evoloop/client-business-core/planning';
import { setup, goalInput, prescription } from '../fixtures/local.ts';

test('a local ALLOWED flag cannot replace an approved fitness policy release', async () => {
  const runtime = await setup();
  const goal = await runtime.execute<Goal>('planning.goal.save', { ...goalInput, category: 'FITNESS' });
  const week = await runtime.execute<WeekPlan>('planning.week.patch-draft', { goalId: goal.id, weekStart: '2026-10-19', expectedVersion: '0',
    changes: [{ id: null, businessDate: '2026-10-19', kind: 'TRAINING', disposition: 'PLANNED', prescription: { ...prescription, learning: null } }] });
  const overridden = new CommandBus(runtime.store, { ...runtime.settings, fitnessPolicy: () => 'ALLOWED',
    access: () => ({ unlocked: true, healthAllowed: true, aiAllowed: true, rulesVersion: 'pretend-approved' }) });
  await overridden.open();
  const reviewed = await overridden.execute(runtime.command('planning.week.review', { weekId: week.id, expectedVersion: week.version, channel: 'RULES' })) as unknown as WeekPlan;
  assert.equal(reviewed.review?.status, 'INFORMATION_REQUIRED');
});
