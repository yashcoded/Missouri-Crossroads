import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2';
const BUCKET = 'mr-crossroads-bucket';

// IMPORTANT: Use server-only credentials. NEVER use NEXT_PUBLIC_ prefix for AWS credentials
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AMPLIFY_AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AMPLIFY_AWS_SECRET_ACCESS_KEY;

const s3 = new S3Client({
	region: REGION,
	credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
});

export async function POST(req: NextRequest) {
	try {
		const { folder = 'media', fileName, contentType } = await req.json();
		if (!fileName || !contentType) {
			return NextResponse.json({ error: 'fileName and contentType are required' }, { status: 400 });
		}

		const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName}`;
		const command = new PutObjectCommand({
			Bucket: BUCKET,
			Key: key,
			ContentType: contentType,
		});

		const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }); // 5 minutes
		const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

		return NextResponse.json({ url, key, publicUrl });
	} catch (err: any) {
		return NextResponse.json({ error: err?.message || 'Failed to create presigned URL' }, { status: 500 });
	}
}
