import * as core from "@actions/core";
import { DependencyResolver } from "./resolver";

type Inputs = {
  packageName: string;
};

export async function run({ packageName }: Inputs): Promise<void> {
  const resolver = new DependencyResolver(process.cwd());

  const primary = resolver.getPackagePath(packageName);
  const dependencies = resolver.getLocalDependenciesForPackage(packageName);
  const paths = [primary, ...dependencies];

  console.log("Paths to filter:", paths);

  core.setOutput("paths", toGitFilterPaths(paths));
}

const toGitFilterPaths = (paths: string[]): string => {
  return paths.map((value) => `--git-filter-path ${value}`).join(" ");
};
