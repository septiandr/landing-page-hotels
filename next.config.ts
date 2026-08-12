import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Gambar placeholder seed (Unsplash) + CDN hotel nanti.
    // Catatan: `images.domains` deprecated di Next 16 — pakai remotePatterns.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
