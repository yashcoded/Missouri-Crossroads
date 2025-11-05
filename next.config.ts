import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable standalone output for Docker
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  
  // Explicitly pass server-side environment variables
  // This is needed for AWS Amplify to inject them into API routes
  env: {
    AMPLIFY_AWS_ACCESS_KEY_ID: process.env.AMPLIFY_AWS_ACCESS_KEY_ID,
    AMPLIFY_AWS_SECRET_ACCESS_KEY: process.env.AMPLIFY_AWS_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET,
  },
  
  // Suppress ESLint warnings during builds
  eslint: {
    ignoreDuringBuilds: false, // Keep ESLint enabled but warnings are suppressed via .eslintrc.json
  },
  typescript: {
    ignoreBuildErrors: false, // Keep TypeScript checks enabled
  },
};

export default nextConfig;
