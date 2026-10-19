import { useEffect, useState } from 'react';
import type { AiBookmark } from '../../gateways/ports.ts';
import { readCandidate } from '../../gateways/ai.ts';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { Action, Card, Copy } from '../../ui/primitives.tsx';
import { label } from '@evoloop/client-model';
const names = { 'plan-review': '计划审查', 'plan-draft': '周草案', review: '复盘', food: '餐食识别' };

export function TaskHistory() {
  const { gateway, actions } = useWorkspace(),
    [bookmarks, setBookmarks] = useState<readonly AiBookmark[]>([]);
  const [result, setResult] = useState('');
  useEffect(() => {
    let live = true;
    void gateway.bus
      .serial(() => gateway.tasks.all())
      .then((value) => {
        if (live) setBookmarks(value);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [gateway]);
  return (
    <Card title="AI 任务历史">
      <Copy muted>已保存 {bookmarks.length} 个请求书签，未完成任务也随加密备份保留。</Copy>
      {bookmarks.map((bookmark) => (
        <Action
          key={bookmark.key}
          title={names[bookmark.target.kind] + ' · ' + (bookmark.taskId?.slice(0, 8) ?? '尚待提交')}
          quiet
          onPress={() => {
            void actions.run(async () => {
              const task = await readCandidate(gateway, bookmark);
              setResult(label(task.status) + (task.errorCode ? ' · ' + task.errorCode : ''));
            });
          }}
        />
      ))}
      {!!result && <Copy>{result}</Copy>}
    </Card>
  );
}
