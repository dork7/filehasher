import crypto from "node:crypto";
import {
  FORMAT_VERSION,
  IV_LENGTH,
  KEY_LENGTH,
  MAGIC,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  TAG_LENGTH,
} from "./constants.js";

const ALGO = "aes-256-gcm";

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    "sha256",
  );
}

/**
 * Encrypt plaintext with a password. Output is a self-contained binary blob
 * (not a one-way hash; the password is required to recover the data).
 */
export function encrypt(plaintext: Buffer, password: string): Buffer {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([
    MAGIC,
    Buffer.from([FORMAT_VERSION]),
    salt,
    iv,
    tag,
    ciphertext,
  ]);
}

/**
 * Decrypt a blob produced by {@link encrypt}.
 */
export function decrypt(blob: Buffer, password: string): Buffer {
  if (blob.length < MAGIC.length + 1 + SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
    throw new Error("File is too short or corrupted.");
  }
  let o = 0;
  if (!blob.subarray(o, o + MAGIC.length).equals(MAGIC)) {
    throw new Error("Unknown file format (bad magic bytes).");
  }
  o += MAGIC.length;
  const version = blob[o];
  o += 1;
  if (version !== FORMAT_VERSION) {
    throw new Error(`Unsupported format version: ${version}.`);
  }
  const salt = blob.subarray(o, o + SALT_LENGTH);
  o += SALT_LENGTH;
  const iv = blob.subarray(o, o + IV_LENGTH);
  o += IV_LENGTH;
  const tag = blob.subarray(o, o + TAG_LENGTH);
  o += TAG_LENGTH;
  const ciphertext = blob.subarray(o);
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
