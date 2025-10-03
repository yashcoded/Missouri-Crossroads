import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/aws';

const BUCKET_NAME = 'mr-crossroads-bucket';
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  key?: string;
}

async function getPresignedPutUrl(file: File, folder: string) {
  const res = await fetch('/api/s3/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      folder,
      fileName: file.name,
      contentType: file.type,
    }),
  });
  if (!res.ok) throw new Error('Failed to get presigned URL');
  return res.json() as Promise<{ url: string; key: string; publicUrl: string }>;
}

export async function uploadFileToS3(
  file: File,
  folder: string = 'media'
): Promise<UploadResult> {
  try {
    const { url, key, publicUrl } = await getPresignedPutUrl(file, folder);

    const put = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!put.ok) throw new Error('Upload failed');

    return { success: true, url: publicUrl, key };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

export async function uploadImage(file: File, convertHeic: boolean = true): Promise<UploadResult> {
  if (convertHeic && file.type === 'image/heic') {
    console.log('HEIC file detected, consider converting to JPG');
  }
  return uploadFileToS3(file, 'images');
}

export async function uploadVideo(file: File): Promise<UploadResult> {
  return uploadFileToS3(file, 'videos');
}

export async function uploadAudio(file: File): Promise<UploadResult> {
  return uploadFileToS3(file, 'audio');
}

export async function deleteFileFromS3(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    return false;
  }
} 