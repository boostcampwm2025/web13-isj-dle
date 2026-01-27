import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  type GetObjectCommandOutput,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { MetricsService } from "../metrics";
import type { CopyObjectParams, GetPresignParams, PutObjectParams, PutPresignParams } from "./storage.types";

@Injectable()
export class S3Service {
  private readonly bucket: string;
  private readonly region: string;
  private readonly tempPrefix: string;
  private readonly publicBaseUrl: string | null;
  private readonly client: S3Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
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
    return this.tempPrefix.length > 0 && key.startsWith(this.tempPrefix);
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
    for await (const chunk of body as unknown as AsyncIterable<Buffer | Uint8Array | string>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async getObjectPrefixBytes(key: string, byteCount: number): Promise<Buffer> {
    const count = Math.max(0, Math.min(byteCount, 1024));
    if (count === 0) return Buffer.alloc(0);

    const startTime = performance.now();
    const getDurationSec = () => (performance.now() - startTime) / 1000;
    let hasError = false;

    try {
      const res = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Range: `bytes=0-${count - 1}`,
        }),
      );
      return this.readBodyToBuffer(res.Body);
    } catch (error) {
      hasError = true;
      throw error;
    } finally {
      this.metricsService.recordS3Request("getObject", hasError ? "error" : "success", getDurationSec());
    }
  }

  async putObject({ key, body, contentType }: PutObjectParams): Promise<void> {
    const startTime = performance.now();
    const getDurationSec = () => (performance.now() - startTime) / 1000;
    let hasError = false;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );

      if (Buffer.isBuffer(body)) {
        this.metricsService.recordS3Upload(body.length);
      }
    } catch (error) {
      hasError = true;
      throw error;
    } finally {
      this.metricsService.recordS3Request("putObject", hasError ? "error" : "success", getDurationSec());
    }
  }

  async deleteObjects(keys: string[]): Promise<void> {
    const uniqueKeys = Array.from(new Set(keys.map((k) => k.trim()).filter(Boolean)));
    if (uniqueKeys.length === 0) return;

    const startTime = performance.now();
    const getDurationSec = () => (performance.now() - startTime) / 1000;
    let hasError = false;

    try {
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
        hasError = true;
        const first = errors[0];
        throw new Error(
          `Failed to delete S3 objects (count=${errors.length}) key=${first.Key ?? ""} code=${first.Code ?? ""}`,
        );
      }
    } catch (error) {
      hasError = true;
      throw error;
    } finally {
      this.metricsService.recordS3Request("deleteObjects", hasError ? "error" : "success", getDurationSec());
    }
  }

  async copyObject({ sourceKey, destinationKey }: CopyObjectParams): Promise<void> {
    const src = sourceKey.trim();
    const dst = destinationKey.trim();
    if (!src || !dst) throw new Error("copyObject requires sourceKey and destinationKey");
    if (src === dst) return;

    const startTime = performance.now();
    const getDurationSec = () => (performance.now() - startTime) / 1000;
    let hasError = false;

    try {
      const copySourceKey = encodeURIComponent(src).replace(/%2F/g, "/");
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          Key: dst,
          CopySource: `${this.bucket}/${copySourceKey}`,
          MetadataDirective: "COPY",
        }),
      );
    } catch (error) {
      hasError = true;
      throw error;
    } finally {
      this.metricsService.recordS3Request("copyObject", hasError ? "error" : "success", getDurationSec());
    }
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

  async objectExists(key: string): Promise<boolean> {
    const startTime = performance.now();
    const getDurationSec = () => (performance.now() - startTime) / 1000;

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.metricsService.recordS3Request("headObject", "success", getDurationSec());
      return true;
    } catch (e) {
      const err = e as { name?: string };

      if (err.name === "NotFound" || err.name === "NoSuchKey") {
        this.metricsService.recordS3Request("headObject", "success", getDurationSec());
        return false;
      }

      this.metricsService.recordS3Request("headObject", "error", getDurationSec());
      throw e;
    }
  }

  private normalizePrefix(prefix: string): string {
    const trimmed = prefix.trim();
    if (!trimmed) return "";
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  }
}
