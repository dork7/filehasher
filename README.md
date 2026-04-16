# filehasher

Monorepo with a small **`@dork7/filehasher`** npm package (CLI + library) and a **Next.js** web UI. Data is protected with a **password using AES-256-GCM** (encryption you can reverse with the password). That is **not** one-way cryptographic hashing; if you need irreversible fingerprints, use a real hash (e.g. SHA-256) instead.

## Packages

| Path | Description |
|------|-------------|
| [`packages/filehasher`](packages/filehasher) | Library (`encrypt` / `decrypt`) and CLI binary `filehasher` |
| [`apps/web`](apps/web) | Next.js app: paste text → download `.fhc` file; upload `.fhc` → decrypt |

## Install (monorepo)

```bash
npm install
npm run build -w @dork7/filehasher
npm run build -w web   # optional, for production web build
```

## CLI

From the repo root after building:

```bash
npx filehasher encrypt -i plain.txt -o secret.fhc -p "your password"
npx filehasher decrypt -i secret.fhc -o plain.txt -p "your password"
```

Omit `-p` to be prompted (encrypt prompts for confirmation).

**One-way file hash** (SHA-256 by default; any name accepted by Node’s `crypto.createHash`):

```bash
npx filehasher hash README.md
npx filehasher hash -i README.md -a sha512
echo -n "hello" | npx filehasher hash
npm run hash -- ./path/to/file   # from repo root (forwards args after --)
```

## Web app

```bash
npm run dev
```

Open the printed local URL. Encrypt tab downloads `encrypted.fhc`; Decrypt tab accepts the same format (including files produced by the CLI).

## Publishing the npm package

The published name is **`@dork7/filehasher`** (scoped; unscoped `filehasher` is blocked by npm as too similar to `file-hasher`).

```bash
npm run publish:filehasher
```

