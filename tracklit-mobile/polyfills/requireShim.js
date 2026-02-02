/**
 * Metro prelude/polyfills sometimes contain `require("@babel/runtime/helpers/defineProperty")`
 * (string-based require) before the normal Metro module system has provided a Node-style
 * resolver.
 *
 * In React Native, Metro's runtime `__r` expects numeric module IDs, not names.
 * This shim provides:
 * - `require(number)` -> delegates to Metro `__r`
 * - `require("@babel/runtime/helpers/defineProperty")` -> returns an inline helper
 */

(function () {
  const g = typeof globalThis !== 'undefined' ? globalThis : global;
  if (!g) return;

  function babelDefineProperty(obj, key, value) {
    // Mirrors @babel/runtime/helpers/defineProperty behavior
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }

  // Only define if missing; don't overwrite Metro/module-scoped requires.
  if (typeof g.require !== 'function') {
    g.require = function requireShim(idOrName) {
      if (typeof idOrName === 'number') {
        if (typeof g.__r !== 'function') {
          throw new Error('Metro runtime not ready: __r is not defined.');
        }
        return g.__r(idOrName);
      }

      if (idOrName === '@babel/runtime/helpers/defineProperty') {
        return babelDefineProperty;
      }

      throw new Error(`Requiring unknown module \"${String(idOrName)}\".`);
    };
  }
})();

