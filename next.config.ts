import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.DEEP_CONTENT_REVIEW === "1" ? { distDir: ".next-deep-preview" } : {}),
  agentRules: false,
  images: { unoptimized: true },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.headcanongenerator.run",
          },
        ],
        destination: "https://headcanongenerator.run/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
