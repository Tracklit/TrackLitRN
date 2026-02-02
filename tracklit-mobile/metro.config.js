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
const originalRewriteRequestUrl = baseConfig.server?.rewriteRequestUrl;
const originalGetPolyfills = baseConfig.serializer?.getPolyfills;

// Force Metro to serve plain JS (no Hermes bytecode) in dev-client to avoid
// runtime startup issues where `require` is missing.
baseConfig.server = {
  ...baseConfig.server,
  rewriteRequestUrl: (url) => {
    const rewritten = originalRewriteRequestUrl
      ? originalRewriteRequestUrl(url)
      : url;
    const isRelative = rewritten.startsWith('/');
    const parsed = new URL(
      isRelative ? `http://localhost${rewritten}` : rewritten
    );
    if (parsed.searchParams.get('transform.bytecode') === '1') {
      parsed.searchParams.set('transform.bytecode', '0');
    }
    if (parsed.searchParams.get('lazy') === 'true') {
      parsed.searchParams.set('lazy', 'false');
    }
    parsed.searchParams.delete('unstable_transformProfile');
    return isRelative
      ? `${parsed.pathname}?${parsed.searchParams.toString()}`
      : parsed.toString();
  },
};

// Ensure `global.require` exists before the main module runs.
// Metro's polyfills may include Babel runtime helper `require()` calls in prelude,
// so we install a minimal shim that supports those string requires.
baseConfig.serializer = {
  ...baseConfig.serializer,
  getPolyfills: (ctx) => {
    const existing = originalGetPolyfills ? originalGetPolyfills(ctx) : [];
    return [path.resolve(__dirname, 'polyfills/requireShim.js'), ...existing];
  },
};

const config = {
  resolver: {
    // Workaround for Expo+Hermes "Property 'require' doesn't exist" runtime crash.
    // See: Metro package exports resolution issues in dev-client.
    unstable_enablePackageExports: false,
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
};

module.exports = mergeConfig(baseConfig, config);