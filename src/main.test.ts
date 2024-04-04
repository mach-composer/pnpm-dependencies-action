import { expect, it } from "vitest";
import { parseOutput, toGitFilterPaths } from "./main";

it("should parse output", async () => {
  const result = await parseOutput(
    JSON.stringify([
      {
        name: "@commerce-backend/checkout",
        path: "/home/runner/work/mach-project/mach-project/backend/services/checkout",
        private: true,
        dependencies: {
          "@commerce-backend/graphql-types": {
            from: "@commerce-backend/graphql-types",
            version: "link:../../packages/graphql-types",
            path: "/home/runner/work/mach-project/mach-project/backend/packages/graphql-types",
          },
          "@labdigital/enviconf": {
            from: "@labdigital/enviconf",
            version: "0.6.0",
            resolved:
              "https://registry.npmjs.org/@labdigital/enviconf/-/enviconf-0.6.0.tgz",
            path: "/home/runner/work/mach-project/mach-project/node_modules/.pnpm/@labdigital+enviconf@0.6.0/node_modules/@labdigital/enviconf",
          },
          graphql: {
            from: "graphql",
            version: "16.8.1",
            resolved: "https://registry.npmjs.org/graphql/-/graphql-16.8.1.tgz",
            path: "/home/runner/work/mach-project/mach-project/node_modules/.pnpm/graphql@16.8.1/node_modules/graphql",
          },
          "@commerce-backend/cache-utils": {
            from: "@commerce-backend/cache-utils",
            version: "link:../../packages/cache-utils",
            path: "/home/runner/work/mach-project/mach-project/backend/packages/cache-utils",
            dependencies: {
              "@commerce-shared/observability": {
                from: "@commerce-shared/observability",
                version: "link:../../../packages/observability",
                path: "/home/runner/work/mach-project/mach-project/packages/observability",
              },
              "@keyv/redis": {
                from: "@keyv/redis",
                version: "2.8.4",
                resolved:
                  "https://registry.npmjs.org/@keyv/redis/-/redis-2.8.4.tgz",
                path: "/home/runner/work/mach-project/mach-project/node_modules/.pnpm/@keyv+redis@2.8.4/node_modules/@keyv/redis",
              },
            },
          },
        },
      },
    ]),
  );

  expect(result).toStrictEqual({
    "@commerce-backend/graphql-types": "backend/packages/graphql-types",
    "@commerce-backend/cache-utils": "backend/packages/cache-utils",
    "@commerce-shared/observability": "packages/observability",
  });
});

it("should parse filter paths", async () => {
  expect(
    toGitFilterPaths({
      "@commerce-backend/graphql-types": "backend/packages/graphql-types",
      "@commerce-backend/cache-utils": "backend/packages/cache-utils",
      "@commerce-shared/observability": "packages/observability",
    }),
  ).toBe(
    "--git-filter-path backend/packages/graphql-types --git-filter-path backend/packages/cache-utils --git-filter-path packages/observability",
  );
});
