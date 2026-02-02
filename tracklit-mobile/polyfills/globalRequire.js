/**
 * Metro / Hermes dev-client compatibility shim.
 *
 * Some parts of the runtime (or 3rd-party code) expect `global.require` to exist,
 * while Metro exposes the module loader as `global.__r`.
 *
 * Defining `global.require = global.__r` early prevents:
 *   ReferenceError: Property 'require' doesn't exist
 */

/* eslint-disable no-undef */
(function () {
  if (typeof global === 'undefined') return;
  // eslint-disable-next-line no-undef
  const g = global;
  if (!g.require && typeof g.__r === 'function') {
    g.require = g.__r;
  }
})();

