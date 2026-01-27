import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";

import { In, Repository } from "typeorm";

import { S3Service } from "../storage/s3.service";
import { RestaurantImageEntity } from "./restaurant-image.entity";

const BATCH_SIZE = 100;
const MAX_CONSECUTIVE_FAILURES = 3;

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

    const stats = await this.cleanupOrphanRecords();

    this.logger.log(
      `Cleanup completed: ${stats.deletedCount} deleted, ${stats.failedCount} failed, ${stats.skippedCount} skipped`,
    );
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
      .limit(BATCH_SIZE)
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
}
