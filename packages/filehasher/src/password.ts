import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { projectRootPath } from "./paths.js";

const STORED_REL = path.join(".filehasher", "password");

export function storedPasswordPath(): string {
  return path.join(projectRootPath(), STORED_REL);
}

export function readStoredPassword(): string | null {
  const p = storedPasswordPath();
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, "utf8").trim();
    return raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function saveStoredPassword(pw: string): void {
  const dir = path.dirname(storedPasswordPath());
  fs.mkdirSync(dir, { recursive: true });
  const p = storedPasswordPath();
  fs.writeFileSync(p, pw, { mode: 0o600 });
  try {
    fs.chmodSync(p, 0o600);
  } catch {
    /* ignore (e.g. Windows) */
  }
}

/** Read one line with echo off when stdin is a TTY; otherwise plain readline. */
export async function readPasswordMaskedLine(prompt: string): Promise<string> {
  if (!input.isTTY) {
    const rl = readline.createInterface({ input, output });
    try {
      return (await rl.question(prompt)).replace(/\r?\n$/, "");
    } finally {
      rl.close();
    }
  }

  output.write(prompt);
  return await new Promise((resolve, reject) => {
    let password = "";
    const cleanup = () => {
      try {
        input.setRawMode(false);
      } catch {
        /* ignore */
      }
      input.removeListener("data", onData);
    };

    const onData = (chunk: Buffer | string) => {
      const s = typeof chunk === "string" ? chunk : chunk.toString("utf8");
      for (const char of s) {
        const code = char.charCodeAt(0);
        if (char === "\n" || char === "\r") {
          cleanup();
          output.write("\n");
          resolve(password);
          return;
        }
        if (code === 3) {
          cleanup();
          output.write("\n");
          process.exit(130);
        }
        if (code === 127 || code === 8) {
          if (password.length > 0) {
            password = password.slice(0, -1);
            output.write("\b \b");
          }
          continue;
        }
        password += char;
        output.write("*");
      }
    };

    try {
      input.setRawMode(true);
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
      return;
    }
    input.resume();
    input.on("data", onData);
  });
}

export type ResolvePasswordOpts = {
  password?: string;
  forcePrompt?: boolean;
};

export type ResolvePasswordOptions = {
  confirm: boolean;
  /** When true, save to .filehasher/password after a successful interactive entry. */
  saveIfInteractive: boolean;
};

export async function resolvePassword(
  opts: ResolvePasswordOpts,
  options: ResolvePasswordOptions,
): Promise<string> {
  if (opts.password !== undefined && opts.password !== "") {
    return opts.password;
  }
  if (!opts.forcePrompt) {
    const stored = readStoredPassword();
    if (stored) return stored;
  }
  const pw = await readPasswordMaskedLine("Password: ");
  if (options.confirm) {
    const again = await readPasswordMaskedLine("Confirm password: ");
    if (pw !== again) {
      throw new Error("Passwords do not match.");
    }
  }
  if (options.saveIfInteractive) {
    saveStoredPassword(pw);
  }
  return pw;
}
