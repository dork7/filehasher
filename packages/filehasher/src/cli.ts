#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { decrypt, encrypt } from "./crypto.js";
import { hashFile, hashStdin, isSupportedAlgorithm } from "./hash.js";
import { defaultDecryptOutput, resolveUserPath } from "./paths.js";
import { resolvePassword } from "./password.js";

const program = new Command();

program
  .name("filehasher")
  .description(
    "Encrypt/decrypt with a password (AES-256-GCM), or compute one-way file hashes (e.g. SHA-256).",
  )
  .version("1.0.0");

program.addHelpText(
  "after",
  `
Use in your project (after npm install @dork7/filehasher), add scripts to package.json:

  "scripts": {
    "encrypt": "filehasher encrypt -i path/to/plain.txt -o path/to/out.fhc",
    "decrypt": "filehasher decrypt -i path/to/out.fhc -o path/to/plain.txt",
    "env:hash": "filehasher env lock",
    "env:dehash": "filehasher env unlock"
  }

Then run one of: npm run encrypt, npm run decrypt, npm run env:hash, npm run env:dehash
`,
);

program
  .command("encrypt")
  .description("Encrypt a file")
  .argument("[file]", "File to encrypt (or use -i)")
  .option("-i, --input <path>", "Input file path")
  .option("-o, --output <path>", "Output file path (default: <input>.fhc next to input)")
  .option("-p, --password <string>", "Password (omit to prompt)")
  .action(
    async (
      file: string | undefined,
      opts: { input?: string; output?: string; password?: string },
    ) => {
      const inRel = opts.input ?? file;
      if (!inRel) {
        console.error("Specify an input file (positional argument or -i).");
        process.exit(1);
      }
      const inPath = resolveUserPath(inRel);
      const outPath = opts.output
        ? resolveUserPath(opts.output)
        : path.join(path.dirname(inPath), path.basename(inPath) + ".fhc");
      if (!fs.existsSync(inPath)) {
        console.error(`Input not found: ${inPath}`);
        process.exit(1);
      }
      let password: string;
      try {
        password = await resolvePassword({ password: opts.password }, { confirm: true });
      } catch (e) {
        console.error(e instanceof Error ? e.message : e);
        process.exit(1);
      }
      if (!password) {
        console.error("Password is required.");
        process.exit(1);
      }
      const plain = fs.readFileSync(inPath);
      const blob = encrypt(plain, password);
      fs.writeFileSync(outPath, blob);
      console.log(`Wrote encrypted file: ${outPath}`);
    },
  );

program
  .command("decrypt")
  .description("Decrypt a file")
  .argument("[file]", "Encrypted file (or use -i)")
  .option("-i, --input <path>", "Encrypted file path")
  .option("-o, --output <path>", "Output file path (default: strip .fhc or add .decrypted)")
  .option("-p, --password <string>", "Password (omit to prompt)")
  .action(
    async (
      file: string | undefined,
      opts: { input?: string; output?: string; password?: string },
    ) => {
      const inRel = opts.input ?? file;
      if (!inRel) {
        console.error("Specify an encrypted file (positional argument or -i).");
        process.exit(1);
      }
      const inPath = resolveUserPath(inRel);
      const outPath = opts.output ? resolveUserPath(opts.output) : defaultDecryptOutput(inPath);
      if (!fs.existsSync(inPath)) {
        console.error(`Input not found: ${inPath}`);
        process.exit(1);
      }
      let password: string;
      try {
        password = await resolvePassword({ password: opts.password }, { confirm: false });
      } catch (e) {
        console.error(e instanceof Error ? e.message : e);
        process.exit(1);
      }
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
    },
  );

program
  .command("hash")
  .description("Compute a cryptographic digest of a file (one-way; not reversible)")
  .argument("[file]", "File to hash (omit to read stdin)")
  .option("-i, --input <path>", "Same as positional file")
  .option("-a, --algorithm <name>", "Digest algorithm (default: sha256)", "sha256")
  .option("--base64", "Print digest as base64 instead of hex")
  .action(
    async (
      file: string | undefined,
      opts: { input?: string; algorithm: string; base64?: boolean },
    ) => {
      const algorithm = opts.algorithm.toLowerCase();
      if (!isSupportedAlgorithm(algorithm)) {
        console.error(`Unsupported or invalid algorithm: ${opts.algorithm}`);
        process.exit(1);
      }
      const pathArg = opts.input ?? file;
      let digest: Buffer;
      try {
        if (pathArg) {
          const inPath = resolveUserPath(pathArg);
          if (!fs.existsSync(inPath)) {
            console.error(`Input not found: ${inPath}`);
            process.exit(1);
          }
          digest = await hashFile(inPath, algorithm);
        } else {
          digest = await hashStdin(algorithm);
        }
      } catch (e) {
        console.error(e instanceof Error ? e.message : e);
        process.exit(1);
      }
      const out = opts.base64 ? digest.toString("base64") : digest.toString("hex");
      console.log(out);
    },
  );

const envCmd = program
  .command("env")
  .description(
    "Encrypt or decrypt .env in the working directory (writes .env.fhc or restores .env).",
  );

envCmd
  .command("lock")
  .description("Encrypt .env → .env.fhc (password from -p or masked prompt)")
  .alias("hash")
  .option("-p, --password <string>", "Password (omit to prompt)")
  .action(async (opts: { password?: string }) => {
    const inPath = resolveUserPath(".env");
    const outPath = path.join(path.dirname(inPath), path.basename(inPath) + ".fhc");
    if (!fs.existsSync(inPath)) {
      console.error(`No .env in ${path.dirname(inPath)}`);
      process.exit(1);
    }
    let password: string;
    try {
      password = await resolvePassword({ password: opts.password }, { confirm: true });
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    }
    if (!password) {
      console.error("Password is required.");
      process.exit(1);
    }
    const plain = fs.readFileSync(inPath);
    const blob = encrypt(plain, password);
    fs.writeFileSync(outPath, blob);
    console.log(`Wrote encrypted file: ${outPath}`);
  });

envCmd
  .command("unlock")
  .description("Decrypt .env.fhc → .env (password from -p or masked prompt)")
  .alias("dehash")
  .option("-p, --password <string>", "Password (omit to prompt)")
  .action(async (opts: { password?: string }) => {
    const inPath = resolveUserPath(".env.fhc");
    const outPath = defaultDecryptOutput(inPath);
    if (!fs.existsSync(inPath)) {
      console.error(`No .env.fhc in ${path.dirname(inPath)}`);
      process.exit(1);
    }
    let password: string;
    try {
      password = await resolvePassword({ password: opts.password }, { confirm: false });
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    }
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
