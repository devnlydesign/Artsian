import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    allowedDevOrigins: [
      '9000-firebase-studio-1747577910974.cluster-oayqgyglpfgseqclbygurw4xd4.cloudworkstations.dev',
      '6000-firebase-studio-1747577910974.cluster-oayqgyglpfgseqclbygurw4xd4.cloudworkstations.dev',
    ],
  },
};

export default nextConfig;
