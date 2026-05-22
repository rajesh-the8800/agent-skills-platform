import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private client: S3Client | null = null;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    const region = this.config.get<string>('AWS_REGION') ?? 'us-east-1';
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    if (accessKeyId && secretAccessKey) {
      this.client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    }
  }

  private requireClient(): { client: S3Client; bucket: string } {
    const bucket = this.config.get<string>('AWS_S3_BUCKET');
    if (!bucket || !this.client) {
      throw new ServiceUnavailableException(
        'Object storage is not configured (set AWS_S3_BUCKET and AWS credentials).',
      );
    }
    return { client: this.client, bucket };
  }

  async getSignedDownloadUrl(key: string, expiresSeconds = 300): Promise<string> {
    const { client, bucket } = this.requireClient();
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(client, cmd, { expiresIn: expiresSeconds });
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresSeconds = 900,
  ): Promise<string> {
    const { client, bucket } = this.requireClient();
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(client, cmd, { expiresIn: expiresSeconds });
  }

  async headObject(key: string): Promise<{ contentLength: number | undefined }> {
    const { client, bucket } = this.requireClient();
    const out = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { contentLength: out.ContentLength };
  }
}
