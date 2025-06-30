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
      },
      {
        protocol: "https",
        hostname: "biznethome.net",
      },
    ],
  },

  // Headers untuk security (tidak untuk CORS ke external API)
  async headers() {
    return [
      {
        // Untuk semua routes
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://iptv-monitor-backend-production.up.railway.app/api/:path*",
      },
    ];
  },

  experimental: {
    serverActions: {
      allowedOrigins: [
        "https://iptv-monitor2.vercel.app",
        "https://iptv-monitor-backend-production.up.railway.app",
      ],
    },
  },
};

export default nextConfig;
