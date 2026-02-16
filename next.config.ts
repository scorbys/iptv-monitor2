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
    // Support both NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_BASE_URL for backward compatibility
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

    // Production: Gunakan backend URL atau fallback ke Railway
    if (process.env.NODE_ENV === "production") {
      // Fallback ke Railway URL jika backend URL tidak diset
      const productionBackendUrl = backendUrl || "https://iptv-monitor-backend-production.up.railway.app";

      // Validasi HTTPS hanya jika backendUrl diset secara manual
      if (backendUrl) {
        try {
          const url = new URL(backendUrl);
          if (url.protocol !== 'https:') {
            console.warn(`Warning: Backend URL should use HTTPS in production. Current: ${url.protocol}`);
          }
        } catch (error) {
          // Invalid URL, use fallback
          console.warn(`Warning: Invalid backend URL, using fallback Railway URL`);
        }
      }

      console.log(`[Next.js] Production backend: ${productionBackendUrl}`);

      return [
        {
          source: "/api/:path*",
          destination: `${productionBackendUrl}/api/:path*`,
        },
      ];
    }

    // Development: Gunakan backend URL atau fallback ke localhost
    const devBackendUrl = backendUrl || "http://localhost:3001";

    console.log(`[Next.js] Development backend: ${devBackendUrl}`);

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
        "https://iptv-monitor.vercel.app",
        "https://iptv-monitor-backend-production.up.railway.app",
        "https://iptv.adolin.id"
      ],
    },
  },
};

export default nextConfig;