import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import { backupCrypto } from '@evoloop/local-runtime';
import { digest, requireThat } from '@evoloop/kernel';
import type { LocalGateway } from '../../gateways/local.ts';
import { exportMobileBackup, restoreMobileBackup } from '../../gateways/backup.ts';

const crypto = backupCrypto(Crypto.getRandomBytes);
export async function shareBackup(gateway: LocalGateway, password: string) {
  requireThat(await Sharing.isAvailableAsync(), '系统分享不可用');
  const encrypted = await exportMobileBackup(gateway, crypto, password);
  const file = new File(Paths.cache, `evoloop-${Crypto.randomUUID()}.json`);
  try {
    file.write(encrypted);
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
  } finally {
    if (file.exists) file.delete();
  }
}
export async function pickBackup(gateway: LocalGateway, password: string, approve: () => Promise<boolean>) {
  const expected = digest(gateway.bus.snapshot());
  const picked = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (picked.canceled) return;
  const asset = picked.assets[0];
  requireThat(asset, 'BACKUP_FILE_MISSING');
  const file = new File(asset.uri);
  requireThat(file.size <= 128 * 1024 * 1024, 'BACKUP_TOO_LARGE');
  try {
    const encrypted = await file.text();
    await restoreMobileBackup(gateway, crypto, password, encrypted, expected, approve);
  } finally {
    if (file.exists) file.delete();
  }
}
