import type { Goal } from '@evoloop/client-business-core/planning';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { Action, Row } from '../../ui/primitives.tsx';
import { confirm } from '../../ui/confirm.ts';

export function PlanActions({ goal }: { goal: Goal }) {
  const { actions, send } = useWorkspace();
  function change(action: string, title: string) {
    void actions.run(async () => {
      if (await confirm(title, goal.name + '\n历史安排和记录仍保留。'))
        await send()('planning.goal.change-state', { goalId: goal.id, expectedVersion: goal.version, action });
    });
  }
  return (
    <Row>
      {goal.status === 'ACTIVE' && <Action title="暂停目标" quiet onPress={() => change('PAUSE', '暂停目标')} />}
      {goal.status === 'PAUSED' && (
        <Action title="申请恢复" quiet onPress={() => change('REQUEST_RESUME', '恢复前重新核对安排')} />
      )}
      {goal.status !== 'ARCHIVED' && <Action title="归档目标" quiet onPress={() => change('ARCHIVE', '归档目标')} />}
    </Row>
  );
}
