import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  outputFileTracingRoot: path.join(__dirname),
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://172.24.160.1:3000",
    "http://172.24.160.1:3001",
    "http://172.24.160.1:3002",
  ],
};

export default nextConfig;
