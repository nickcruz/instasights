import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ffmpeg-static", "ffprobe-static"],
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/api/internal/transcriptions": [
      "../../node_modules/ffmpeg-static/**",
      "../../node_modules/ffprobe-static/**",
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default withWorkflow(nextConfig);
