import { label } from '@evoloop/client-model';
import type { Fact } from '@evoloop/client-business-core/execution';
import type { PlanItem } from '@evoloop/client-business-core/planning';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { activityForm } from '../training-record/model.ts';
import { Action, Card, Copy, Row } from '../../ui/primitives.tsx';
import { ActualSummary, PrescriptionSummary } from '../../ui/RecordSummary.tsx';

export function ActivitySection({
  kind,
  day,
  plans,
  facts,
}: {
  kind: 'TRAINING' | 'LEARNING';
  day: string;
  plans: readonly PlanItem[];
  facts: readonly Fact[];
}) {
  const { actions, send } = useWorkspace();
  const edit = (fact?: Fact, item?: PlanItem) => actions.edit(activityForm(send(), day, kind, fact, item?.id));
  return (
    <Card title={label(kind)}>
      <Row>
        <Card grow title="今日计划">
          {plans.length ? (
            plans.map((item) => <PrescriptionSummary key={item.id} value={item.prescription} />)
          ) : (
            <Copy muted>尚无生效安排</Copy>
          )}
        </Card>
        <Card grow title="今日执行">
          {facts.length ? (
            facts.map((fact) => (
              <Card key={fact.id}>
                <ActualSummary value={fact} />
                {!fact.baselineRefs.length && <Copy muted>未关联生效安排</Copy>}
              </Card>
            ))
          ) : (
            <Copy muted>尚未登记</Copy>
          )}
        </Card>
      </Row>
      {plans.map((item) => (
        <Action key={item.id} title={`登记：${item.prescription.title}`} quiet onPress={() => edit(undefined, item)} />
      ))}
      {facts.map((fact) => (
        <Action key={fact.id} title={`修正${label(kind)}记录`} quiet onPress={() => edit(fact)} />
      ))}
      <Action title={`新增${label(kind)}记录`} onPress={() => edit()} />
    </Card>
  );
}
