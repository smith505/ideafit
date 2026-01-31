import type { NextConfig } from "next";

const buildSha = (process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev').slice(0, 7);

const nextConfig: NextConfig = {
  env: {
    // Expose Railway's commit SHA for build version display
    NEXT_PUBLIC_BUILD_SHA: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
  },

  async headers() {
    return [
      // HTML document routes - no caching to ensure fresh content
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'x-ideafit-build', value: buildSha },
        ],
      },
      {
        source: '/quiz',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'x-ideafit-build', value: buildSha },
        ],
      },
      {
        source: '/results',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'x-ideafit-build', value: buildSha },
        ],
      },
      {
        source: '/preview/:id*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'x-ideafit-build', value: buildSha },
        ],
      },
      {
        source: '/report/:id*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'x-ideafit-build', value: buildSha },
        ],
      },
      {
        source: '/access',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'x-ideafit-build', value: buildSha },
        ],
      },
      {
        source: '/login',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'x-ideafit-build', value: buildSha },
        ],
      },
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
