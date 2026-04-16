import { createHash } from "node:crypto";
import fs from "node:fs";
import { stdin } from "node:process";

/** Common digests supported by Node's `crypto.createHash`. */
const DEFAULT_ALGORITHM = "sha256";

export function isSupportedAlgorithm(name: string): boolean {
  try {
    createHash(name);
    return true;
  } catch {
    return false;
  }
}

export function hashBuffer(data: Buffer, algorithm: string = DEFAULT_ALGORITHM): Buffer {
  return createHash(algorithm).update(data).digest();
}

export async function hashFile(path: string, algorithm: string = DEFAULT_ALGORITHM): Promise<Buffer> {
  const hash = createHash(algorithm);
  const stream = fs.createReadStream(path);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest();
}

export async function hashStdin(algorithm: string = DEFAULT_ALGORITHM): Promise<Buffer> {
  const hash = createHash(algorithm);
  for await (const chunk of stdin) {
    hash.update(chunk);
  }
  return hash.digest();
}
