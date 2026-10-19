import { adjustments } from '@evoloop/client-business-core/review';
import type { ReviewDocument } from '@evoloop/client-business-core/review';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { Action, Card, Copy, Row } from '../../ui/primitives.tsx';
import { confirm } from '../../ui/confirm.ts';
import { adjustmentForm } from './model.ts';

export function AdjustmentSection({ document, componentId }: { document: ReviewDocument; componentId: string }) {
  const { gateway, actions, send } = useWorkspace(),
    proposals = adjustments(gateway.bus.transaction(), document.id);
  function merge(id: string, keep: boolean) {
    const proposal = proposals.find((value) => value.id === id),
      week = gateway.plans().weeks.find((value) => value.id === proposal?.weekId);
    if (!proposal || !week) return;
    void actions.run(async () => {
      if (
        !(await confirm(
          '处理调整建议',
          keep
            ? '保留当前安排，记录本次处理。'
            : proposal.changes.map((change) => change.proposed.prescription.title + '：' + change.reason).join('\n') +
                '\n仅合并为草案，尚未发布。',
        ))
      )
        return;
      await send()('review.adjustment.submit', {
        adjustmentId: proposal.id,
        expectedVersion: week.version,
        choices: proposal.changes.map((change) => ({
          itemId: change.itemId,
          choice: keep ? 'KEEP_CURRENT' : 'USE_PROPOSED',
          custom: null,
        })),
      });
    });
  }
  return (
    <Card title="未来调整建议">
      <Action
        title="提出调整"
        quiet
        onPress={() =>
          actions.open(() =>
            adjustmentForm(send(), document, componentId, gateway.plans().weeks, gateway.today().businessDate),
          )
        }
      />
      {proposals.map((proposal) => (
        <Card key={proposal.id}>
          {proposal.changes.map((change) => (
            <Copy key={change.itemId}>
              {change.oldValue.prescription.title} → {change.proposed.prescription.title} · {change.reason}
            </Copy>
          ))}
          <Copy muted>{proposal.status === 'READY' ? '建议已保存，待处理' : '已处理，计划需单独审查发布'}</Copy>
          {proposal.status === 'READY' && (
            <Row>
              <Action title="合并为草案" quiet onPress={() => merge(proposal.id, false)} />
              <Action title="保留现有安排" quiet onPress={() => merge(proposal.id, true)} />
            </Row>
          )}
        </Card>
      ))}
    </Card>
  );
}
