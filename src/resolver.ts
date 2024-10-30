import fs from "node:fs";
import path from "node:path";

type PackageMap = { [packageName: string]: string };

export class DependencyResolver {
  private monorepoRoot: string;
  private packageMap: PackageMap;
  private startDir: string;

  private skipPaths = ["node_modules", ".git", ".turbo", ".pnpm"];

  /**
   * Creates an instance of MonorepoDependencyResolver.
   * Automatically detects the monorepo root and builds a package map.
   * @param {string} startDir - The directory to start searching for the monorepo root.
   * Defaults to the current directory.
   * @throws {Error} If no monorepo root is found.
   */
  constructor(startDir: string) {
    this.startDir = startDir;
    this.monorepoRoot = this.findMonorepoRoot(startDir);
    if (!this.monorepoRoot) {
      throw new Error(
        "Monorepo root not found. Ensure you're in a monorepo with a .git directory or pnpm-workspace.yaml.",
      );
    }
    this.packageMap = this.buildPackageMap();
  }

  /**
   * Retrieves all local dependencies for a given package.
   * @param {string} packageName - The name of the package to find dependencies for.
   * @returns {string[]} An array of local dependency package names.
   */
  public getLocalDependenciesForPackage(packageName: string): string[] {
    const packageDir = this.packageMap[packageName];
    if (!packageDir) {
      console.error(`Package ${packageName} not found in monorepo.`);
      return [];
    }
    return this.listAllLocalDependencies(packageDir)
      .map((dep) => this.packageMap[dep])
      .map((depPath) => path.relative(this.startDir, depPath)); // Convert to relative paths
  }

  /**
   * Finds the monorepo root by walking up the directory tree.
   * Looks for a .git folder or pnpm-workspace.yaml file.
   * @param {string} dir - The starting directory for the search.
   * @returns {string | null} The path to the monorepo root, or null if not found.
   */
  private findMonorepoRoot(dir: string): string {
    const rootIndicators = [".git", "pnpm-workspace.yaml"];
    let currentDir = dir;

    while (currentDir !== path.parse(currentDir).root) {
      if (
        rootIndicators.some((indicator) =>
          fs.existsSync(path.join(currentDir, indicator)),
        )
      ) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    throw new Error("Monorepo root not found.");
  }

  /**
   * Builds a map of package names to their directory paths.
   * @returns {PackageMap} An object mapping package names to directory paths.
   */
  private buildPackageMap(): PackageMap {
    const packageMap: PackageMap = {};
    this.mapPackagesRecursively(this.monorepoRoot, packageMap);
    return packageMap;
  }

  /**
   * Recursively searches directories for packages and maps their names to paths.
   * @param {string} dir - The directory to search within.
   * @param {PackageMap} packageMap - The map to populate with package name-path pairs.
   */
  private mapPackagesRecursively(dir: string, packageMap: PackageMap): void {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (this.skipPaths.includes(item.name)) continue; // Skip certain directories

        const packageJsonPath = path.join(fullPath, "package.json");
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf8"),
          );
          packageMap[packageJson.name] = fullPath; // Map package name to directory
        } else {
          this.mapPackagesRecursively(fullPath, packageMap); // Recurse into subdirectories
        }
      }
    }
  }

  /**
   * Retrieves all direct local dependencies for a given package directory.
   * @param {string} packageDir - The directory of the package.
   * @returns {string[]} An array of local dependency package names.
   */
  private getLocalDependencies(packageDir: string): string[] {
    const packageJsonPath = path.join(packageDir, "package.json");
    if (!fs.existsSync(packageJsonPath)) return [];

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const dependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    return Object.keys(dependencies).filter((dep) => {
      const depVersion = dependencies[dep];
      return depVersion.startsWith("workspace:") && this.packageMap[dep]; // Check if dep is local
    });
  }

  public getPackagePath(packageName: string): string {
    return path.relative(this.startDir, this.packageMap[packageName]);
  }

  /**
   * Recursively resolves all local dependencies for a given package directory.
   * @param {string} packageDir - The directory of the package.
   * @param {Set<string>} visited - A set to track visited directories and avoid circular dependencies.
   * @returns {string[]} An array of all unique local dependencies.
   */
  private listAllLocalDependencies(
    packageDir: string,
    visited: Set<string> = new Set(),
  ): string[] {
    if (visited.has(packageDir)) return [];
    visited.add(packageDir);

    const directDeps = this.getLocalDependencies(packageDir);
    const recursiveDeps = directDeps.flatMap((dep) =>
      this.listAllLocalDependencies(this.packageMap[dep], visited),
    );

    return Array.from(new Set([...directDeps, ...recursiveDeps]));
  }
}
