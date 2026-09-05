import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Stage 1 uses a bundled demo cover. Serving it directly keeps local and
    // production behavior identical and avoids any image-optimizer runtime.
    unoptimized: true,
  },
};

export default nextConfig;
