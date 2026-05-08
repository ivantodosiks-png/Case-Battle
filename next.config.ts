import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Supabase Storage public URLs typically look like:
      // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
      { protocol: "https", hostname: "**.supabase.co", pathname: "/**" },
      // Some Supabase regions use supabase.in
      { protocol: "https", hostname: "**.supabase.in", pathname: "/**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
