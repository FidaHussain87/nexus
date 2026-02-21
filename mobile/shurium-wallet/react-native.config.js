/**
 * React Native configuration for SHURIUM Wallet
 * This file allows for auto-linking of native modules
 */
module.exports = {
  project: {
    ios: {
      sourceDir: './ios',
    },
    android: {
      sourceDir: './android',
      // Package name for the Android app
      packageName: 'com.shuriumwallet',
    },
  },
  // Dependencies configuration for auto-linking
  dependencies: {},
};
