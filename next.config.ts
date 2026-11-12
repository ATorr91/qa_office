import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // The process is now the home of the site; its old address and anchors lead to the matching page.
  async redirects() {
    return [
      { source: "/evaluacion", destination: "/dashboard-estrategas/cerebro", permanent: false },
      { source: "/proceso-estrategas", destination: "/", permanent: false },
      { source: "/proceso-estrategas/:path*", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
