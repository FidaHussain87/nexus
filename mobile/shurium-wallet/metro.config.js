const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration for SHURIUM Wallet
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    // Support for TypeScript
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
    // Asset extensions for images and fonts
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ttf', 'otf', 'woff', 'woff2'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
