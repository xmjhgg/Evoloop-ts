import type { Fact } from '@evoloop/client-business-core/execution';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { activityForm } from '../training-record/model.ts';
import { sleepForm } from '../sleep-record/model.ts';
import { Action } from '../../ui/primitives.tsx';
import { confirm } from '../../ui/confirm.ts';

export function FactActions({ fact, day }: { fact: Fact; day: string }) {
  const { actions, send } = useWorkspace();
  function edit() {
    const kind = fact.data.kind;
    if (kind === 'SLEEP') actions.edit(sleepForm(send(), day, fact));
    else if (kind === 'TRAINING' || kind === 'LEARNING') actions.edit(activityForm(send(), day, kind, fact));
  }
  return (
    <>
      {fact.status === 'ACTIVE' && fact.data.kind !== 'MEAL' && <Action title="修正记录" quiet onPress={edit} />}
      <Action
        title="移除有效记录并保留历史"
        quiet
        disabled={fact.status === 'REMOVED'}
        onPress={() => {
          void actions.run(async () => {
            if (await confirm('移除记录', '原修订与计划基准仍保留。'))
              await send()('execution.fact.remove', { factId: fact.id, expectedVersion: fact.version });
          });
        }}
      />
    </>
  );
}
