/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/remote-control',
        destination: '/remote-control.html',
      },
    ];
  },
};

export default nextConfig;
