/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    const toHome = [
      "/ask",
      "/prices",
      "/basket",
      "/market",
      "/map",
      "/fuel",
      "/rides",
      "/bundles",
      "/check",
      "/scan",
      "/wallet",
      "/merchant",
      "/ops",
      "/saved",
      "/alerts",
      "/invite",
    ];
    return [
      ...toHome.map((source) => ({
        source,
        destination: "/",
        permanent: false,
      })),
      {
        source: "/ask/:path*",
        destination: "/",
        permanent: false,
      },
      {
        source: "/prices/:path*",
        destination: "/search",
        permanent: false,
      },
      {
        source: "/market/:path*",
        destination: "/search",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

module.exports = nextConfig;
