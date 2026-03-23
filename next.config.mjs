import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Deploy Gate: Explicit production deployment + DEMO_MODE=true → hard fail
// Only triggers when DEPLOY_TARGET=production is explicitly set (opt-in)
// Vercel showcase/demo deploys are allowed with DEMO_MODE=true
const isProductionDeploy = process.env.DEPLOY_TARGET === "production";

if (isProductionDeploy && process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
  throw new Error(
    "CRITICAL: Cannot deploy with DEMO_MODE=true to production! Set NEXT_PUBLIC_DEMO_MODE=false before deploying."
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/favoriler",
        destination: "/hesabim/favorilerim",
        permanent: true,
      },
    ];
  },
  images: {
    // Remote product images are served directly to avoid Vercel optimizer 402 fallbacks.
    unoptimized: true,
    remotePatterns: [
      // Tüm HTTPS kaynaklarından ürün fotoğraflarına izin ver
      // Ürünler 33+ farklı domain'den fotoğraf içeriyor
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/webp", "image/avif"],
  },
};

export default withBundleAnalyzer(nextConfig);
