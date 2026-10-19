import { purposeNoticeSchema } from '@evoloop/contracts';
import { z } from 'zod';
import { useWorkspace } from '../../app/providers/WorkspaceProvider.tsx';
import { refreshIdentity } from '../../gateways/identity.ts';
import { saveIdentity } from '../../platform/security/vault.ts';
import { Action, Card, Copy } from '../../ui/primitives.tsx';
import { confirm } from '../../ui/confirm.ts';

export function PurposeSection() {
  const { gateway, actions } = useWorkspace(),
    account = gateway.identity;
  function change(healthAllowed: boolean, aiAllowed: boolean) {
    void actions.run(async () => {
      let noticeVersion = '';
      if ((healthAllowed && !account.healthAllowed) || (aiAllowed && !account.aiAllowed)) {
        const notice = await gateway.http.call('GET', '/api/v2/identity/purpose-notice', purposeNoticeSchema);
        if (!(await confirm('数据用途 · ' + notice.version, notice.text, '已阅读并同意'))) return;
        noticeVersion = notice.version;
      } else if (
        !(await confirm('撤回数据用途', '停止所撤回用途的后续处理，其他用途保持当前选择。本机已保存记录仍保留。'))
      )
        return;
      await gateway.http.call(
        'PUT',
        '/api/v2/identity/purposes',
        z.object({ updated: z.literal(true), noticeVersion: z.string() }),
        { healthAllowed, aiAllowed, noticeVersion, expectedPurposeVersion: account.purposeVersion },
      );
      gateway.identity = await refreshIdentity(gateway.http, account);
      await saveIdentity(gateway.identity);
      gateway.changed();
    });
  }
  return (
    <Card title="数据用途">
      <Copy>
        健康数据：{account.healthAllowed ? '已同意' : '未授权'} · AI：{account.aiAllowed ? '已同意' : '未授权'}
      </Copy>
      <Action
        title={account.healthAllowed ? '撤回健康数据用途' : '查看并同意健康数据用途'}
        quiet
        onPress={() => change(!account.healthAllowed, account.aiAllowed)}
      />
      <Action
        title={account.aiAllowed ? '撤回 AI 用途' : '查看并同意 AI 用途'}
        quiet
        onPress={() => change(account.healthAllowed, !account.aiAllowed)}
      />
    </Card>
  );
}
