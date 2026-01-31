import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Expose Railway's commit SHA for build version display
    NEXT_PUBLIC_BUILD_SHA: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
  },

  async headers() {
    // Note: Dynamic page/API headers are handled by middleware.ts
    // This config only handles static assets
    return [
      // Versioned PDFs - long cache (immutable)
      {
        source: '/sample-report-v:version.pdf',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Legacy PDF - no cache to always serve latest
      {
        source: '/sample-report.pdf',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
