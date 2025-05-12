const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  // Optional: include these image formats if you're manually managing assets
  config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif', 'webp');

  // Optional: make Metro aware of your assets folder
  config.watchFolders = [...(config.watchFolders || []), './assets'];

  // ✅ Firebase + Expo SDK 53 compatibility fixes
  config.resolver.sourceExts.push('cjs');
  config.resolver.unstable_enablePackageExports = false;

  return config;
})();
