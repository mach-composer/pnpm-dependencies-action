import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { Inputs } from "./types";

export async function run({ packageName }: Inputs): Promise<void> {
  let output = "";
  let error = "";

  await exec.exec(
    "pnpm",
    ["m", "ls", "--json", "--depth=1", `--filter=${packageName}`],
    {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
        stderr: (data: Buffer) => {
          error += data.toString();
        },
      },
    }
  );

  if (error != "") {
    core.error(error);
    return;
  }

  const flatDeps = parseOutput(output);
  core.setOutput("paths", toGitFilterPaths(flatDeps));
}

export function toGitFilterPaths(paths: DependencyPaths): string {
  return Object.values(paths)
    .map((value) => `--git-filter-path ${value}`)
    .join(" ");
}

type DependencyPaths = Record<string, string>;

export function parseOutput(output: string): DependencyPaths {
  const result = JSON.parse(output)[0].dependencies;
  const deps = filter(result);
  const flatDeps = flattenDeps(deps);

  const root = core.getInput("project_dirname");
  const relativePaths = Object.fromEntries(
    Object.entries(flatDeps).map(([key, value]) => [
      key,
      value.split(`${root}/`).slice(-1)[0],
    ])
  );

  return relativePaths;
}

function flattenDeps(obj) {
  let deps = {};
  for (const [key, value] of Object.entries(obj)) {
    deps[key] = value.path;
    if (value.dependencies)
      deps = {
        ...deps,
        ...flattenDeps(value.dependencies),
      };
  }
  return deps;
}

function filter(obj) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([key, value]) => {
        return key.startsWith("@commerce-");
      })
      .map(([key, value]) => [
        key,
        value.dependencies
          ? {
              ...value,
              dependencies: value.dependencies
                ? filter(value.dependencies)
                : undefined,
            }
          : value,
      ])
  );
}
