#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Command } from "commander";
import { decrypt, encrypt } from "./crypto.js";

async function readPassword(confirm: boolean): Promise<string> {
  const rl = readline.createInterface({ input, output });
  try {
    const pw = await rl.question("Password: ");
    if (confirm) {
      const again = await rl.question("Confirm password: ");
      if (pw !== again) {
        throw new Error("Passwords do not match.");
      }
    }
    return pw;
  } finally {
    rl.close();
  }
}

const program = new Command();

program
  .name("filehasher")
  .description(
    "Encrypt or decrypt files with a password (AES-256-GCM). Not one-way hashing — data can be recovered with the password.",
  )
  .version("1.0.0");

program
  .command("encrypt")
  .description("Encrypt a file")
  .requiredOption("-i, --input <path>", "Input file path")
  .requiredOption("-o, --output <path>", "Output file path")
  .option("-p, --password <string>", "Password (omit to prompt)")
  .action(async (opts: { input: string; output: string; password?: string }) => {
    const inPath = path.resolve(opts.input);
    const outPath = path.resolve(opts.output);
    if (!fs.existsSync(inPath)) {
      console.error(`Input not found: ${inPath}`);
      process.exit(1);
    }
    const password =
      opts.password !== undefined ? opts.password : await readPassword(true);
    if (!password) {
      console.error("Password is required.");
      process.exit(1);
    }
    const plain = fs.readFileSync(inPath);
    const blob = encrypt(plain, password);
    fs.writeFileSync(outPath, blob);
    console.log(`Wrote encrypted file: ${outPath}`);
  });

program
  .command("decrypt")
  .description("Decrypt a file")
  .requiredOption("-i, --input <path>", "Encrypted file path")
  .requiredOption("-o, --output <path>", "Output file path")
  .option("-p, --password <string>", "Password (omit to prompt)")
  .action(async (opts: { input: string; output: string; password?: string }) => {
    const inPath = path.resolve(opts.input);
    const outPath = path.resolve(opts.output);
    if (!fs.existsSync(inPath)) {
      console.error(`Input not found: ${inPath}`);
      process.exit(1);
    }
    const password =
      opts.password !== undefined ? opts.password : await readPassword(false);
    if (!password) {
      console.error("Password is required.");
      process.exit(1);
    }
    const blob = fs.readFileSync(inPath);
    try {
      const plain = decrypt(blob, password);
      fs.writeFileSync(outPath, plain);
      console.log(`Wrote decrypted file: ${outPath}`);
    } catch (e) {
      console.error(
        e instanceof Error ? e.message : "Decryption failed (wrong password or corrupt file).",
      );
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
