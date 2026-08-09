import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root. Without this, Next infers it from the nearest
  // ancestor lockfile — which on a dev machine with a stray package-lock.json in
  // the home directory silently resolves the root to ~, and warns on every build.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
