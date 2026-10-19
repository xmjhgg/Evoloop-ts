import { useTheme } from '../../app/providers/ThemeProvider.tsx';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { SyncStatus } from '../../features/sync-status/SyncStatus.tsx';
import { ConflictSection } from '../../features/conflict-resolution/ConflictSection.tsx';
import { backupForm } from '../../features/backup-restore/model.ts';
import { PurposeSection } from '../../features/account-login/PurposeSection.tsx';
import { TaskHistory } from '../../features/ai-candidate/TaskHistory.tsx';
import { Action, Card, Copy, Page, Row } from '../../ui/primitives.tsx';

export function SettingsScreen({ back }: { back(): void }) {
  const { mode, setMode } = useTheme(),
    { gateway, actions } = useWorkspace();
  return (
    <Page title="系统设置">
      <Action title="返回我的" quiet onPress={back} />
      <Card title="界面主题">
        <Row>
          {(
            [
              ['system', '跟随系统'],
              ['light', '浅色'],
              ['dark', '深色'],
            ] as const
          ).map(([value, title]) => (
            <Action
              key={value}
              title={(mode === value ? '✓ ' : '') + title}
              quiet={mode !== value}
              onPress={() => {
                void actions.run(() => setMode(value));
              }}
            />
          ))}
        </Row>
      </Card>
      <PurposeSection />
      <SyncStatus />
      <ConflictSection />
      <TaskHistory />
      <Card title="备份与恢复">
        <Copy muted>包含本地数据、历史、未同步队列、分支与加密照片。缺少照片文件时会停止导出并保留原数据。</Copy>
        <Action title="导出加密备份" quiet onPress={() => actions.edit(backupForm(gateway, false))} />
        <Action title="恢复加密备份" quiet onPress={() => actions.edit(backupForm(gateway, true))} />
      </Card>
      <Copy muted>日常记录先在本机保存。设备锁定或应用转入后台后，需要重新解锁本地数据。</Copy>
    </Page>
  );
}
