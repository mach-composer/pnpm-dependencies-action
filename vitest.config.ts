import path from "path";
import { defineConfig } from "vitest/config";

// We use defineConfig here instead of the recommended defineProject since
// we want to set coverage.include when running tests in the package itself
export default defineConfig({
  test: {
    setupFiles: [path.join(__dirname, "vitest.setup.ts")],
    coverage: {
      include: ["src/**/*.ts"],
    },
  },

  resolve: {
    alias: {
      "~src": path.join(__dirname, "src"),
    },
  },
});
