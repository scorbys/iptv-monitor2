import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "logotyp.us",
      },
      {
        protocol: "https",
        hostname: "worldvectorlogo.com",
      },
      {
        protocol: "https",
        hostname: "www.biznetnetworks.com",
      }
    ],
  },
};

export default nextConfig;
