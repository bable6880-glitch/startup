import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["firebase-admin"],
   domains: ['res.cloudinary.com']
};

export default nextConfig;
