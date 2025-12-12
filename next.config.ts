import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NODE_ENV === "production" 
        ? [process.env.NEXTAUTH_URL || "https://*.vercel.app"]
        : ["*"],
    },
  },
};

export default nextConfig;

