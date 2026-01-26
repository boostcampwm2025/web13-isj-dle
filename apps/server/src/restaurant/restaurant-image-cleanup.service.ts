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
    this.logger.log("Starting midnight cleanup of temp restaurant images");

    const stats = await this.cleanupTempImages();

    this.logger.log(
      `Cleanup completed: ${stats.deletedCount} deleted, ${stats.failedCount} failed, ${stats.skippedCount} skipped`,
    );
  }

  async cleanupTempImages(): Promise<{ deletedCount: number; failedCount: number; skippedCount: number }> {
    let lastId = 0;
    let deletedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let consecutiveFailures = 0;

    const tempPrefix = this.s3Service.getTempPrefix();
    if (!tempPrefix) {
      this.logger.warn("S3_TEMP_PREFIX is empty; skipping restaurant image cleanup");
      return { deletedCount, failedCount, skippedCount };
    }

    while (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
      const rows = await this.restaurantImageRepository
        .createQueryBuilder("img")
        .select(["img.id", "img.key"])
        .where("img.id > :lastId AND img.key LIKE :prefix", { lastId, prefix: `${tempPrefix}%` })
        .orderBy("img.id", "ASC")
        .limit(BATCH_SIZE)
        .getMany();

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;

      const tempKeys = rows.map((r) => r.key);

      let s3DeleteSucceeded = false;
      try {
        await this.s3Service.deleteObjects(tempKeys);
        s3DeleteSucceeded = true;
        consecutiveFailures = 0;
      } catch (e) {
        consecutiveFailures++;
        failedCount += rows.length;
        this.logger.error(
          `Failed to delete S3 objects (batch ${rows.length}, consecutive failures: ${consecutiveFailures})`,
          e instanceof Error ? e.stack : undefined,
        );
      }

      if (s3DeleteSucceeded) {
        try {
          const ids = rows.map((r) => r.id);
          await this.restaurantImageRepository.delete({ id: In(ids) });
          deletedCount += rows.length;
        } catch (e) {
          skippedCount += rows.length;
          this.logger.error(
            `Failed to delete DB records after S3 deletion (batch ${rows.length})`,
            e instanceof Error ? e.stack : undefined,
          );
        }
      }
    }

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      this.logger.error(`Cleanup aborted after ${MAX_CONSECUTIVE_FAILURES} consecutive S3 failures`);
    }

    return { deletedCount, failedCount, skippedCount };
  }
}
