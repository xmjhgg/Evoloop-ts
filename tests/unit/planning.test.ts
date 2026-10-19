import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, goalInput, prescription } from '../fixtures/local.ts';
import type { Goal, WeekPlan } from '@evoloop/client-business-core/planning';
import { planningHistory } from '@evoloop/client-business-core/planning';

test('draft edits do not bump applicable-plan tokens; learning review and explicit selected publication work', async () => {
  const { bus, execute } = await setup();
  const goal = await execute<Goal>('planning.goal.save', goalInput);
  const week = await execute<WeekPlan>('planning.week.patch-draft', { goalId: goal.id, weekStart: '2026-10-19', expectedVersion: '0',
    changes: [{ id: null, businessDate: '2026-10-19', kind: 'LEARNING', disposition: 'PLANNED', prescription }] });
  assert.equal(bus.transaction().token('planning:PLAN_DAY:2026-10-19'), '0');
  const reviewed = await execute<WeekPlan>('planning.week.review', { weekId: week.id, expectedVersion: week.version, channel: 'RULES' });
  assert.equal(reviewed.review?.status, 'READY');
  await assert.rejects(execute('planning.week.publish', { weekId: week.id, expectedVersion: reviewed.version, explicitConfirm: false,
    selected: [{ itemId: week.draft[0]!.id, expectedPublishedRevision: null }] }), /EXPLICIT_CONFIRMATION_REQUIRED/);
  const published = await execute<WeekPlan>('planning.week.publish', { weekId: week.id, expectedVersion: reviewed.version, explicitConfirm: true,
    selected: [{ itemId: week.draft[0]!.id, expectedPublishedRevision: null }] });
  assert.equal(published.published.length, 1);
  assert.equal(bus.transaction().token('planning:PLAN_DAY:2026-10-19'), '1');
  assert.deepEqual(planningHistory(bus.transaction(), 'week', goal.id), []);
  const { revisionId: _revision, goalRevisionId: _goalRevision, ...item } = week.draft[0]!;
  const patched = await execute<WeekPlan>('planning.week.patch-draft', { goalId: goal.id, weekStart: '2026-10-19', expectedVersion: published.version,
    changes: [{ ...item, prescription: { ...prescription, title: 'Changed' } }] });
  assert.equal(patched.review, null);
  assert.equal(patched.published[0]?.prescription.title, 'Read chapter');
  assert.equal(bus.transaction().token('planning:PLAN_DAY:2026-10-19'), '1');
});
test('unapproved fitness policy remains INFORMATION_REQUIRED and cannot publish', async () => {
  const { execute } = await setup();
  const goal = await execute<Goal>('planning.goal.save', { ...goalInput, category: 'FITNESS' });
  const week = await execute<WeekPlan>('planning.week.patch-draft', { goalId: goal.id, weekStart: '2026-10-19', expectedVersion: '0',
    changes: [{ id: null, businessDate: '2026-10-19', kind: 'TRAINING', disposition: 'PLANNED', prescription: { ...prescription, learning: null } }] });
  const reviewed = await execute<WeekPlan>('planning.week.review', { weekId: week.id, expectedVersion: week.version, channel: 'RULES' });
  assert.equal(reviewed.review?.status, 'INFORMATION_REQUIRED');
  await assert.rejects(execute('planning.week.publish', { weekId: week.id, expectedVersion: reviewed.version, explicitConfirm: true,
    selected: [{ itemId: week.draft[0]!.id, expectedPublishedRevision: null }] }), /INFORMATION_REQUIRED/);
});
