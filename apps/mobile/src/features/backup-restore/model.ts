import type { FormSpec } from '@evoloop/client-model';
import type { LocalGateway } from '../../gateways/local.ts';
import { pickBackup, shareBackup } from '../../platform/files/backup-files.ts';
import { confirm } from '../../ui/confirm.ts';

export function backupForm(gateway: LocalGateway, restore: boolean): FormSpec {
  return {
    title: restore ? '恢复本客户端备份' : '导出加密备份',
    description: '仅支持本客户端的当前备份格式。密码至少 16 位；密码不会上传或保存。',
    fields: [
      { key: 'password', label: '备份密码', secret: true },
      ...(restore ? [] : [{ key: 'repeat', label: '再次输入密码', secret: true }]),
    ],
    async submit(v) {
      const password = v['password'] ?? '';
      if (!restore && password !== v['repeat']) throw Error('两次密码不一致');
      if (restore)
        await pickBackup(gateway, password, () =>
          confirm('恢复当前版本备份', '本机当前记录与未同步操作会保留为分支。云端版本必须匹配，不会重置同步根。'),
        );
      else await shareBackup(gateway, password);
    },
  };
}
