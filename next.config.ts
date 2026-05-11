import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://apis.google.com https://smarttiffin-47278.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com https://firebasestorage.googleapis.com https://*.tile.openstreetmap.org https://maps.gstatic.com https://maps.googleapis.com https://lh3.googleusercontent.com https://static.vecteezy.com; connect-src 'self' https://api.stripe.com https://fcm.googleapis.com https://*.neon.tech https://*.upstash.io wss://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://smarttiffin-47278.firebaseapp.com https://*.firebaseio.com; frame-src https://js.stripe.com https://smarttiffin-47278.firebaseapp.com https://accounts.google.com https://*.firebaseapp.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com"
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" }, // Prevent clickjacking
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],

  // TypeScript checking is now enabled during builds.
  // If Vercel OOM kills occur, run `tsc --noEmit` in CI instead.
  typescript: { ignoreBuildErrors: false },

  // Replace deprecated `domains` with `remotePatterns`
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // Add security + CORS headers to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
          {
            key: "Content-Type",
            value: "application/xml; charset=utf-8",
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            // Never use '*' with credentials — browsers reject it.
            // Fall back to localhost for local development.
            value: BASE_URL || "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

