import { exportBackup, restoreBackup } from '@evoloop/local-runtime';
import type { CryptoPort, State } from '@evoloop/local-runtime/ports';
import { requireThat } from '@evoloop/kernel';
import { z } from 'zod';
import { imageSchema } from './assets.ts';
import { loadImage } from './sync-attachments.ts';
import type { ClientSession } from './ports.ts';
import { bookmarkSchema, parseBookmark } from './task-bookmark.ts';

const packSchema = z
  .object({
    mobileBackupFormat: z.literal('1'),
    origin: z.string().url(),
    stateBackup: z.string(),
    images: z.array(imageSchema).max(1000),
    bookmarks: z.array(bookmarkSchema),
  })
  .strict();
export async function exportMobileBackup(gateway: ClientSession, crypto: CryptoPort, password: string) {
  const state = gateway.bus.snapshot(),
    stateBackup = await exportBackup(gateway.bus, crypto, password);
  const images = [];
  for (const attachment of state.attachments) images.push(await loadImage(gateway, attachment.id, attachment.digest));
  const bookmarks = await gateway.bus.serial(() => gateway.tasks.all());
  return crypto.seal(
    JSON.stringify({ mobileBackupFormat: '1', origin: gateway.identity.origin, stateBackup, images, bookmarks }),
    password,
  );
}
export async function restoreMobileBackup(
  gateway: ClientSession,
  crypto: CryptoPort,
  password: string,
  ciphertext: string,
  expected: string,
  approve: () => Promise<boolean>,
) {
  const pack = packSchema.parse(JSON.parse(await crypto.open(ciphertext, password)));
  const inner = JSON.parse(await crypto.open(pack.stateBackup, password)) as { state: State };
  const current = gateway.bus.snapshot();
  requireThat(pack.origin === gateway.identity.origin, 'BACKUP_ORIGIN_MISMATCH');
  requireThat(inner.state.accountId === current.accountId, 'ACCOUNT_MISMATCH');
  requireThat(inner.state.headVersion === current.headVersion, 'RESTORE_RECONCILIATION_REQUIRED');
  requireThat(
    inner.state.attachments.every((attachment) =>
      pack.images.some((image) => image.id === attachment.id && image.digest === attachment.digest),
    ),
    'BACKUP_IMAGE_MISSING',
  );
  if (!(await approve())) return;
  for (const image of pack.images) await gateway.assets.put(image);
  await gateway.bus.serial(async () => {
    for (const bookmark of pack.bookmarks) await gateway.tasks.put(parseBookmark(bookmark));
  });
  await restoreBackup(gateway.bus, crypto, pack.stateBackup, password, expected);
  gateway.changed();
}
