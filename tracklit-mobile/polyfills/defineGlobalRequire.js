/**
 * Defines `global.require` early (as a getter) to avoid Hermes throwing:
 *   ReferenceError: Property 'require' doesn't exist
 *
 * Metro exposes the module loader as `global.__r` during bundle initialization.
 * Some runtime paths access `global.require` before/while the runtime is warming up.
 *
 * By defining the property up-front, reading `global.require` will not throw, and once
 * `global.__r` exists the getter will return it.
 */

/* eslint-disable no-undef */
(function () {
  if (typeof globalThis === 'undefined') return;

  const g = globalThis;
  if (!Object.prototype.hasOwnProperty.call(g, 'require')) {
    Object.defineProperty(g, 'require', {
      configurable: true,
      enumerable: false,
      get() {
        return g.__r;
      },
    });
  }
})();

