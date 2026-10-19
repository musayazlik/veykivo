import type { NextConfig } from "next";

const apiUrl = (process.env.API_INTERNAL_URL ?? "http://localhost:5080").replace(/\/$/, "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  output: "standalone",
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Seed görselleri public/images altında; panelden yüklenenler API'nin /uploads yolundan gelir.
    localPatterns: [
      { pathname: "/images/**", search: "" },
      { pathname: "/uploads/**", search: "" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  // Tarayıcı API'ye aynı origin üzerinden erişir; böylece kimlik cookie'leri HttpOnly + SameSite=Strict kalabilir.
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` },
      { source: "/uploads/:path*", destination: `${apiUrl}/uploads/:path*` },
    ];
  },
  async redirects() {
    return [{ source: "/kurumsal", destination: "/kurumsal/hakkimizda", permanent: false }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
