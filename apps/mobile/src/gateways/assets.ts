import { z } from 'zod';
import { requireThat } from '@evoloop/kernel';

export const imageSchema = z
  .object({
    id: z.string().uuid(),
    digest: z.string().regex(/^[a-f0-9]{64}$/),
    mediaType: z.literal('image/jpeg'),
    dataBase64: z.string().min(4).max(5592408),
  })
  .strict();
export type ImageAsset = z.infer<typeof imageSchema>;
export interface AssetStore {
  read(id: string): Promise<ImageAsset | null>;
  put(asset: ImageAsset): Promise<void>;
}
export function imageReference(asset: Pick<ImageAsset, 'id' | 'digest'>): string {
  return `image:${asset.id}:${asset.digest}`;
}
export function parseImageReference(value: string): Pick<ImageAsset, 'id' | 'digest'> {
  const match = /^image:([0-9a-f-]{36}):([0-9a-f]{64})$/.exec(value);
  requireThat(match, 'IMAGE_REFERENCE_UNSUPPORTED');
  return { id: z.string().uuid().parse(match[1]), digest: match[2]! };
}
