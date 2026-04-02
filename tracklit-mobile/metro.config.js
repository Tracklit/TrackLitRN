const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const baseConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  watchFolders: [path.resolve(__dirname, 'src')],
  watcher: {
    healthCheck: {
      enabled: true,
    },
    watchman: {
      deferStates: [],
    },
  },
};

module.exports = mergeConfig(baseConfig, config);
