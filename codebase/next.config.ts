import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io", "*.ngrok-free.dev", "localhost:3000", "127.0.0.1:3000"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.ngrok-free.app",
        "*.ngrok.io",
        "*.ngrok-free.dev",
        "localhost:3000",
        "127.0.0.1:3000",
      ],
    },
  },
};

export default nextConfig;
