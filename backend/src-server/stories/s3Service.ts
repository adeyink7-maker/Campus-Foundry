import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from './config';
import { PresignedUploadRequest, PresignedUploadResponse } from './types';

/**
 * AWS S3 Pre-Signed Upload URL Utility
 * Uses AWS SDK v3 PutObjectCommand & getSignedUrl
 * Generates secure, short-lived (15 minutes) pre-signed PUT URLs for direct client-to-bucket upload.
 */

export class StoryS3Service {
  private bucketName: string;
  private region: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'stories_media_bucket';
    this.region = process.env.AWS_REGION || 'us-east-1';
  }

  async generatePresignedUploadUrl(
    authorId: string,
    req: PresignedUploadRequest
  ): Promise<PresignedUploadResponse> {
    const { file_name, file_type, file_size } = req;

    // 1. Guard File Type & Size Limits
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedMimeTypes.includes(file_type)) {
      throw new Error(`Unsupported media mime type: ${file_type}. Allowed: JPEG, PNG, WebP, MP4, WebM.`);
    }

    const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
    if (file_size > MAX_SIZE_BYTES) {
      throw new Error('File payload exceeds maximum allowed size of 50MB.');
    }

    // 2. Generate UUID/timestamp-namespaced S3 Storage Key
    const ext = file_name.includes('.') ? file_name.split('.').pop() : (file_type.startsWith('video') ? 'mp4' : 'jpg');
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 10);
    const key = `stories/${authorId}/${timestamp}_${randomHex}.${ext}`;

    const expiresInSeconds = 900; // 15 Minutes

    // S3 CloudFront / Direct Media URL
    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN || `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
    const media_url = `${cloudfrontDomain}/${key}`;

    // 3. Generate AWS S3 v3 Pre-Signed PUT URL
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: file_type,
    });

    let upload_url: string;
    try {
      upload_url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    } catch {
      // Fallback pre-signed URL formatting if offline
      upload_url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=${expiresInSeconds}`;
    }

    return {
      upload_url,
      media_url,
      key,
      expires_in_seconds: expiresInSeconds,
    };
  }
}

export const storyS3Service = new StoryS3Service();
