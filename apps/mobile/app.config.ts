export default {
  expo: {
    name: 'EvoLoop', slug: 'evoloop-two', version: '0.1.0', scheme: 'evoloop-two',
    icon: './assets/icon.png',
    orientation: 'portrait', userInterfaceStyle: 'automatic', platforms: ['ios'],
    ios: {
      bundleIdentifier: 'com.evoloop.two', supportsTablet: true,
      entitlements: { 'com.apple.developer.default-data-protection': 'NSFileProtectionComplete' },
      infoPlist: { NSFaceIDUsageDescription: '解锁此设备上的 EvoLoop 本地记录。' },
    },
    plugins: [['expo-sqlite', { useSQLCipher: true }], 'expo-secure-store', ['expo-image-picker', {
      photosPermission: '选择餐食照片，供你核对饮食草案。', cameraPermission: '拍摄餐食照片，供你核对饮食草案。', microphonePermission: false,
    }]],
    experiments: { autolinkingModuleResolution: true },
  },
};
