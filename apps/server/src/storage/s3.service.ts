import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  type GetObjectCommandOutput,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type PutPresignParams = {
  key: string;
  expiresInSeconds?: number;
};

type GetPresignParams = {
  key: string;
  expiresInSeconds?: number;
};

type PutObjectParams = {
  key: string;
  body: Buffer;
  contentType: string;
};

type CopyObjectParams = {
  sourceKey: string;
  destinationKey: string;
};

@Injectable()
export class S3Service {
  private readonly bucket: string;
  private readonly region: string;
  private readonly tempPrefix: string;
  private readonly publicBaseUrl: string | null;
  private readonly client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>("S3_BUCKET") ?? "";
    this.region = this.configService.get<string>("S3_REGION") ?? "";
    this.publicBaseUrl = this.configService.get<string>("S3_PUBLIC_BASE_URL") ?? null;
    this.tempPrefix = this.normalizePrefix(this.configService.get<string>("S3_TEMP_PREFIX") ?? "temp/");

    const endpoint = this.configService.get<string>("S3_ENDPOINT");
    const forcePathStyle = (this.configService.get<string>("S3_FORCE_PATH_STYLE") ?? "false").toLowerCase() === "true";

    if (!this.bucket) {
      throw new Error("S3_BUCKET is required");
    }
    if (!this.region && !endpoint) {
      throw new Error("S3_REGION is required (or set S3_ENDPOINT for S3-compatible storage)");
    }

    const clientConfig: S3ClientConfig = {
      region: this.region || "auto",
    };

    if (endpoint) {
      clientConfig.endpoint = endpoint;
      clientConfig.forcePathStyle = forcePathStyle;
    }

    this.client = new S3Client(clientConfig);
  }

  getTempPrefix(): string {
    return this.tempPrefix;
  }

  getBucket(): string {
    return this.bucket;
  }

  isTempKey(key: string): boolean {
    return key.startsWith(this.tempPrefix);
  }

  async createPutPresignedUrl({ key, expiresInSeconds = 300 }: PutPresignParams): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async createGetPresignedUrl({ key, expiresInSeconds = 300 }: GetPresignParams): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  private async readBodyToBuffer(body: GetObjectCommandOutput["Body"]): Promise<Buffer> {
    if (!body) return Buffer.alloc(0);
    if (Buffer.isBuffer(body)) return body;

    const chunks: Buffer[] = [];
    // In Node.js, AWS SDK v3 returns a Readable stream.
    for await (const chunk of body as unknown as AsyncIterable<Buffer | Uint8Array | string>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async getObjectPrefixBytes(key: string, byteCount: number): Promise<Buffer> {
    const count = Math.max(0, Math.min(byteCount, 1024));
    if (count === 0) return Buffer.alloc(0);

    const res = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Range: `bytes=0-${count - 1}`,
      }),
    );

    return this.readBodyToBuffer(res.Body);
  }

  async putObject({ key, body, contentType }: PutObjectParams): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async deleteObjects(keys: string[]): Promise<void> {
    const uniqueKeys = Array.from(new Set(keys.map((k) => k.trim()).filter(Boolean)));
    if (uniqueKeys.length === 0) return;

    const res = await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: uniqueKeys.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );

    const errors = res.Errors?.filter((e) => e.Key || e.Code || e.Message) ?? [];
    if (errors.length > 0) {
      const first = errors[0];
      throw new Error(
        `Failed to delete S3 objects (count=${errors.length}) key=${first.Key ?? ""} code=${first.Code ?? ""}`,
      );
    }
  }

  async copyObject({ sourceKey, destinationKey }: CopyObjectParams): Promise<void> {
    const src = sourceKey.trim();
    const dst = destinationKey.trim();
    if (!src || !dst) {
      throw new Error("copyObject requires sourceKey and destinationKey");
    }
    if (src === dst) return;

    const copySourceKey = encodeURIComponent(src).replace(/%2F/g, "/");
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        Key: dst,
        CopySource: `${this.bucket}/${copySourceKey}`,
        MetadataDirective: "COPY",
      }),
    );
  }

  getPublicUrl(key: string): string {
    if (this.publicBaseUrl) {
      const trimmed = this.publicBaseUrl.replace(/\/+$/, "");
      return `${trimmed}/${key}`;
    }

    if (!this.region) {
      throw new Error("S3_PUBLIC_BASE_URL is required when S3_REGION is not set");
    }

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private normalizePrefix(prefix: string): string {
    const trimmed = prefix.trim();
    if (!trimmed) return "";
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  }
}
