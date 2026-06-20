import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The Upwork client runs server-side only; never expose secrets to the browser.
  serverExternalPackages: [],
};

export default nextConfig;
