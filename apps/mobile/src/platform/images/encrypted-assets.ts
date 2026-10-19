import { Directory, File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { backupCrypto } from '@evoloop/local-runtime';
import { requireThat } from '@evoloop/kernel';
import { imageSchema } from '../../gateways/assets.ts';
import type { AssetStore, ImageAsset } from '../../gateways/assets.ts';
import { promoteFile } from '../files/promote-file.ts';

export async function imageDigest(base64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  const hash = new Uint8Array(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes));
  return Array.from(hash, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
export function encryptedAssets(database: string, key: string): AssetStore {
  const directory = new Directory(Paths.document, database + '-assets');
  directory.create({ intermediates: true, idempotent: true });
  const crypto = backupCrypto(Crypto.getRandomBytes);
  const path = (id: string) => new File(directory, imageSchema.shape.id.parse(id) + '.encrypted');
  return {
    async read(id) {
      const file = path(id);
      if (!file.exists) return null;
      const asset = imageSchema.parse(JSON.parse(await crypto.open(await file.text(), key)));
      requireThat(asset.id === id && (await imageDigest(asset.dataBase64)) === asset.digest, 'IMAGE_CORRUPT');
      return asset;
    },
    async put(input) {
      const asset: ImageAsset = imageSchema.parse(input);
      requireThat((await imageDigest(asset.dataBase64)) === asset.digest, 'IMAGE_DIGEST_MISMATCH');
      const target = path(asset.id);
      if (target.exists) {
        const previous = imageSchema.parse(JSON.parse(await crypto.open(await target.text(), key)));
        requireThat(previous.digest === asset.digest, 'IMAGE_ID_CONFLICT');
        return;
      }
      const stage = new File(directory, Crypto.randomUUID() + '.stage');
      await promoteFile(
        stage,
        async () => stage.write(await crypto.seal(JSON.stringify(asset), key)),
        () => stage.move(target),
      );
    },
  };
}
