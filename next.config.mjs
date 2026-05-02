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
      // Vercel Blob CDN — used by admin photo uploader (Phase 22+).
      // Uploaded photos are stored at https://*.public.blob.vercel-storage.com/...
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
}

export default nextConfig
