# filehasher

Monorepo with a small **`filehasher` npm package** (CLI + library) and a **Next.js** web UI. Data is protected with a **password using AES-256-GCM** (encryption you can reverse with the password). That is **not** one-way cryptographic hashing; if you need irreversible fingerprints, use a real hash (e.g. SHA-256) instead.

## Packages

| Path | Description |
|------|-------------|
| [`packages/filehasher`](packages/filehasher) | Library (`encrypt` / `decrypt`) and CLI binary `filehasher` |
| [`apps/web`](apps/web) | Next.js app: paste text → download `.fhc` file; upload `.fhc` → decrypt |

## Install (monorepo)

```bash
npm install
npm run build -w filehasher
npm run build -w web   # optional, for production web build
```

## CLI

From the repo root after building:

```bash
npx filehasher encrypt -i plain.txt -o secret.fhc -p "your password"
npx filehasher decrypt -i secret.fhc -o plain.txt -p "your password"
```

Omit `-p` to be prompted (encrypt prompts for confirmation).

## Web app

```bash
npm run dev
```

Open the printed local URL. Encrypt tab downloads `encrypted.fhc`; Decrypt tab accepts the same format (including files produced by the CLI).

## Publishing the npm package

```bash
cd packages/filehasher
npm publish --access public
```

Consumers install `filehasher` and use `import { encrypt, decrypt } from "filehasher"` or the `filehasher` CLI from `node_modules/.bin`.
