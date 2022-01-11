module.exports = {
  swcMinify: true,
  // reactStrictMode: true,
  // image loader
  images: {
    loader: 'custom'
  },
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      '/': { page: '/' },
      '/dashboard': { page: '/dashboard' },
      '/exam': { page: '/exam' },
      '/exam/selesai': { page: '/exam/selesai' },
    }
  },
}
