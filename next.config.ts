import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
