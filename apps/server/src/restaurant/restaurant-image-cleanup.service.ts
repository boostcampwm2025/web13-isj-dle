import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";

import { RestaurantImageEventType } from "@shared/types";
import { In, Repository } from "typeorm";

import { S3Service } from "../storage/s3.service";
import { RestaurantImageEntity } from "./restaurant-image.entity";

const CLEANUP_BATCH_SIZE = 100;
const S3_LIST_BATCH_SIZE = 500;
const RESTAURANT_IMAGES_PREFIX = "restaurant-images/";

const getTodayMidnightKST = (): Date => {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  kstNow.setUTCHours(0, 0, 0, 0);
  return new Date(kstNow.getTime() - kstOffset);
};

@Injectable()
export class RestaurantImageCleanupService {
  private readonly logger = new Logger(RestaurantImageCleanupService.name);

  constructor(
    private readonly s3Service: S3Service,
    @InjectRepository(RestaurantImageEntity)
    private readonly restaurantImageRepository: Repository<RestaurantImageEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron("0 0 0 * * *", { timeZone: "Asia/Seoul" })
  async cleanupMidnight(): Promise<void> {
    await this.cleanupExpiredImages();
    await this.cleanupOrphanRecords();
    await this.cleanupOrphanS3Files();
  }

  private async cleanupExpiredImages(cutoff?: Date): Promise<void> {
    cutoff = cutoff ?? getTodayMidnightKST();
    const affectedUserIds = new Set<number>();
    let lastId = 0;

    while (true) {
      const rows = await this.restaurantImageRepository
        .createQueryBuilder("img")
        .select(["img.id", "img.key", "img.userId"])
        .where("img.id > :lastId", { lastId })
        .andWhere("img.createdAt < :cutoff", { cutoff })
        .orderBy("img.id", "ASC")
        .limit(CLEANUP_BATCH_SIZE)
        .getMany();

      if (rows.length === 0) break;

      lastId = rows.at(-1)!.id;
      const keys = rows.map((r) => r.key);
      const ids = rows.map((r) => r.id);
      rows.forEach((r) => affectedUserIds.add(r.userId));

      try {
        await this.s3Service.deleteObjects(keys);
      } catch (e) {
        this.logger.error(`Failed to delete S3 objects`, e instanceof Error ? e.stack : undefined);
        continue;
      }

      try {
        await this.restaurantImageRepository.delete({ id: In(ids) });
      } catch (e) {
        this.logger.error(`Failed to delete DB records`, e instanceof Error ? e.stack : undefined);
      }
    }

    for (const userId of affectedUserIds) {
      this.emitThumbnailUpdated(userId);
    }
  }

  private async cleanupOrphanRecords(): Promise<void> {
    try {
      const s3Objects = await this.s3Service.listObjects(RESTAURANT_IMAGES_PREFIX, S3_LIST_BATCH_SIZE);
      const s3Keys = new Set(s3Objects.map((obj) => obj.key));

      let lastId = 0;

      while (true) {
        const rows = await this.restaurantImageRepository
          .createQueryBuilder("img")
          .select(["img.id", "img.key"])
          .where("img.id > :lastId", { lastId })
          .orderBy("img.id", "ASC")
          .limit(CLEANUP_BATCH_SIZE)
          .getMany();

        if (rows.length === 0) break;

        lastId = rows.at(-1)!.id;

        const orphanIds = rows.filter((row) => !s3Keys.has(row.key)).map((row) => row.id);

        if (orphanIds.length > 0) {
          try {
            await this.restaurantImageRepository.delete({ id: In(orphanIds) });
          } catch (e) {
            this.logger.error(`Failed to delete orphan DB records`, e instanceof Error ? e.stack : undefined);
          }
        }
      }
    } catch (e) {
      this.logger.error("Failed to cleanup orphan records", e instanceof Error ? e.stack : undefined);
    }
  }

  private async cleanupOrphanS3Files(): Promise<void> {
    try {
      const s3Objects = await this.s3Service.listObjects(RESTAURANT_IMAGES_PREFIX, S3_LIST_BATCH_SIZE);
      if (s3Objects.length === 0) return;

      const s3Keys = s3Objects.map((obj) => obj.key);
      const existingKeys = await this.getExistingKeysFromDb(s3Keys);
      const orphanKeys = s3Keys.filter((key) => !existingKeys.has(key));

      if (orphanKeys.length === 0) return;

      for (let i = 0; i < orphanKeys.length; i += CLEANUP_BATCH_SIZE) {
        const batch = orphanKeys.slice(i, i + CLEANUP_BATCH_SIZE);
        try {
          await this.s3Service.deleteObjects(batch);
        } catch (e) {
          this.logger.error(
            `Failed to delete orphan S3 files (batch ${batch.length})`,
            e instanceof Error ? e.stack : undefined,
          );
        }
      }
    } catch (e) {
      this.logger.error("Failed to cleanup orphan S3 files", e instanceof Error ? e.stack : undefined);
    }
  }

  private async getExistingKeysFromDb(keys: string[]): Promise<Set<string>> {
    if (keys.length === 0) return new Set();

    const rows = await this.restaurantImageRepository
      .createQueryBuilder("img")
      .select(["img.key"])
      .where("img.key IN (:...keys)", { keys })
      .getMany();

    return new Set(rows.map((row) => row.key));
  }

  private emitThumbnailUpdated(userId: number): void {
    this.eventEmitter.emit(RestaurantImageEventType.THUMBNAIL_UPDATED, { userId, thumbnailUrl: null });
  }
}
