import { Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import {
  RestaurantImageEventType,
  type RestaurantThumbnailUpdatedPayload,
  type RestaurantThumbnailsStatePayload,
  type RestaurantThumbnailsSyncPayload,
} from "@shared/types";
import type { Server, Socket } from "socket.io";

import { RestaurantService } from "./restaurant.service";

const MAX_THUMBNAIL_SYNC_USERS = 200;

@WebSocketGateway()
export class RestaurantImageGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RestaurantImageGateway.name);

  constructor(private readonly restaurantService: RestaurantService) {}

  @SubscribeMessage(RestaurantImageEventType.THUMBNAILS_SYNC)
  async handleThumbnailsSync(
    client: Socket,
    payload: RestaurantThumbnailsSyncPayload,
    ack?: (res: RestaurantThumbnailsStatePayload) => void,
  ) {
    try {
      const requested = Array.isArray(payload?.userIds) ? payload.userIds : [];
      const userIds = Array.from(new Set(requested.map((v) => String(v).trim()).filter(Boolean))).slice(
        0,
        MAX_THUMBNAIL_SYNC_USERS,
      );

      const entries = await Promise.all(
        userIds.map(async (userId) => {
          const thumbnailUrl = await this.restaurantService.getLatestThumbnailUrlByUserId(userId);
          return [userId, thumbnailUrl] as const;
        }),
      );

      ack?.({ thumbnailsByUserId: Object.fromEntries(entries) });
    } catch (error) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.warn(`Failed to handle thumbnail sync for client ${client.id}`, trace);
      ack?.({ thumbnailsByUserId: {} });
    }
  }

  @OnEvent(RestaurantImageEventType.THUMBNAIL_UPDATED)
  handleThumbnailUpdated(payload: RestaurantThumbnailUpdatedPayload) {
    this.server.emit(RestaurantImageEventType.THUMBNAIL_UPDATED, payload);
  }
}
