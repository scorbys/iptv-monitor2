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
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
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
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;

    // Production: Gunakan NEXT_PUBLIC_API_URL atau fallback ke Railway
    if (process.env.NODE_ENV === "production") {
      // Fallback ke Railway URL jika NEXT_PUBLIC_API_URL tidak diset
      const productionBackendUrl = backendUrl || "https://iptv-monitor-backend-production.up.railway.app";

      // Validasi HTTPS hanya jika backendUrl diset secara manual
      if (backendUrl) {
        try {
          const url = new URL(backendUrl);
          if (url.protocol !== 'https:') {
            console.warn(`Warning: NEXT_PUBLIC_API_URL should use HTTPS in production. Current: ${url.protocol}`);
          }
        } catch (error) {
          // Invalid URL, use fallback
          console.warn(`Warning: Invalid NEXT_PUBLIC_API_URL, using fallback URL`);
        }
      }

      return [
        {
          source: "/api/:path*",
          destination: `${productionBackendUrl}/api/:path*`,
        },
      ];
    }

    // Development: Gunakan NEXT_PUBLIC_API_URL atau fallback ke localhost
    const devBackendUrl = backendUrl || "http://localhost:3001";

    return [
      {
        source: "/api/:path*",
        destination: `${devBackendUrl}/api/:path*`,
      },
    ];
  },

  // Handling timeout
  async redirects() {
    return [];
  },

  // Error handling untuk development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Server Actions configuration (untuk Next.js 16)
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
