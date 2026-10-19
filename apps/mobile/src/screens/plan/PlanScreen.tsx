import { useState } from 'react';
import { addDays, weekStart } from '@evoloop/kernel';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { goalForm } from '../../features/goal-editor/model.ts';
import { GoalSummary, WeekGrid } from '../../features/week-draft-editor/WeekOverview.tsx';
import { DayPlans } from '../../features/week-draft-editor/DayPlans.tsx';
import { GeneratePlan } from '../../features/ai-candidate/GeneratePlan.tsx';
import { Action, Page, Row } from '../../ui/primitives.tsx';

export function PlanScreen() {
  const { gateway, actions, send } = useWorkspace(),
    today = gateway.today().businessDate,
    data = gateway.plans();
  const [selected, choose] = useState(''),
    [offset, setOffset] = useState(0),
    [day, setDay] = useState('');
  const goal = data.goals.find((value) => value.id === selected) ?? data.goals[0],
    start = addDays(weekStart(today), offset * 7);
  const focus = day >= start && day <= addDays(start, 6) ? day : start;
  const week = data.weeks.find((value) => value.goalId === goal?.id && value.weekStart === start);
  return (
    <Page title="计划安排" subtitle="查看本周与下周，选择一天编辑安排">
      <Action title="新建目标" onPress={() => actions.edit(goalForm(send(), today))} />
      <Row>
        {data.goals.map((value) => (
          <Action
            key={value.id}
            title={(goal?.id === value.id ? '✓ ' : '') + value.name}
            quiet
            onPress={() => choose(value.id)}
          />
        ))}
      </Row>
      {goal && <GoalSummary goal={goal} today={today} />}
      <Row>
        <Action title="本周" quiet={offset !== 0} onPress={() => setOffset(0)} />
        <Action title="下周" quiet={offset !== 1} onPress={() => setOffset(1)} />
      </Row>
      {goal && <GeneratePlan goal={goal} start={start} week={week} />}
      <WeekGrid start={start} focus={focus} week={week} choose={setDay} />
      {goal && <DayPlans goal={goal} start={start} day={focus} today={today} week={week} />}
    </Page>
  );
}
