import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";

import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGES_PER_USER,
  type RestaurantImage,
  RestaurantImageEventType,
  type RestaurantImageFeedResponse,
  type RestaurantImageResponse,
  type RestaurantThumbnailUpdatedPayload,
} from "@shared/types";
import { randomUUID } from "crypto";
import { DataSource, Repository } from "typeorm";

import { S3Service } from "../storage/s3.service";
import { UserManager } from "../user/user-manager.service";
import { RestaurantImageEntity } from "./restaurant-image.entity";

const ALLOWED_MIME_TYPES = new Set(ALLOWED_IMAGE_MIME_TYPES);

@Injectable()
export class RestaurantService {
  private readonly logger = new Logger(RestaurantService.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly userManager: UserManager,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,

    @InjectRepository(RestaurantImageEntity)
    private readonly restaurantImageRepository: Repository<RestaurantImageEntity>,
  ) {}

  private normalizeContentType(contentType: string): string {
    return (contentType ?? "").split(";")[0].trim().toLowerCase();
  }

  validateContentType(contentType: string): void {
    const normalized = this.normalizeContentType(contentType);
    if (!ALLOWED_MIME_TYPES.has(normalized)) {
      throw new BadRequestException(
        `Invalid content type: ${contentType}. Allowed: ${[...ALLOWED_MIME_TYPES].join(", ")}`,
      );
    }
  }

  private validateImageMagicBytes(buffer: Buffer, contentType: string): void {
    const ct = this.normalizeContentType(contentType);
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException("Invalid image: empty file");
    }

    if (ct === "image/png") {
      const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      const ok = buffer.length >= pngSig.length && pngSig.every((b, i) => buffer[i] === b);
      if (!ok) throw new BadRequestException("Invalid PNG file signature");
      return;
    }

    if (ct === "image/jpeg") {
      const ok = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      if (!ok) throw new BadRequestException("Invalid JPEG file signature");
      return;
    }

    if (ct === "image/webp") {
      // WebP: RIFF....WEBP (bytes 0-3: "RIFF", bytes 8-11: "WEBP")
      const ok =
        buffer.length >= 12 &&
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50;
      if (!ok) throw new BadRequestException("Invalid WebP file signature");
      return;
    }

    throw new BadRequestException(`Invalid content type: ${contentType}`);
  }

  private extractExtensionFromKey(key: string): "jpg" | "png" | "webp" | null {
    const ext = key.split(".").pop()?.toLowerCase();
    if (ext === "jpg") return "jpg";
    if (ext === "png") return "png";
    if (ext === "webp") return "webp";
    return null;
  }

  private async validateTempObjectSignature(key: string, finalKey: string): Promise<void> {
    const ext = this.extractExtensionFromKey(finalKey);
    if (!ext) {
      throw new BadRequestException("Invalid key extension (allowed: .jpg, .png, .webp)");
    }

    const prefix = await this.s3Service.getObjectPrefixBytes(key, 16);
    const contentTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    };
    this.validateImageMagicBytes(prefix, contentTypeMap[ext]);
  }

  private validateKeyOwnership(userId: string, key: string): void {
    const expectedPrefix = `restaurant-images/${userId}/`;
    const keyWithoutTemp = this.s3Service.isTempKey(key) ? key.slice(this.s3Service.getTempPrefix().length) : key;

    if (!keyWithoutTemp.startsWith(expectedPrefix)) {
      throw new BadRequestException("Unauthorized: key does not belong to this user");
    }
  }

  private mapEntityToImage(entity: RestaurantImageEntity, requestUserId: string): RestaurantImage {
    const likedBy = Array.isArray(entity.likedBy) ? entity.likedBy : [];
    return {
      id: String(entity.id),
      url: this.resolveKeyForView(entity.key),
      userId: entity.userId,
      nickname: entity.nickname,
      likes: entity.likes,
      likedByMe: likedBy.includes(requestUserId),
      createdAt: entity.createdAt.toISOString(),
    };
  }

  async getImagesByUserId(requestUserId: string, targetUserId: string): Promise<RestaurantImageResponse> {
    const userImages = await this.restaurantImageRepository.find({
      where: { userId: targetUserId },
      order: { createdAt: "DESC" },
    });

    const images = userImages.map((img) => this.mapEntityToImage(img, requestUserId));

    return {
      latestImage: images[0] ?? null,
      images,
    };
  }

  async getRecentImages(requestUserId: string, limit = 50): Promise<RestaurantImageFeedResponse> {
    const rows = await this.restaurantImageRepository.find({
      order: { createdAt: "DESC" },
      take: limit,
    });

    const images = rows.map((img) => this.mapEntityToImage(img, requestUserId));

    return { images };
  }

  async toggleImageLike(userId: string, imageId: number): Promise<{ likes: number; liked: boolean }> {
    const result = await this.dataSource.transaction(async (manager) => {
      const imageRepository = manager.getRepository(RestaurantImageEntity);

      const image = await imageRepository.findOne({
        where: { id: imageId },
        select: { id: true, likes: true, likedBy: true },
      });

      if (!image) {
        throw new BadRequestException("Image not found");
      }

      const likedBy = Array.isArray(image.likedBy) ? image.likedBy.filter(Boolean) : [];
      const alreadyLiked = likedBy.includes(userId);
      const newLikedBy = alreadyLiked ? likedBy.filter((id) => id !== userId) : [...likedBy, userId];
      const newLikes = newLikedBy.length;

      await imageRepository.update({ id: imageId }, { likes: newLikes, likedBy: newLikedBy });

      return { likes: newLikes, liked: !alreadyLiked };
    });

    this.eventEmitter.emit(RestaurantImageEventType.IMAGE_LIKE_UPDATED, {
      imageId: String(imageId),
      likes: result.likes,
    });
    return result;
  }

  async getLatestThumbnailUrlByUserId(userId: string): Promise<string | null> {
    const row = await this.restaurantImageRepository.findOne({
      where: { userId },
      order: { createdAt: "DESC" },
      select: { key: true },
    });
    if (!row?.key) return null;
    return this.resolveKeyForView(row.key);
  }

  private async emitThumbnailUpdated(userId: string): Promise<void> {
    const thumbnailUrl = await this.getLatestThumbnailUrlByUserId(userId);
    const payload: RestaurantThumbnailUpdatedPayload = { userId, thumbnailUrl };
    this.eventEmitter.emit(RestaurantImageEventType.THUMBNAIL_UPDATED, payload);
  }

  async saveImage(userId: string, key: string): Promise<void> {
    const user = this.userManager.getSession(userId);
    const nickname = user?.nickname ?? "";

    await this.restaurantImageRepository.save({
      userId,
      key,
      nickname,
      likes: 0,
      likedBy: [],
    });
  }

  async createTempImagePresign(userId: string, contentType: string, _originalName?: string) {
    this.validateContentType(contentType);

    await this.checkImageLimit(userId);

    const key = this.buildTempKey(userId, contentType);

    const uploadUrl = await this.s3Service.createPutPresignedUrl({
      key,
    });

    const viewUrl = this.s3Service.getPublicUrl(key);
    return { key, uploadUrl, imageUrl: viewUrl, viewUrl };
  }

  private async checkImageLimit(userId: string): Promise<void> {
    const count = await this.restaurantImageRepository.count({ where: { userId } });
    if (count >= MAX_IMAGES_PER_USER) {
      throw new BadRequestException(`Maximum image limit (${MAX_IMAGES_PER_USER}) reached`);
    }
  }

  async confirmTempImage(userId: string, key: string): Promise<string> {
    const tempPrefix = this.s3Service.getTempPrefix();
    const hasTempPrefix = tempPrefix.length > 0 && key.startsWith(tempPrefix);

    if (tempPrefix.length > 0 && !hasTempPrefix) {
      throw new BadRequestException("Only temp/ keys are allowed");
    }

    this.validateKeyOwnership(userId, key);
    await this.checkImageLimit(userId);

    const finalKey = hasTempPrefix ? key.slice(tempPrefix.length) : key;

    await this.validateTempObjectSignature(key, finalKey);

    if (hasTempPrefix) {
      await this.s3Service.copyObject({ sourceKey: key, destinationKey: finalKey });
    }

    try {
      await this.saveImage(userId, finalKey);
    } catch (error) {
      if (hasTempPrefix) {
        this.s3Service.deleteObjects([finalKey]).catch((e) => {
          this.logger.warn(`Failed to cleanup orphan file after DB save failure: ${finalKey}`, e);
        });
      }
      throw error;
    }

    this.emitThumbnailUpdated(userId).catch((e) =>
      this.logger.warn(`Failed to emit thumbnail update for ${userId}`, e),
    );

    if (hasTempPrefix) {
      this.s3Service.deleteObjects([key]).catch((e) => {
        this.logger.warn(`Failed to delete temp file: ${key}`, e);
      });
    }

    return this.resolveKeyForView(finalKey);
  }

  async uploadTempImageFromFile(userId: string, file: Express.Multer.File): Promise<string> {
    const contentType = this.normalizeContentType(file.mimetype);
    this.validateContentType(contentType);
    this.validateImageMagicBytes(file.buffer, contentType);
    await this.checkImageLimit(userId);

    const key = this.buildFinalKey(userId, contentType);

    await this.s3Service.putObject({
      key,
      body: file.buffer,
      contentType,
      cacheControl: "public, max-age=604800",
    });

    try {
      await this.saveImage(userId, key);
    } catch (error) {
      this.s3Service.deleteObjects([key]).catch((e) => {
        this.logger.warn(`Failed to cleanup orphan file after DB save failure: ${key}`, e);
      });
      throw error;
    }

    this.emitThumbnailUpdated(userId).catch((e) =>
      this.logger.warn(`Failed to emit thumbnail update for ${userId}`, e),
    );

    return this.resolveKeyForView(key);
  }

  async deleteImageByUrl(userId: string, imageUrl: string): Promise<void> {
    const key = this.extractKeyFromUrl(imageUrl);
    if (!key) {
      throw new BadRequestException("Invalid imageUrl");
    }

    this.validateKeyOwnership(userId, key);

    if (this.s3Service.isTempKey(key)) {
      try {
        await this.s3Service.deleteObjects([key]);
      } catch (e) {
        this.logger.warn(`Failed to delete temp S3 object: ${key}`, e);
        throw new InternalServerErrorException("Failed to delete image");
      }
      return;
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(RestaurantImageEntity);

        const row = await repo.findOne({
          where: { userId, key },
          select: { id: true, key: true },
        });

        if (row) {
          await repo.delete({ id: row.id });
        }
      });
    } catch (e) {
      this.logger.warn(`Failed to delete image from DB: key=${key}`, e);
      throw new InternalServerErrorException("Failed to delete image");
    }

    this.s3Service.deleteObjects([key]).catch((e) => {
      this.logger.warn(`Failed to delete S3 object after DB deletion: ${key}`, e);
    });

    this.emitThumbnailUpdated(userId).catch((e) =>
      this.logger.warn(`Failed to emit thumbnail update for ${userId}`, e),
    );
  }

  async replaceImageByUrl(userId: string, imageUrl: string, newImageUrl: string): Promise<string> {
    const oldKey = this.extractKeyFromUrl(imageUrl);
    const newKey = this.extractKeyFromUrl(newImageUrl);

    if (!oldKey || !newKey) {
      throw new BadRequestException("Invalid imageUrl");
    }

    this.validateKeyOwnership(userId, oldKey);
    this.validateKeyOwnership(userId, newKey);

    if (oldKey === newKey) {
      return this.resolveKeyForView(newKey);
    }

    const row = await this.restaurantImageRepository.findOne({
      where: { userId, key: oldKey },
      select: { id: true, key: true },
    });

    if (!row) {
      throw new BadRequestException("Image not found");
    }

    const finalKey = this.s3Service.isTempKey(newKey) ? newKey.slice(this.s3Service.getTempPrefix().length) : newKey;

    if (this.s3Service.isTempKey(newKey)) {
      await this.validateTempObjectSignature(newKey, finalKey);
    }

    await this.dataSource.transaction(async (manager) => {
      if (this.s3Service.isTempKey(newKey)) {
        await this.s3Service.copyObject({ sourceKey: newKey, destinationKey: finalKey });
      }

      await manager.update(RestaurantImageEntity, { id: row.id }, { key: finalKey });
    });

    const keysToDelete = [row.key];
    if (this.s3Service.isTempKey(newKey)) {
      keysToDelete.push(newKey);
    }

    this.s3Service.deleteObjects(keysToDelete).catch((e) => {
      this.logger.warn(`Failed to cleanup old files during replace: ${keysToDelete.join(", ")}`, e);
    });

    this.emitThumbnailUpdated(userId).catch((e) =>
      this.logger.warn(`Failed to emit thumbnail update for ${userId}`, e),
    );

    return this.resolveKeyForView(finalKey);
  }

  private buildTempKey(userId: string, contentType: string): string {
    const prefix = this.s3Service.getTempPrefix();
    const finalKey = this.buildFinalKey(userId, contentType);
    return `${prefix}${finalKey}`;
  }

  private buildFinalKey(userId: string, contentType: string): string {
    const ext = this.pickExtension(contentType);
    const id = randomUUID();
    return `restaurant-images/${userId}/${id}.${ext}`;
  }

  private pickExtension(contentType: string): string {
    const byMime: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const fromMime = byMime[this.normalizeContentType(contentType)];
    if (fromMime) return fromMime;

    throw new BadRequestException(`Invalid content type: ${contentType}`);
  }

  private resolveKeyForView(key: string): string {
    return this.s3Service.getPublicUrl(key);
  }

  private extractKeyFromUrl(imageUrl: string): string | null {
    const trimmed = imageUrl.trim();
    if (!trimmed) return null;

    const cleanupKey = (k: string): string => {
      const noQuery = k.split(/[?#]/)[0] ?? "";
      const noLeadingSlash = noQuery.replace(/^\/+/, "");
      const bucketPrefix = `${this.s3Service.getBucket()}/`;
      const withoutBucket = noLeadingSlash.startsWith(bucketPrefix)
        ? noLeadingSlash.slice(bucketPrefix.length)
        : noLeadingSlash;
      return withoutBucket.trim();
    };

    try {
      const url = new URL(trimmed);
      const path = url.pathname.replace(/^\/+/, "");
      return cleanupKey(path);
    } catch {
      return cleanupKey(trimmed);
    }
  }
}
