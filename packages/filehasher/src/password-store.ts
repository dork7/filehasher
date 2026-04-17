import crypto from "node:crypto";
import os from "node:os";

/** Magic "FHPS" — filehasher password store (not the same as .fhc blobs). */
const STORE_MAGIC = Buffer.from([0x46, 0x48, 0x50, 0x53]);
const STORE_VERSION = 1;
const SALT_LEN = 16;
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;

function materialString(): string {
  const hostname = os.hostname();
  const home = os.homedir();
  const { username, uid } = os.userInfo();
  const uidPart = typeof uid === "number" && uid >= 0 ? String(uid) : username;
  return `filehasher-pw-store-v1\0${hostname}\0${home}\0${username}\0${uidPart}`;
}

function wrapKey(salt: Buffer): Buffer {
  return crypto.scryptSync(materialString(), salt, KEY_LEN, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
}

export function encryptPasswordForStorage(plain: string): Buffer {
  const salt = crypto.randomBytes(SALT_LEN);
  const key = wrapKey(salt);
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([STORE_MAGIC, Buffer.from([STORE_VERSION]), salt, iv, tag, ciphertext]);
}

export function decryptPasswordFromStorage(blob: Buffer): string {
  if (blob.length < STORE_MAGIC.length + 1 + SALT_LEN + IV_LEN + TAG_LEN) {
    throw new Error("Password store file is too short.");
  }
  let o = 0;
  if (!blob.subarray(o, o + STORE_MAGIC.length).equals(STORE_MAGIC)) {
    throw new Error("Not an encrypted password store file.");
  }
  o += STORE_MAGIC.length;
  if (blob[o] !== STORE_VERSION) {
    throw new Error(`Unsupported password store version: ${blob[o]}.`);
  }
  o += 1;
  const salt = blob.subarray(o, o + SALT_LEN);
  o += SALT_LEN;
  const iv = blob.subarray(o, o + IV_LEN);
  o += IV_LEN;
  const tag = blob.subarray(o, o + TAG_LEN);
  o += TAG_LEN;
  const ciphertext = blob.subarray(o);
  const key = wrapKey(salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function isEncryptedPasswordStore(buf: Buffer): boolean {
  return buf.length >= STORE_MAGIC.length && buf.subarray(0, STORE_MAGIC.length).equals(STORE_MAGIC);
}
