import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";

import { In, Repository } from "typeorm";

import { S3Service } from "../storage/s3.service";
import { RestaurantImageEntity } from "./restaurant-image.entity";

const CLEANUP_BATCH_SIZE = 100;
const S3_LIST_BATCH_SIZE = 500;
const MAX_CONSECUTIVE_FAILURES = 3;
const RESTAURANT_IMAGES_PREFIX = "restaurant-images/";

@Injectable()
export class RestaurantImageCleanupService {
  private readonly logger = new Logger(RestaurantImageCleanupService.name);

  constructor(
    private readonly s3Service: S3Service,
    @InjectRepository(RestaurantImageEntity)
    private readonly restaurantImageRepository: Repository<RestaurantImageEntity>,
  ) {}

  @Cron("0 0 0 * * *", { timeZone: "Asia/Seoul" })
  async cleanupMidnight(): Promise<void> {
    this.logger.log("Starting midnight cleanup of orphan restaurant image records");

    const dbStats = await this.cleanupOrphanRecords();
    this.logger.log(
      `DB orphan cleanup completed: ${dbStats.deletedCount} deleted, ${dbStats.failedCount} failed, ${dbStats.skippedCount} skipped`,
    );

    const s3Stats = await this.cleanupOrphanS3Files();
    this.logger.log(`S3 orphan cleanup completed: ${s3Stats.deletedCount} deleted, ${s3Stats.failedCount} failed`);
  }

  async cleanupOrphanRecords(): Promise<{ deletedCount: number; failedCount: number; skippedCount: number }> {
    const stats = { lastId: 0, deletedCount: 0, failedCount: 0, skippedCount: 0, consecutiveFailures: 0 };

    while (stats.consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
      const rows = await this.fetchBatch(stats.lastId);
      if (rows.length === 0) break;

      stats.lastId = rows.at(-1)!.id;

      const orphanIds = await this.findOrphanIds(rows, stats);
      if (stats.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) break;

      await this.deleteOrphanRecords(orphanIds, stats);
    }

    if (stats.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      this.logger.error(`Cleanup aborted after ${MAX_CONSECUTIVE_FAILURES} consecutive S3 failures`);
    }

    return { deletedCount: stats.deletedCount, failedCount: stats.failedCount, skippedCount: stats.skippedCount };
  }

  private async fetchBatch(lastId: number): Promise<RestaurantImageEntity[]> {
    return this.restaurantImageRepository
      .createQueryBuilder("img")
      .select(["img.id", "img.key"])
      .where("img.id > :lastId", { lastId })
      .orderBy("img.id", "ASC")
      .limit(CLEANUP_BATCH_SIZE)
      .getMany();
  }

  private async findOrphanIds(
    rows: RestaurantImageEntity[],
    stats: { consecutiveFailures: number; failedCount: number },
  ): Promise<number[]> {
    const orphanIds: number[] = [];

    for (const row of rows) {
      try {
        const exists = await this.s3Service.objectExists(row.key);
        if (!exists) orphanIds.push(row.id);
        stats.consecutiveFailures = 0;
      } catch (e) {
        stats.consecutiveFailures++;
        stats.failedCount++;
        this.logger.error(
          `Failed to check S3 object existence for key=${row.key} (consecutive failures: ${stats.consecutiveFailures})`,
          e instanceof Error ? e.stack : undefined,
        );
        if (stats.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) break;
      }
    }

    return orphanIds;
  }

  private async deleteOrphanRecords(
    orphanIds: number[],
    stats: { deletedCount: number; skippedCount: number },
  ): Promise<void> {
    if (orphanIds.length === 0) return;

    try {
      await this.restaurantImageRepository.delete({ id: In(orphanIds) });
      stats.deletedCount += orphanIds.length;
    } catch (e) {
      stats.skippedCount += orphanIds.length;
      this.logger.error(
        `Failed to delete orphan DB records (batch ${orphanIds.length})`,
        e instanceof Error ? e.stack : undefined,
      );
    }
  }

  async cleanupOrphanS3Files(): Promise<{ deletedCount: number; failedCount: number }> {
    const stats = { deletedCount: 0, failedCount: 0, consecutiveFailures: 0 };

    try {
      const s3Objects = await this.s3Service.listObjects(RESTAURANT_IMAGES_PREFIX, S3_LIST_BATCH_SIZE);
      if (s3Objects.length === 0) return stats;

      const s3Keys = s3Objects.map((obj) => obj.key);
      const existingKeys = await this.getExistingKeysFromDb(s3Keys);
      const orphanKeys = s3Keys.filter((key) => !existingKeys.has(key));

      if (orphanKeys.length === 0) return stats;

      await this.deleteOrphanS3Files(orphanKeys, stats);
    } catch (e) {
      this.logger.error("Failed to cleanup orphan S3 files", e instanceof Error ? e.stack : undefined);
      stats.failedCount++;
    }

    return stats;
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

  private async deleteOrphanS3Files(
    orphanKeys: string[],
    stats: { deletedCount: number; failedCount: number },
  ): Promise<void> {
    const batchSize = CLEANUP_BATCH_SIZE;

    for (let i = 0; i < orphanKeys.length; i += batchSize) {
      const batch = orphanKeys.slice(i, i + batchSize);

      try {
        await this.s3Service.deleteObjects(batch);
        stats.deletedCount += batch.length;
      } catch (e) {
        stats.failedCount += batch.length;
        this.logger.error(
          `Failed to delete orphan S3 files (batch ${batch.length})`,
          e instanceof Error ? e.stack : undefined,
        );
      }
    }
  }
}
