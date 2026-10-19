import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { Action, Card, Copy } from '../../ui/primitives.tsx';

export function SyncStatus() {
  const { gateway, actions } = useWorkspace(),
    status = gateway.status();
  return (
    <Card>
      <Copy muted>
        {status.structuredDataCloudSaved
          ? '本地已保存 · 结构化数据已同步'
          : `本地已保存 · ${status.pendingCommandIds.length} 项待同步`}
      </Copy>
      {!status.attachmentsComplete && <Copy muted>照片附件尚未全部保存到云端。</Copy>}
      {status.requiresAttention && <Copy>存在同步冲突，双方版本已保留，请在系统设置核对。</Copy>}
      {!!gateway.syncError && <Copy>云端同步暂停：{gateway.syncError}</Copy>}
      <Action
        title="同步"
        quiet
        disabled={actions.busy}
        onPress={() => {
          void actions.run(() => gateway.synchronize());
        }}
      />
    </Card>
  );
}
