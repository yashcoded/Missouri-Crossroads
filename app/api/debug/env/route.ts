import { NextResponse } from 'next/server';

export async function GET() {
  // Check which environment variables are available
  const envCheck = {
    hasAWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
    hasAMPLIFY_AWS_ACCESS_KEY_ID: !!process.env.AMPLIFY_AWS_ACCESS_KEY_ID,
    hasAWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
    hasAMPLIFY_AWS_SECRET_ACCESS_KEY: !!process.env.AMPLIFY_AWS_SECRET_ACCESS_KEY,
    hasS3_BUCKET_NAME: !!process.env.S3_BUCKET_NAME,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    
    // Show lengths (not values) for debugging
    accessKeyLength: (process.env.AWS_ACCESS_KEY_ID || process.env.AMPLIFY_AWS_ACCESS_KEY_ID || '').length,
    secretKeyLength: (process.env.AWS_SECRET_ACCESS_KEY || process.env.AMPLIFY_AWS_SECRET_ACCESS_KEY || '').length,
  };

  return NextResponse.json(envCheck);
}

