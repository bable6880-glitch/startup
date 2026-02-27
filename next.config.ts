import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["firebase-admin"],
  images: {
    domains: ['res.cloudinary.com'],  // ✅ must be INSIDE images: {}
  },
};

export default nextConfig;
