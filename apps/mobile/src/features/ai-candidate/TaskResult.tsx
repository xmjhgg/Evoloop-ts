import { readCandidate, acceptCandidate } from '../../gateways/ai.ts';
import type { AiBookmark, AiTarget } from '../../gateways/ai.ts';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { Action, Copy } from '../../ui/primitives.tsx';
import { confirm } from '../../ui/confirm.ts';
import { CandidateDetails } from './CandidateDetails.tsx';
import type { CandidateTask } from './types.ts';
import { label } from '@evoloop/client-model';

export function TaskResult({
  task,
  target,
  bookmark,
  update,
}: {
  task: CandidateTask;
  target: AiTarget;
  bookmark: AiBookmark | null;
  update(task: CandidateTask): void;
}) {
  const { gateway, actions, send } = useWorkspace();
  return (
    <>
      <Copy>
        {label(task.status)}
        {task.errorCode ? ' · ' + task.errorCode : ''}
      </Copy>
      {task.output !== null && (
        <>
          <Copy>
            {typeof task.output === 'object' && 'text' in task.output ? String(task.output.text) : '候选格式不受支持'}
          </Copy>
          <CandidateDetails output={task.output} />
        </>
      )}
      {task.status === 'SUCCEEDED' && (
        <Action
          title="接纳候选"
          quiet
          onPress={() => {
            void actions.run(async () => {
              if (await confirm('接纳当前候选', '先核对候选内容。来源变化时会拒绝接纳，已保存事实不受影响。'))
                await acceptCandidate(send(), target, task.output);
            });
          }}
        />
      )}
      {(task.status === 'QUEUED' || task.status === 'RUNNING') && (
        <Action
          title="取消任务"
          quiet
          onPress={() => {
            void actions.run(async () => {
              await gateway.http.raw('DELETE', '/api/v2/ai/tasks/' + task.taskId + '?expectedVersion=' + task.version);
              if (bookmark) update(await readCandidate(gateway, bookmark));
            });
          }}
        />
      )}
      <Copy muted>
        模型 {task.modelId} · 提示版本 {task.promptVersion}
      </Copy>
    </>
  );
}
