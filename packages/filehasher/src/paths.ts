import path from "node:path";

/** Resolve relative paths against the directory where the user ran npm/npx (not the package cwd). */
export function resolveUserPath(p: string): string {
  if (path.isAbsolute(p)) return path.resolve(p);
  const base = process.env.INIT_CWD ?? process.cwd();
  return path.resolve(base, p);
}

export function defaultDecryptOutput(encryptedPath: string): string {
  const dir = path.dirname(encryptedPath);
  const base = path.basename(encryptedPath);
  if (base.toLowerCase().endsWith(".fhc")) {
    return path.join(dir, base.slice(0, -4));
  }
  return path.join(dir, base + ".decrypted");
}

/** Project root for storing .filehasher (same base as relative path resolution). */
export function projectRootPath(): string {
  return resolveUserPath(".");
}
