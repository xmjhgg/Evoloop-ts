import { reconcile } from '@evoloop/local-runtime';
import { digest } from '@evoloop/kernel';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { Action, Card, Copy } from '../../ui/primitives.tsx';
import { confirm } from '../../ui/confirm.ts';

export function ConflictSection() {
  const { gateway, actions } = useWorkspace(),
    state = gateway.bus.snapshot();
  const resolve = (choice: 'REPLAY' | 'ADOPT_CLOUD') => {
    const expected = digest(state);
    void actions.run(async () => {
      if (
        !(await confirm(
          '处理当前冲突',
          `本机 ${state.intents.filter((intent) => intent.status === 'PENDING' || intent.status === 'CONFLICT').length} 项待处理，远端 ${state.remote.length} 个批次。\n` +
            (choice === 'REPLAY'
              ? '在云端版本上重新应用允许重放的本地修改；有确认动作或含义变化时会停止。'
              : '采用云端视图。当前本地数据、队列和历史另存分支，仍可导出备份。'),
        ))
      )
        return;
      await reconcile(gateway.bus, choice, expected);
      gateway.changed();
    });
  };
  return (
    <Card title="同步冲突与保留分支">
      <Copy>
        保留分支 {state.branches.length} 个 · 远端待合并{' '}
        {state.remote.filter((value) => BigInt(value.serverSequence) > BigInt(state.headVersion)).length} 批
      </Copy>
      {state.branches.map((branch) => (
        <Copy key={branch.id} muted>
          {branch.id} · {branch.intents.length} 项本地意图
        </Copy>
      ))}
      {gateway.status().requiresAttention && (
        <>
          <Action title="尝试重放本地修改" quiet onPress={() => resolve('REPLAY')} />
          <Action title="采用云端视图并保留本地分支" quiet onPress={() => resolve('ADOPT_CLOUD')} />
        </>
      )}
    </Card>
  );
}
