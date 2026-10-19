import { useEffect, useState } from 'react';
import { requestCandidate, readCandidate, targetKey } from '../../gateways/ai.ts';
import type { AiBookmark, AiTarget } from '../../gateways/ai.ts';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { Action, Card, Copy } from '../../ui/primitives.tsx';
import { TaskResult } from './TaskResult.tsx';
import type { CandidateTask } from './types.ts';

export function AiCandidatePanel({ target }: { target: AiTarget }) {
  const { gateway, actions, uuid } = useWorkspace(),
    key = targetKey(target);
  const [bookmark, setBookmark] = useState<AiBookmark | null>(null),
    [task, setTask] = useState<CandidateTask | null>(null);
  useEffect(() => {
    let live = true;
    setTask(null);
    setBookmark(null);
    void gateway.bus
      .serial(() => gateway.tasks.get(key))
      .then((value) => {
        if (live) setBookmark(value);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [gateway, key]);
  function request() {
    void actions.run(async () => {
      const saved = await requestCandidate(gateway, target, uuid);
      setBookmark(saved);
      setTask(await readCandidate(gateway, saved));
    });
  }
  return (
    <Card title="AI 候选">
      <Copy muted>只生成候选。接纳后仍需单独确认摄入、复盘或计划发布。</Copy>
      <Action
        title={bookmark ? '读取 / 继续请求' : '请求 AI 候选'}
        quiet
        disabled={actions.busy || !gateway.identity.aiAllowed}
        onPress={request}
      />
      {task && <TaskResult task={task} target={target} bookmark={bookmark} update={setTask} />}
    </Card>
  );
}
