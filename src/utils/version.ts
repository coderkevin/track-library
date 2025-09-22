import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the current version of the track library
 */
export function getVersion(): string {
  try {
    // Try to read from package.json
    const packageJsonPath = join(__dirname, "../../../package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return packageJson.version || "1.0.0";
  } catch (error) {
    // Fallback to a default version if package.json can't be read
    return "1.0.0";
  }
}

/**
 * Get version info including build date
 */
export function getVersionInfo(): {
  version: string;
  buildDate: string;
  nodeVersion: string;
} {
  return {
    version: getVersion(),
    buildDate: new Date().toISOString(),
    nodeVersion: process.version,
  };
}
