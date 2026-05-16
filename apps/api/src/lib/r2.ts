import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const r2 = {
  async uploadBuffer(key: string, buffer: Buffer, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    await s3Client.send(command);
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  },

  async deleteObject(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
  },

  async getPresignedUrl(key: string, expiresInSeconds: number = 3600) {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  },

  async checkHealth() {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: process.env.R2_BUCKET_NAME }));
      return 'ok';
    } catch (e) {
      return 'error';
    }
  }
};
