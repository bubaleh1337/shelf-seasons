import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Local Cloudflare emulation does not provide the hosted image service.
    // Serve public covers directly in development; production stays optimized.
    unoptimized: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
