import { canonical, digest, requireThat } from '@evoloop/kernel';
import type { CommandBus } from '../commands/command-bus.ts';
import type { CryptoPort, State } from '../ports/public.ts';
import { validateRows } from '../changes/validate.ts';

export async function exportBackup(bus: CommandBus, crypto: CryptoPort, password: string): Promise<string> {
  requireThat(password.length >= 16, 'BACKUP_PASSWORD_TOO_SHORT');
  const state = bus.snapshot();
  return crypto.seal(canonical({ backupFormatVersion: '1', state, digest: digest(state) }), password);
}
export async function restoreBackup(bus: CommandBus, crypto: CryptoPort, ciphertext: string, password: string, expectedCurrentDigest: string): Promise<void> {
  const backup = JSON.parse(await crypto.open(ciphertext, password)) as { backupFormatVersion: string; state: State; digest: string };
  requireThat(backup.backupFormatVersion === '1' && digest(backup.state) === backup.digest, 'BACKUP_INVALID');
  validateRows(backup.state.rows, backup.state.accountId);
  await bus.serial(async () => {
    const current = bus.snapshot();
    requireThat(digest(current) === expectedCurrentDigest, 'RESTORE_STALE');
    requireThat(backup.state.accountId === current.accountId, 'ACCOUNT_MISMATCH');
    requireThat(backup.state.formatVersion === '1', 'LOCAL_FORMAT_UNSUPPORTED');
    // Preserve both branches, including old queues and attachments. Restoring never resets the cloud head.
    requireThat(backup.state.headVersion === current.headVersion, 'RESTORE_RECONCILIATION_REQUIRED');
    await bus.persist({ ...backup.state, deviceId: current.deviceId, branches: [...backup.state.branches, ...current.branches,
      { id: 'before-restore:' + current.generation, rows: current.rows, intents: current.intents, batches: current.batches, headVersion: current.headVersion }],
      attachments: [...new Map([...backup.state.attachments, ...current.attachments].map(attachment => [attachment.id, attachment])).values()] });
  });
}
