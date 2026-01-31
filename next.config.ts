import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Expose Railway's commit SHA for build version display
    NEXT_PUBLIC_BUILD_SHA: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
  },
};

export default nextConfig;
