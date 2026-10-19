import type { Goal, WeekPlan } from '@evoloop/client-business-core/planning';
import { label } from '@evoloop/client-model';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { planForm } from './model.ts';
import { removePlan } from '../plan-publication/actions.ts';
import { PlanReview } from '../plan-publication/PlanReview.tsx';
import { Action, Card, Copy } from '../../ui/primitives.tsx';
import { PrescriptionSummary } from '../../ui/RecordSummary.tsx';

export function DayPlans({
  goal,
  start,
  day,
  today,
  week,
}: {
  goal: Goal;
  start: string;
  day: string;
  today: string;
  week: WeekPlan | undefined;
}) {
  const { actions, send } = useWorkspace(),
    items = week?.draft.filter((item) => item.businessDate === day) ?? [];
  return (
    <Card title={day + ' 的安排'}>
      {day <= today && <Copy muted>今日与历史安排只读，请在今日记录实际执行。</Copy>}
      {items.map((item) => (
        <Card key={item.id} title={item.prescription.title}>
          <Copy muted>{label(item.disposition)}</Copy>
          <PrescriptionSummary value={item.prescription} />
          <Action
            title="编辑草案"
            quiet
            disabled={day <= today}
            onPress={() => actions.edit(planForm(send(), goal, start, day, week, item))}
          />
          {week && (
            <Action
              title="从草案移除"
              quiet
              disabled={day <= today}
              onPress={() => {
                void actions.run(() => removePlan(send(), week, item.id));
              }}
            />
          )}
        </Card>
      ))}
      <Action
        title="新增安排"
        disabled={day <= today}
        onPress={() => actions.edit(planForm(send(), goal, start, day, week))}
      />
      {week && <PlanReview week={week} day={day} today={today} />}
    </Card>
  );
}
