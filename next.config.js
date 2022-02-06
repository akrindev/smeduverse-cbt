module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  // reactStrictMode: true,
  // image loader
  images: {
    loader: 'custom'
  },
  trailingSlash: true,
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      '/': { page: '/' },
      '/dashboard': { page: '/dashboard' },
      '/exam': { page: '/exam' },
      '/exam/selesai': { page: '/exam/selesai' },
      '/ujian-susulan': { page: '/ujian-susulan' },
    }
  },
  webpack: (config, { dev, isServer }) => {
    // Replace React with Preact only in client production build
    if (!dev && !isServer) {
      Object.assign(config.resolve.alias, {
        react: 'preact/compat',
        'react-dom': 'preact/compat'
      });
    }

    return config;
  }
}
