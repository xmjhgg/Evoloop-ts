import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goalForm } from '../../apps/mobile/src/features/goal-editor/model.ts';
import { planForm } from '../../apps/mobile/src/features/week-draft-editor/model.ts';
import { activityForm } from '../../apps/mobile/src/features/training-record/model.ts';
import { sleepForm } from '../../apps/mobile/src/features/sleep-record/model.ts';
import { reviewForm } from '../../apps/mobile/src/features/review-note/model.ts';
import { confirmationFingerprint } from '@evoloop/client-business-core/review';
import { factsOn, foodDrafts, executionHistory } from '@evoloop/client-business-core/execution';
import { mobileFixture, values } from './fixture.ts';
import { adjustmentForm } from '../../apps/mobile/src/features/review-adjustment/model.ts';
import { acceptCandidate } from '../../apps/mobile/src/gateways/ai.ts';
import { planCandidates } from '@evoloop/client-business-core/planning';
import { adjustments } from '@evoloop/client-business-core/review';

test('mobile forms: selected-day draft, rule review and explicit future publication remain separate', async () => {
  const f = await mobileFixture();
  const goalEditor = goalForm(f.send, '2026-10-17');
  await goalEditor.submit(values(goalEditor, { name: '读书', end: '2026-12-31' }));
  const goal = f.gateway.plans().goals[0]!;
  const monday = planForm(f.send, goal, '2026-10-19', '2026-10-19');
  await monday.submit(values(monday, { title: '星期一', topic: '第一章', minutes: '30' }));
  let week = f.gateway.plans().weeks[0]!;
  const tuesday = planForm(f.send, goal, '2026-10-19', '2026-10-20', week);
  await tuesday.submit(values(tuesday, { title: '星期二', topic: '第二章', minutes: '40' }));
  week = f.gateway.plans().weeks[0]!;
  assert.equal(week.draft.length, 2);
  assert.equal(week.published.length, 0);
  await f.send('planning.week.review', { weekId: week.id, expectedVersion: week.version, channel: 'RULES' });
  week = f.gateway.plans().weeks[0]!;
  assert.equal(week.review?.status, 'READY');
  await f.send('planning.week.publish', {
    weekId: week.id,
    expectedVersion: week.version,
    explicitConfirm: true,
    selected: [{ itemId: week.draft[0]!.id, expectedPublishedRevision: null }],
  });
  assert.equal(f.gateway.plans().weeks[0]!.published.length, 1);
  assert.equal(f.gateway.plans().weeks[0]!.draft.length, 2);
});

test('mobile training, learning and overnight sleep forms preserve exact unknowns and correction history', async () => {
  const f = await mobileFixture();
  const training = activityForm(f.send, '2026-10-17', 'TRAINING');
  await training.submit(
    values(training, { sets: JSON.stringify([{ name: '深蹲', quantity: '10', unit: 'REP', load: '' }]) }),
  );
  let fact = factsOn(f.bus.transaction(), '2026-10-17')[0]!;
  assert.equal(fact.data.kind === 'TRAINING' && fact.data.durationMinutes, null);
  const correction = activityForm(f.send, '2026-10-17', 'TRAINING', fact);
  await correction.submit(values(correction, { minutes: '23.125' }));
  assert.equal(executionHistory(f.bus.transaction(), 'fact', fact.id).length, 2);
  const learning = activityForm(f.send, '2026-10-17', 'LEARNING');
  await learning.submit(
    values(learning, { minutes: '20', fragments: JSON.stringify([{ quantity: '5', unit: 'PAGE' }]) }),
  );
  const sleep = sleepForm(f.send, '2026-10-17');
  await sleep.submit(
    values(sleep, { beginDay: '2026-10-16', beginTime: '23:00', endDay: '2026-10-17', endTime: '07:00' }),
  );
  fact = factsOn(f.bus.transaction(), '2026-10-17').find((value) => value.data.kind === 'SLEEP')!;
  assert.equal(fact.businessDate, '2026-10-17');
  const before = f.bus.snapshot();
  await assert.rejects(() => f.gateway.synchronize(), /NETWORK_UNAVAILABLE/);
  assert.deepEqual(f.bus.snapshot(), before);
  assert.equal(foodDrafts(f.bus.transaction(), '2026-10-17').length, 0);
});

test('shared daily review: summary, manual judgment and explicit confirmation use one document', async () => {
  const f = await mobileFixture(),
    scope = { period: 'DAILY' as const, date: '2026-10-17', goalId: null, slot: 'LEARNING' };
  const form = reviewForm(f.send, scope);
  await form.submit(values(form, { text: '今天稳定完成，明天按原计划继续。' }));
  const document = f.gateway.reviews()[0]!,
    component = document.components[0]!;
  assert.equal(f.gateway.today('2026-10-17').review?.id, document.id);
  assert.equal(document.confirmations.length, 0);
  await f.send('review.scope.confirm', {
    documentId: document.id,
    expectedVersion: document.version,
    componentIds: [component.id],
    fingerprint: confirmationFingerprint(document, [component.id]),
    explicitConfirm: true,
  });
  assert.deepEqual(f.gateway.today('2026-10-17').confirmedComponentIds, [component.id]);
  assert.equal(f.gateway.plans().weeks.length, 0);
});

test('generated week candidate and confirmed review adjustment only modify future draft before a separate publication', async () => {
  const f = await mobileFixture(),
    editor = goalForm(f.send, '2026-10-17');
  await editor.submit(values(editor, { name: '读书', end: '2026-12-31' }));
  const goal = f.gateway.plans().goals[0]!;
  await f.send('planning.week.request-candidate', { goalId: goal.id, weekStart: '2026-10-19', expectedVersion: '0' });
  const candidate = planCandidates(f.bus.transaction(), goal.id, '2026-10-19')[0]!;
  const prescription = {
    title: '阅读',
    startAt: null,
    minutes: '20',
    actions: [],
    learning: { topic: '第一章', unit: 'PAGE', quantity: '5', outcome: '读书笔记' },
    nutrition: null,
  };
  await acceptCandidate(
    f.send,
    {
      kind: 'plan-draft',
      id: candidate.id,
      expectedVersion: candidate.version,
      componentId: null,
      input: candidate.input,
      inputDigest: candidate.inputDigest,
    },
    {
      text: '候选',
      data: {
        changes: [{ id: null, businessDate: '2026-10-19', kind: 'LEARNING', disposition: 'PLANNED', prescription }],
      },
    },
  );
  const form = reviewForm(f.send, { period: 'DAILY', date: '2026-10-17', goalId: null, slot: 'LEARNING' });
  await form.submit(values(form, { text: '增加一点阅读时间' }));
  let document = f.gateway.reviews()[0]!;
  const component = document.components[0]!;
  await f.send('review.scope.confirm', {
    documentId: document.id,
    expectedVersion: document.version,
    componentIds: [component.id],
    fingerprint: confirmationFingerprint(document, [component.id]),
    explicitConfirm: true,
  });
  document = f.gateway.reviews()[0]!;
  const proposal = adjustmentForm(f.send, document, component.id, f.gateway.plans().weeks, '2026-10-17');
  await proposal.submit(values(proposal, { minutes: '25', reason: '适当增加' }));
  const adjustment = adjustments(f.bus.transaction(), document.id)[0]!,
    week = f.gateway.plans().weeks[0]!;
  await f.send('review.adjustment.submit', {
    adjustmentId: adjustment.id,
    expectedVersion: week.version,
    choices: adjustment.changes.map((change) => ({ itemId: change.itemId, choice: 'USE_PROPOSED', custom: null })),
  });
  assert.equal(f.gateway.plans().weeks[0]!.draft[0]!.prescription.minutes, '25');
  assert.equal(f.gateway.plans().weeks[0]!.published.length, 0);
  assert.equal(f.gateway.plans().weeks[0]!.review, null);
});
