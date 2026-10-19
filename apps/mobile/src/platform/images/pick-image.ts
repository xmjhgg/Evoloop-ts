import * as Picker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import { requireThat } from '@evoloop/kernel';
import { imageDigest } from './encrypted-assets.ts';
import type { ImageAsset } from '../../gateways/assets.ts';

export async function pickImage(camera: boolean): Promise<ImageAsset | null> {
  if (camera) requireThat((await Picker.requestCameraPermissionsAsync()).granted, '请在系统设置中允许使用相机');
  const result = await (camera ? Picker.launchCameraAsync : Picker.launchImageLibraryAsync)({
    mediaTypes: ['images'],
    quality: 1,
    exif: false,
  });
  if (result.canceled) return null;
  const source = result.assets[0];
  requireThat(source, 'IMAGE_MISSING');
  const context = ImageManipulator.manipulate(source.uri);
  let image: Awaited<ReturnType<typeof context.renderAsync>> | null = null;
  let convertedUri: string | null = null;
  try {
    if (source.width > 1600) context.resize({ width: 1600 });
    image = await context.renderAsync();
    const jpeg = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
    convertedUri = jpeg.uri;
    requireThat(jpeg.base64 && jpeg.base64.length <= 5592408, '照片处理后仍超过 4MB，请选择较小照片');
    return {
      id: Crypto.randomUUID(),
      digest: await imageDigest(jpeg.base64),
      mediaType: 'image/jpeg',
      dataBase64: jpeg.base64,
    };
  } finally {
    if (convertedUri) {
      const converted = new File(convertedUri);
      if (converted.exists) converted.delete();
    }
    const cache = new URL(Paths.cache.uri).pathname.replace(/\/?$/, '/');
    if (source.uri.startsWith('file:') && new URL(source.uri).pathname.startsWith(cache)) {
      const pickerCopy = new File(source.uri);
      if (pickerCopy.exists) pickerCopy.delete();
    }
    image?.release();
    context.release();
  }
}
