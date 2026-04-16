import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** Monorepo root — helps Vercel/serverless include `packages/filehasher` in the trace. */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
