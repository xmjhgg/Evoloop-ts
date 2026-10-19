import { useState } from 'react';
import { addDays, weekStart } from '@evoloop/kernel';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { ReviewSection } from '../../features/review-note/ReviewSection.tsx';
import { Action, Copy, Page, Row } from '../../ui/primitives.tsx';

export function ReviewScreen() {
  const { gateway } = useWorkspace(),
    today = gateway.today().businessDate;
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY'>('DAILY'),
    [day, setDay] = useState(today),
    [selected, choose] = useState('');
  const goals = gateway.plans().goals,
    goal = goals.find((value) => value.id === selected) ?? goals[0];
  const date = period === 'WEEKLY' ? weekStart(day) : day;
  return (
    <Page title="复盘" subtitle={date}>
      <Row>
        <Action title="日复盘" quiet={period !== 'DAILY'} onPress={() => setPeriod('DAILY')} />
        <Action title="周复盘" quiet={period !== 'WEEKLY'} onPress={() => setPeriod('WEEKLY')} />
      </Row>
      <Row>
        <Action title="上一期" quiet onPress={() => setDay(addDays(date, period === 'DAILY' ? -1 : -7))} />
        <Action
          title="下一期"
          quiet
          disabled={addDays(date, period === 'DAILY' ? 1 : 7) > today}
          onPress={() => setDay(addDays(date, period === 'DAILY' ? 1 : 7))}
        />
        <Action title="回到今天" quiet onPress={() => setDay(today)} />
      </Row>
      {period === 'DAILY' ? (
        <>
          {gateway.identity.healthAllowed && <ReviewSection scope={{ period, date, goalId: null, slot: 'HEALTH' }} />}
          <ReviewSection scope={{ period, date, goalId: null, slot: 'LEARNING' }} />
        </>
      ) : (
        <>
          <Row>
            {goals.map((value) => (
              <Action
                key={value.id}
                title={(goal?.id === value.id ? '✓ ' : '') + value.name}
                quiet
                onPress={() => choose(value.id)}
              />
            ))}
          </Row>
          {goal ? (
            <ReviewSection scope={{ period, date, goalId: goal.id, slot: 'GOAL:' + goal.id }} />
          ) : (
            <Copy muted>先创建目标，再按目标进行周复盘。</Copy>
          )}
        </>
      )}
    </Page>
  );
}
