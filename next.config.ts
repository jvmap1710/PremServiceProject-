import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16+ root-level option for server-only packages
  serverExternalPackages: ["tedious", "@prisma/client", "@prisma/adapter-mssql"],
};

export default nextConfig;
