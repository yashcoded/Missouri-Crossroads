import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// IMPORTANT: AWS credentials are server-side only and should NEVER use NEXT_PUBLIC_ prefix
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = 'mr-crossroads-bucket';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check if it's a CSV file
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are allowed' }, { status: 400 });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `metadata/metadata-${timestamp}.csv`;
    
    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    
    // Upload to S3 with public read access
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: Buffer.from(buffer),
      ContentType: 'text/csv',
      ACL: 'public-read', // Make it publicly readable
      Metadata: {
        'original-filename': file.name,
        'uploaded-at': new Date().toISOString(),
        'content-type': 'metadata'
      }
    });

    await s3Client.send(uploadCommand);

    // Generate the public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2'}.amazonaws.com/${filename}`;

    return NextResponse.json({
      message: 'CSV uploaded successfully',
      filename: filename,
      publicUrl: publicUrl,
      size: file.size,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Generate presigned URL for direct upload (alternative approach)
export async function GET() {
  try {
    const filename = `metadata/metadata-${Date.now()}.csv`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      ContentType: 'text/csv',
      ACL: 'public-read',
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    return NextResponse.json({
      uploadUrl: presignedUrl,
      filename: filename,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
