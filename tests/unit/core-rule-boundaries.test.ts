import test from 'node:test';
import assert from 'node:assert/strict';
import { CommandBus } from '@evoloop/local-runtime';
import { digest } from '@evoloop/kernel';
import type { Goal, WeekPlan } from '@evoloop/client-business-core/planning';
import type { Adjustment, ReviewDocument } from '@evoloop/client-business-core/review';
import { confirmationFingerprint, reviewDocument } from '@evoloop/client-business-core/review';
import { goalInput, prescription, training } from '../fixtures/local.ts';
import { progressRuntime } from '../fixtures/core-progress.ts';

test('structural workout validation rejects fractional repetitions/rest without inventing intensity thresholds', async () => {
  const runtime = await progressRuntime(),
    goal = await runtime.execute<Goal>('planning.goal.save', { ...goalInput, category: 'FITNESS' });
  const action = { id: 'squat', name: 'Squat', sets: '3', quantity: '10', unit: 'REP', restSeconds: '0' };
  const input = {
    goalId: goal.id,
    weekStart: '2026-10-19',
    expectedVersion: '0',
    changes: [
      {
        id: null,
        businessDate: '2026-10-19',
        kind: 'TRAINING',
        disposition: 'PLANNED',
        prescription: { ...prescription, learning: null, actions: [action] },
      },
    ],
  };
  await assert.rejects(
    runtime.execute('planning.week.patch-draft', {
      ...input,
      changes: [
        {
          ...input.changes[0],
          prescription: { ...input.changes[0]!.prescription, actions: [{ ...action, quantity: '1.5' }] },
        },
      ],
    }),
    /INVALID_ACTION/,
  );
  await assert.rejects(
    runtime.execute('planning.week.patch-draft', {
      ...input,
      changes: [
        {
          ...input.changes[0],
          prescription: { ...input.changes[0]!.prescription, actions: [{ ...action, restSeconds: '0.5' }] },
        },
      ],
    }),
    /INVALID_ACTION/,
  );
  const saved = await runtime.execute<WeekPlan>('planning.week.patch-draft', input);
  assert.equal(saved.draft[0]?.prescription.actions[0]?.restSeconds, '0');
});

test('all-UNKNOWN body state is absent evidence, not a measured observation', async () => {
  const runtime = await progressRuntime(),
    before = digest(runtime.bus.snapshot());
  await assert.rejects(
    runtime.execute('profile.observation.save', {
      id: null,
      expectedVersion: '0',
      kind: 'BODY_STATE',
      observedAt: runtime.settings.now(),
      remove: false,
      values: { feeling: { value: 'UNKNOWN', unit: 'SELF_REPORT' } },
    }),
    /EMPTY_BODY_STATE/,
  );
  assert.equal(digest(runtime.bus.snapshot()), before);
});

test('fitness GOAL slots cannot bypass health-purpose restrictions', async () => {
  const runtime = await progressRuntime(),
    goal = await runtime.execute<Goal>('planning.goal.save', { ...goalInput, category: 'FITNESS' });
  const lockedPurpose = new CommandBus(runtime.store, {
    ...runtime.settings,
    access: () => ({ ...runtime.settings.access(), healthAllowed: false }),
  });
  await lockedPurpose.open();
  await assert.rejects(
    lockedPurpose.execute(
      runtime.command('review.refresh', {
        scope: { period: 'DAILY', date: '2026-10-17', goalId: goal.id, slot: 'GOAL:' + goal.id },
        expectedVersion: '0',
        manualText: 'Manual judgment',
        manualFinal: true,
      }),
    ),
    /PURPOSE_REQUIRED/,
  );
});

test('source changes expire adjustment candidates and refresh dependent weeks without publishing future changes', async () => {
  const runtime = await progressRuntime(),
    goal = await runtime.execute<Goal>('planning.goal.save', goalInput);
  const week = await runtime.execute<WeekPlan>('planning.week.patch-draft', {
    goalId: goal.id,
    weekStart: '2026-10-19',
    expectedVersion: '0',
    changes: [{ id: null, businessDate: '2026-10-19', kind: 'LEARNING', disposition: 'PLANNED', prescription }],
  });
  const daily = await runtime.execute<ReviewDocument>('review.refresh', {
    scope: { period: 'DAILY', date: '2026-10-17', goalId: null, slot: 'LEARNING' },
    expectedVersion: '0',
    manualText: 'Learn',
    manualFinal: true,
  });
  const ids = [daily.components[0]!.id];
  const confirmed = await runtime.execute<ReviewDocument>('review.scope.confirm', {
    documentId: daily.id,
    expectedVersion: daily.version,
    componentIds: ids,
    fingerprint: confirmationFingerprint(daily, ids),
    explicitConfirm: true,
  });
  const old = week.draft[0]!;
  const suggestion = await runtime.execute<Adjustment>('review.adjustment.propose', {
    documentId: daily.id,
    expectedVersion: confirmed.version,
    componentIds: ids,
    weekId: week.id,
    changes: [
      {
        itemId: old.id,
        oldValue: old,
        proposed: { ...old, prescription: { ...old.prescription, title: 'More reading' } },
        reason: 'Judgment',
      },
    ],
  });
  await runtime.execute('review.refresh', {
    scope: { period: 'WEEKLY', date: '2026-10-12', goalId: goal.id, slot: 'GOAL:' + goal.id },
    expectedVersion: '0',
    manualText: null,
    manualFinal: false,
  });
  const weeklyBefore = reviewDocument(runtime.bus.transaction(), 'weekly|' + goal.id + '|2026-10-12')!;
  await runtime.execute('execution.fact.save', {
    ...training,
    data: { kind: 'LEARNING', status: 'PARTIAL', durationMinutes: '10', fragments: [], outcome: 'Notes' },
  });
  assert.equal(runtime.bus.transaction().store('review').get<Adjustment>('adjustment', suggestion.id)?.status, 'STALE');
  const weeklyAfter = reviewDocument(runtime.bus.transaction(), weeklyBefore.id)!;
  assert.notEqual(weeklyAfter.revisionId, weeklyBefore.revisionId);
  assert.equal(weeklyAfter.components[0]?.stale, false);
  assert.equal(
    runtime.bus.transaction().store('planning').get<WeekPlan>('week', week.id)?.draft[0]?.prescription.title,
    old.prescription.title,
  );
  const dismissed = await runtime.execute<Adjustment>('review.adjustment.dismiss', {
    adjustmentId: suggestion.id,
    expectedVersion: '2',
  });
  assert.equal(dismissed.status, 'DISMISSED');
});

test('a restored review cannot replace deterministic metrics while retaining an unchanged input digest', async () => {
  const runtime = await progressRuntime();
  const document = await runtime.execute<ReviewDocument>('review.refresh', {
    scope: { period: 'DAILY', date: '2026-10-17', goalId: null, slot: 'LEARNING' },
    expectedVersion: '0',
    manualText: null,
    manualFinal: false,
  });
  const tx = runtime.bus.transaction();
  tx.store('review').save('document', {
    ...document,
    version: '2',
    revisionId: runtime.command('unused', {}).commandId,
    components: document.components.map((component) => ({ ...component, metrics: [] })),
  });
  await runtime.bus.persist({ ...runtime.bus.snapshot(), rows: tx.rows });
  const restarted = new CommandBus(runtime.store, runtime.settings);
  await assert.rejects(restarted.open(), /REVIEW_METRICS_MISMATCH/);
});
