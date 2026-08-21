/**
 * Minimal Worker entry point used as the template's extension surface.
 *
 * Handlers receive the Worker's bindings as their `env` argument. This project is
 * plain JavaScript with JSDoc and does not generate TypeScript binding types, so
 * document each binding you add here rather than relying on a generated type.
 */
export default {
  /**
   * Return a basic health response while the template has no application logic.
   *
   * @returns {Response}
   */
  fetch() {
    return new Response("OK");
  },
};
