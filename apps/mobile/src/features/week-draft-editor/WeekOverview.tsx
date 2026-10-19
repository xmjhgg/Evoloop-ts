import { addDays } from '@evoloop/kernel';
import { label } from '@evoloop/client-model';
import type { Goal, WeekPlan } from '@evoloop/client-business-core/planning';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { goalForm } from '../goal-editor/model.ts';
import { PlanActions } from '../plan-publication/PlanActions.tsx';
import { Action, Card, Copy } from '../../ui/primitives.tsx';

export function GoalSummary({ goal, today }: { goal: Goal; today: string }) {
  const { actions, send } = useWorkspace();
  return (
    <Card title={goal.name}>
      <Copy muted>
        {label(goal.category)} · {label(goal.status)} · {goal.startDate} 至 {goal.endDate}
      </Copy>
      <Action title="修改目标" quiet onPress={() => actions.edit(goalForm(send(), today, goal))} />
      <PlanActions goal={goal} />
    </Card>
  );
}
export function WeekGrid({
  start,
  focus,
  week,
  choose,
}: {
  start: string;
  focus: string;
  week: WeekPlan | undefined;
  choose(day: string): void;
}) {
  return (
    <>
      {Array.from({ length: 7 }, (_, index) => addDays(start, index)).map((day) => (
        <Card key={day}>
          <Action title={(focus === day ? '✓ ' : '') + day} quiet onPress={() => choose(day)} />
          {(week?.draft.filter((item) => item.businessDate === day) ?? []).map((item) => (
            <Copy key={item.id}>
              {label(item.kind)} · {item.prescription.title} · {label(item.disposition)}
            </Copy>
          ))}
          <Copy muted>
            生效{' '}
            {week?.published.filter((item) => item.businessDate === day && item.disposition === 'PLANNED').length ?? 0}{' '}
            项
          </Copy>
        </Card>
      ))}
    </>
  );
}
