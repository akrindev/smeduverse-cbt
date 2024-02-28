import million from "million/compiler";
import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  swcMinify: true,
  reactStrictMode: true,
  // image loader
  images: {
    loader: "custom",
  },
  trailingSlash: true,
  exportPathMap: async (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) => ({
    "/": { page: "/" },
    "/dashboard": { page: "/dashboard" },
    "/exam": { page: "/exam" },
    "/exam/selesai": { page: "/exam/selesai" },
    "/ujian-susulan": { page: "/ujian-susulan" },
  }),
});

export default million.next(nextConfig, {
  auto: {
    threshold: 0.05, // default: 0.1,
    skip: ["useBadHook", /badVariable/g], // default [],

    // if you're using RSC: auto: { rsc: true },
  },
  rsc: true,
});
