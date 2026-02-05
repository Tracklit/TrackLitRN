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
};

module.exports = mergeConfig(baseConfig, config);