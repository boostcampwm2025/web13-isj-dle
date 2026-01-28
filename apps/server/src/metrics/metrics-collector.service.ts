import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { UserManager } from "../user/user-manager.service";
import { KNOWN_ROOM_TYPES } from "./metric-room-types";
import { MetricsService } from "./metrics.service";

@Injectable()
export class MetricsCollectorService {
  private readonly logger = new Logger(MetricsCollectorService.name);
  constructor(
    private readonly metricsService: MetricsService,
    @Inject(forwardRef(() => UserManager))
    private readonly userManager: UserManager,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  reconcileMetrics() {
    try {
      const actualUserCount = this.userManager.getSessionCount();
      this.metricsService.reconcileOnlineUsers(actualUserCount);

      const usersByRoom = this.userManager.getUserCountByRoomType();
      for (const [roomType, count] of usersByRoom.entries()) {
        this.metricsService.reconcileUsersByRoom(roomType, count);
      }

      for (const roomType of KNOWN_ROOM_TYPES) {
        if (!usersByRoom.has(roomType)) {
          this.metricsService.reconcileUsersByRoom(roomType, 0);
        }
      }

      const activeRoomsByType = this.userManager.getActiveRoomCountByType();
      for (const [roomType, count] of activeRoomsByType.entries()) {
        this.metricsService.reconcileActiveRooms(roomType, count);
      }
      for (const roomType of KNOWN_ROOM_TYPES) {
        if (!activeRoomsByType.has(roomType)) {
          this.metricsService.reconcileActiveRooms(roomType, 0);
        }
      }

      this.logger.debug(`Metrics reconciled: users=${actualUserCount}, roomTypes=${usersByRoom.size}`);
    } catch (error) {
      this.logger.error("Failed to reconcile metrics", error);
    }
  }
}
