/** Magic bytes identifying this file format (ASCII: "FHCR"). */
export const MAGIC = Buffer.from([0x46, 0x48, 0x43, 0x52]);

export const FORMAT_VERSION = 1;

/** PBKDF2 iterations (balance of security vs. speed). */
export const PBKDF2_ITERATIONS = 210_000;

export const SALT_LENGTH = 16;
export const IV_LENGTH = 12;
export const KEY_LENGTH = 32;
export const TAG_LENGTH = 16;
