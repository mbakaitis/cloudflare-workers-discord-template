import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.js"],
    exclude: ["test/contracts/**"],
    coverage: {
      // Istanbul, not v8: the Workers pool runs tests inside workerd, which does
      // not emit the V8 coverage profile the default provider reads.
      provider: "istanbul",
      // Template-owned logic only. `scripts/lib/` holds the pure half of the
      // command-registration CLI so it is covered by the same ratchet as `src/`.
      include: ["src/**/*.js", "scripts/lib/**/*.js"],
      reporter: ["text", "html"],
      // A ratchet, not an aspiration: these numbers are the level the suite
      // currently reaches. Raise them by hand when a change measures higher, so
      // the new promise appears in a reviewed diff; never lower them to make a
      // change pass. `thresholds.autoUpdate` is deliberately not used — a
      // threshold that moves on its own is not a reviewed promise.
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: "./wrangler.jsonc",
      },
    }),
  ],
});
