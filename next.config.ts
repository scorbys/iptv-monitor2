import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    domains: [
      "upload.wikimedia.org",
      "via.placeholder.com",
      "placehold.co",
      "cdn.jsdelivr.net"
    ],
  },
};

export default nextConfig;
