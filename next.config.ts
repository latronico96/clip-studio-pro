import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["https://*.ngrok-free.app"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "p16-sign.tiktokcdn.com" },

    ],
  },
};

export default nextConfig;
