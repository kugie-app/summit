import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

// Minio client configuration
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const bucketName = process.env.MINIO_BUCKET_NAME || 'summit';

// Check if bucket exists, create if it doesn't
export async function ensureBucketExists(): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

// Upload a file to Minio
export async function uploadFile(
  file: Buffer | Readable,
  originalName: string,
  contentType: string,
  companyId: number,
  folder: string = "receipts"
): Promise<string> {
  await ensureBucketExists();

  const fileExt = originalName.split('.').pop() || '';
  const uniqueId = uuidv4();
  const fileName = `${companyId}/${folder}/${uniqueId}.${fileExt}`;

  const metaData = {
    'Content-Type': contentType,
    'X-Original-Name': encodeURIComponent(originalName),
  };

  // Using any to bypass the type issue as the Minio types might be incorrect
  await minioClient.putObject(bucketName, fileName, file, undefined, metaData as any);
  
  return fileName;
}

// Get a file from Minio
export async function getFile(fileName: string): Promise<Minio.BucketStream<Minio.ItemBucketMetadata>> {
  try {
    return await minioClient.getObject(bucketName, fileName);
  } catch (error) {
    console.error('Error getting file from Minio:', error);
    throw error;
  }
}

// Delete a file from Minio
export async function deleteFile(fileName: string): Promise<void> {
  try {
    await minioClient.removeObject(bucketName, fileName);
  } catch (error) {
    console.error('Error deleting file from Minio:', error);
    throw error;
  }
}

// Generate a presigned URL for file download
export async function getPresignedUrl(fileName: string, expires = 60 * 60): Promise<string> {
  try {
    return await minioClient.presignedGetObject(bucketName, fileName, expires);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

// Get a file URL
export function getFileUrl(fileName: string): string {
  // Return just the file path, not the full URL
  // This change prevents direct access attempts and forces using presigned URLs
  return fileName;
} 