import { useState } from 'react';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { ActivitySection } from '../../features/today-overview/ActivitySection.tsx';
import { SleepSection } from '../../features/sleep-record/SleepSection.tsx';
import { NutritionSection } from '../../features/food-draft/NutritionSection.tsx';
import { ReviewSection } from '../../features/review-note/ReviewSection.tsx';
import { SyncStatus } from '../../features/sync-status/SyncStatus.tsx';
import { Action, Copy, Page, Row } from '../../ui/primitives.tsx';

export function TodayScreen() {
  const { gateway } = useWorkspace(),
    today = gateway.today(),
    [selected, choose] = useState('');
  const goal =
    today.goals.find((value) => value.id === selected) ??
    today.goals.find((value) => value.category === 'FITNESS') ??
    today.goals[0];
  const planned = today.planned.filter((ref) => !goal || ref.goalId === goal.id).map((ref) => ref.item);
  const facts = today.actual.filter(
    (fact) => !goal || !fact.baselineRefs.length || fact.baselineRefs.some((ref) => ref.goalId === goal.id),
  );
  return (
    <Page title="今日" subtitle={today.businessDate}>
      <Row>
        {today.goals.map((value) => (
          <Action
            key={value.id}
            title={(goal?.id === value.id ? '✓ ' : '') + value.name}
            quiet
            onPress={() => choose(value.id)}
          />
        ))}
      </Row>
      {!goal && <Copy muted>先在「计划安排」创建目标，也可直接登记实际记录。</Copy>}
      <ActivitySection
        kind="TRAINING"
        day={today.businessDate}
        plans={planned.filter((item) => item.kind === 'TRAINING')}
        facts={facts.filter((fact) => fact.data.kind === 'TRAINING')}
      />
      <SleepSection day={today.businessDate} facts={today.actual.filter((fact) => fact.data.kind === 'SLEEP')} />
      <NutritionSection day={today.businessDate} />
      <ActivitySection
        kind="LEARNING"
        day={today.businessDate}
        plans={planned.filter((item) => item.kind === 'LEARNING')}
        facts={facts.filter((fact) => fact.data.kind === 'LEARNING')}
      />
      <ReviewSection
        scope={{
          period: 'DAILY',
          date: today.businessDate,
          goalId: null,
          slot: gateway.identity.healthAllowed ? 'HEALTH' : 'LEARNING',
        }}
      />
      <SyncStatus />
    </Page>
  );
}
