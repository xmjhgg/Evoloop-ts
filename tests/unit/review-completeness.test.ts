import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { canonical, digest } from '@evoloop/kernel';
import {
  confirmationFingerprint,
  confirmedComponents,
  reviewDocument,
  reviewInput,
} from '@evoloop/client-business-core/review';
import type { ReviewDocument } from '@evoloop/client-business-core/review';
import type { Goal, PlanItem, Prescription } from '@evoloop/client-business-core/planning';
import type { Fact } from '@evoloop/client-business-core/execution';
import { MemoryStore, setup, training, goalInput, prescription } from '../fixtures/local.ts';
import { asRecord, progressRuntime, seedHistoricalWeek } from '../fixtures/core-progress.ts';

const learningPrescription: Prescription = { ...prescription, learning: { ...prescription.learning, unit: 'PAGE' } };

test('first save derives a daily summary atomically, and retries do not duplicate summary revisions', async () => {
  const store = new MemoryStore(),
    runtime = await setup(store),
    command = runtime.command('execution.fact.save', training);
  store.fail = true;
  await assert.rejects(runtime.bus.execute(command), /DISK_FULL/);
  assert.equal(runtime.bus.snapshot().rows['review.document'], undefined);
  store.fail = false;
  await runtime.bus.execute(command);
  const document = reviewDocument(runtime.bus.transaction(), 'daily|2026-10-17')!;
  assert.equal(document.components[0]?.state, 'SUMMARY_ONLY');
  assert.equal(document.confirmations.length, 0);
  assert.ok(runtime.bus.snapshot().intents[0]?.changes.some((change) => change.table === 'review.document'));
  assert.deepEqual(asRecord(document.components[0]!.coverage)['recordedFactIds'], [
    runtime.bus.snapshot().rows['execution.fact']![0]!.id,
  ]);
  await runtime.bus.execute(command);
  assert.equal(reviewDocument(runtime.bus.transaction(), document.id)?.version, document.version);
  const restarted = await setup(store, runtime.settings.accountId);
  assert.equal(reviewDocument(restarted.bus.transaction(), document.id)?.revisionId, document.revisionId);
});

test('coverage excludes future/rest/paused ranges and retains missing past tasks and original goal revisions', async () => {
  const runtime = await progressRuntime(),
    goal = await runtime.execute<Goal>('planning.goal.save', goalInput);
  const item = (
    id: string,
    day: string,
    kind: PlanItem['kind'],
    disposition: PlanItem['disposition'],
    startAt: string | null,
  ): PlanItem => ({
    id,
    revisionId: randomUUID(),
    goalRevisionId: goal.revisionId,
    businessDate: day,
    kind,
    disposition,
    prescription: { ...learningPrescription, startAt },
  });
  await seedHistoricalWeek(
    runtime,
    goal,
    [
      item('missing', '2026-10-19', 'LEARNING', 'PLANNED', null),
      item('future', '2026-10-20', 'LEARNING', 'PLANNED', '2026-10-20T14:00:00.000Z'),
      item('rest', '2026-10-21', 'REST', 'PLANNED', null),
      item('paused', '2026-10-22', 'LEARNING', 'SUSPENDED', null),
    ],
    '2026-10-19',
  );
  runtime.at('2026-10-20T12:00:00.000Z');
  await runtime.execute('planning.goal.save', {
    ...goalInput,
    id: goal.id,
    expectedVersion: goal.version,
    name: 'New name',
  });
  const input = reviewInput(
    runtime.bus.transaction(),
    { period: 'WEEKLY', date: '2026-10-19', goalId: goal.id, slot: 'GOAL:' + goal.id },
    runtime.settings.now(),
  );
  const coverage = asRecord(input.coverage);
  assert.equal(coverage['expectedScopeCount'], '1');
  assert.equal(coverage['missingScopeCount'], '1');
  const metrics = input.metrics as Record<string, unknown>[];
  assert.equal((metrics[0]!['plans'] as Record<string, unknown>[])[0]!['goalName'], 'Read');
  assert.equal((metrics[1]!['plans'] as Record<string, unknown>[])[0]!['state'], 'PENDING');
  assert.equal((metrics[2]!['plans'] as Record<string, unknown>[])[0]!['state'], 'REST');
  assert.equal((metrics[3]!['plans'] as Record<string, unknown>[])[0]!['state'], 'PAUSED');
});

test('weekly inputs include each daily conclusion state and preserve unit-specific actuals without double counting', async () => {
  const runtime = await progressRuntime(),
    goal = await runtime.execute<Goal>('planning.goal.save', goalInput);
  const item: PlanItem = {
    id: 'learn',
    revisionId: randomUUID(),
    goalRevisionId: goal.revisionId,
    businessDate: '2026-10-19',
    kind: 'LEARNING',
    disposition: 'PLANNED',
    prescription: learningPrescription,
  };
  await seedHistoricalWeek(runtime, goal, [item], '2026-10-19');
  runtime.at('2026-10-20T12:00:00.000Z');
  await runtime.execute('execution.fact.save', {
    ...training,
    businessDate: '2026-10-19',
    planItemIds: [item.id],
    data: {
      kind: 'LEARNING',
      status: 'PARTIAL',
      durationMinutes: '20',
      outcome: 'notes',
      fragments: [
        { quantity: '20', unit: 'MINUTE' },
        { quantity: '5', unit: 'PAGE' },
      ],
    },
  });
  let daily = reviewDocument(runtime.bus.transaction(), 'daily|2026-10-19')!;
  daily = await runtime.execute<ReviewDocument>('review.refresh', {
    scope: { period: 'DAILY', date: '2026-10-19', goalId: goal.id, slot: 'GOAL:' + goal.id },
    expectedVersion: daily.version,
    manualText: 'Partial progress',
    manualFinal: true,
  });
  const ids = daily.components
    .filter((component) => component.slot === 'GOAL:' + goal.id)
    .map((component) => component.id);
  await runtime.execute('review.scope.confirm', {
    documentId: daily.id,
    expectedVersion: daily.version,
    componentIds: ids,
    fingerprint: confirmationFingerprint(daily, ids),
    explicitConfirm: true,
  });
  const input = reviewInput(
    runtime.bus.transaction(),
    { period: 'WEEKLY', date: '2026-10-19', goalId: goal.id, slot: 'GOAL:' + goal.id },
    runtime.settings.now(),
  );
  const metrics = input.metrics as Record<string, unknown>[];
  assert.equal((metrics[0]!['dailyConclusion'] as Record<string, unknown>)['state'], 'CONFIRMED');
  assert.equal((metrics[1]!['dailyConclusion'] as Record<string, unknown>)['state'], 'MISSING');
  assert.deepEqual(asRecord(asRecord(input.coverage)['summary']!)['learning'], { MINUTE: '20', PAGE: '5' });
});

test('correction refreshes old and new days, retains manual history, and never upgrades an old confirmation', async () => {
  const runtime = await progressRuntime();
  const first = await runtime.execute<Fact>('execution.fact.save', training);
  let document = reviewDocument(runtime.bus.transaction(), 'daily|2026-10-17')!;
  document = await runtime.execute<ReviewDocument>('review.refresh', {
    scope: { period: 'DAILY', date: '2026-10-17', goalId: null, slot: 'HEALTH' },
    expectedVersion: document.version,
    manualText: 'My judgment',
    manualFinal: true,
  });
  const ids = [document.components[0]!.id];
  await runtime.execute('review.scope.confirm', {
    documentId: document.id,
    expectedVersion: document.version,
    componentIds: ids,
    fingerprint: confirmationFingerprint(document, ids),
    explicitConfirm: true,
  });
  await runtime.execute('execution.fact.save', {
    ...training,
    id: first.id,
    expectedVersion: first.version,
    businessDate: '2026-10-16',
  });
  const oldDay = reviewDocument(runtime.bus.transaction(), document.id)!,
    newDay = reviewDocument(runtime.bus.transaction(), 'daily|2026-10-16')!;
  assert.deepEqual(confirmedComponents(runtime.bus.transaction(), oldDay), []);
  assert.equal(oldDay.manual[0]?.text, 'My judgment');
  assert.equal(oldDay.components[0]?.state, 'SUMMARY_ONLY');
  assert.equal((newDay.components[0]!.metrics as Record<string, unknown>[])[0]!['comparability'], 'UNAVAILABLE');
});

test('older metric snapshots remain preserved but cannot authorize current confirmations', async () => {
  const runtime = await progressRuntime();
  const document = await runtime.execute<ReviewDocument>('review.refresh', {
    scope: { period: 'DAILY', date: '2026-10-17', goalId: null, slot: 'LEARNING' },
    expectedVersion: '0',
    manualText: 'Old judgment',
    manualFinal: true,
  });
  const component = document.components[0]!,
    frozen = JSON.parse(component.input) as Record<string, unknown>;
  delete frozen['metricVersion'];
  const oldComponent = { ...component, input: canonical(frozen), inputDigest: digest(frozen) };
  const oldDocument = {
    ...document,
    version: '2',
    revisionId: randomUUID(),
    components: [oldComponent],
    confirmations: [
      {
        id: randomUUID(),
        componentIds: [component.id],
        fingerprint: confirmationFingerprint({ ...document, components: [oldComponent] }, [component.id]),
        at: runtime.settings.now(),
        stale: false,
      },
    ],
  };
  const tx = runtime.bus.transaction();
  tx.store('review').save('document', oldDocument);
  await runtime.bus.persist({ ...runtime.bus.snapshot(), rows: tx.rows });
  assert.deepEqual(confirmedComponents(runtime.bus.transaction(), oldDocument), []);
  await assert.rejects(
    runtime.execute('review.scope.confirm', {
      documentId: document.id,
      expectedVersion: oldDocument.version,
      componentIds: [component.id],
      fingerprint: confirmationFingerprint(oldDocument, [component.id]),
      explicitConfirm: true,
    }),
    /SOURCE_STALE/,
  );
  assert.equal(reviewDocument(runtime.bus.transaction(), document.id)?.manual[0]?.text, 'Old judgment');
});

test('body changes compare matching units only and remain descriptive observations', async () => {
  const runtime = await progressRuntime();
  for (const [observedAt, value, unit] of [
    ['2026-10-16T12:00:00.000Z', '70', 'kg'],
    ['2026-10-17T11:00:00.000Z', '69.5', 'kg'],
    ['2026-10-17T12:00:00.000Z', '154', 'lb'],
  ]) {
    await runtime.execute('profile.observation.save', {
      id: null,
      expectedVersion: '0',
      kind: 'MEASUREMENT',
      observedAt,
      remove: false,
      values: { weight: { value, unit } },
    });
  }
  const document = reviewDocument(runtime.bus.transaction(), 'daily|2026-10-17')!;
  const summary = asRecord(asRecord(document.components[0]!.coverage)['summary']!);
  const dailyChanges = summary['bodyChanges'] as Record<string, unknown>[];
  assert.equal(dailyChanges.length, 2);
  assert.ok(
    dailyChanges.every((change) => change['change'] === null && change['interpretation'] === 'DESCRIPTIVE_ONLY'),
  );
  const goal = await runtime.execute<Goal>('planning.goal.save', { ...goalInput, category: 'FITNESS' });
  const weekly = reviewInput(
    runtime.bus.transaction(),
    { period: 'WEEKLY', date: '2026-10-12', goalId: goal.id, slot: 'GOAL:' + goal.id },
    runtime.settings.now(),
  );
  const changes = asRecord(asRecord(weekly.coverage)['summary']!)['bodyChanges'] as Record<string, unknown>[];
  assert.equal(changes.find((change) => change['unit'] === 'kg')?.['change'], '-0.5');
  assert.equal(changes.find((change) => change['unit'] === 'lb')?.['change'], null);
});
