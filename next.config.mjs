/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // YouTube thumbnail CDN — used by PlaylistCard for playlist cover images.
      // Pattern: https://img.youtube.com/vi/{videoId}/hqdefault.jpg
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
    ],
  },
}

export default nextConfig
