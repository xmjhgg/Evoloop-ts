import { foodEvidence } from '@evoloop/client-business-core/execution';
import { requireThat } from '@evoloop/kernel';
import { z } from 'zod';
import { imageSchema, parseImageReference } from './assets.ts';
import type { ImageAsset } from './assets.ts';
import type { ClientSession } from './ports.ts';

export async function registerImage(gateway: ClientSession, asset: ImageAsset) {
  gateway.bus.snapshot();
  await gateway.assets.put(asset);
  await gateway.bus.serial(async () => {
    const state = gateway.bus.snapshot(),
      previous = state.attachments.find((value) => value.id === asset.id);
    requireThat(!previous || previous.digest === asset.digest, 'IMAGE_ID_CONFLICT');
    if (!previous)
      await gateway.bus.persist({
        ...state,
        attachments: [...state.attachments, { id: asset.id, digest: asset.digest, complete: false }],
      });
  });
  gateway.changed();
}
export async function loadImage(gateway: ClientSession, id: string, digest: string): Promise<ImageAsset> {
  let image = await gateway.assets.read(id);
  if (!image) {
    image = await gateway.http.call('GET', '/api/v2/sync/attachments/' + id, imageSchema);
    requireThat(image.id === id && image.digest === digest, 'IMAGE_DIGEST_MISMATCH');
    await gateway.assets.put(image);
  }
  requireThat(image.digest === digest, 'IMAGE_DIGEST_MISMATCH');
  return image;
}
export async function synchronizeAttachments(gateway: ClientSession) {
  const references = foodEvidence(gateway.bus.transaction()).map(parseImageReference);
  await gateway.bus.serial(async () => {
    const state = gateway.bus.snapshot(),
      merged = new Map(state.attachments.map((value) => [value.id, value]));
    for (const reference of references) {
      requireThat(
        !merged.has(reference.id) || merged.get(reference.id)!.digest === reference.digest,
        'IMAGE_ID_CONFLICT',
      );
      if (!merged.has(reference.id)) merged.set(reference.id, { ...reference, complete: false });
    }
    if (merged.size !== state.attachments.length)
      await gateway.bus.persist({ ...state, attachments: [...merged.values()] });
  });
  for (const attachment of gateway.bus.snapshot().attachments.filter((value) => !value.complete)) {
    const image = await loadImage(gateway, attachment.id, attachment.digest);
    const receipt = await gateway.http.call(
      'POST',
      '/api/v2/sync/attachments',
      z.object({ id: z.string(), digest: z.string(), complete: z.literal(true) }).strict(),
      image,
    );
    requireThat(receipt.id === attachment.id && receipt.digest === attachment.digest, 'IMAGE_RECEIPT_MISMATCH');
    await gateway.bus.serial(async () => {
      const state = gateway.bus.snapshot();
      await gateway.bus.persist({
        ...state,
        attachments: state.attachments.map((value) =>
          value.id === attachment.id ? { ...value, complete: true } : value,
        ),
      });
    });
  }
}
