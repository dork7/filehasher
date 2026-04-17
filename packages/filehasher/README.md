# @dork7/filehasher

Password-protected file encryption (**AES-256-GCM**) with a **CLI** and **library** API. For one-way file fingerprints (e.g. SHA-256), use the `hash` command.

## Install

```bash
npm install @dork7/filehasher
```

## CLI

```bash
npx filehasher encrypt -i plain.txt -o secret.fhc
npx filehasher decrypt -i secret.fhc -o plain.txt
```

Omit `-p` / `--password` for a masked prompt (encrypt asks for confirmation). Passwords are not saved to disk.

**`.env` helpers** (same directory as the working directory):

```bash
npx filehasher env lock    # .env → .env.fhc (alias: env hash)
npx filehasher env unlock  # .env.fhc → .env (alias: env dehash)
```

**One-way digest** (not encryption):

```bash
npx filehasher hash ./file.txt
```

## Library

```js
import { encrypt, decrypt, hashBuffer } from "@dork7/filehasher";
```

## Requirements

Node.js **18+**.

## Repository

Source lives in the [filehasher](https://github.com/dork7/filehasher) monorepo under `packages/filehasher`.
