import { Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import {
  RestaurantImageEventType,
  type RestaurantImageLikeToggleAck,
  type RestaurantImageLikeTogglePayload,
  type RestaurantImageLikeUpdatedPayload,
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

  @SubscribeMessage(RestaurantImageEventType.IMAGE_LIKE_TOGGLE)
  async handleImageLikeToggle(
    client: Socket,
    payload: RestaurantImageLikeTogglePayload,
    ack?: (res: RestaurantImageLikeToggleAck) => void,
  ) {
    try {
      const imageIdRaw = String(payload?.imageId ?? "").trim();
      const imageId = parseInt(imageIdRaw, 10);
      const userId = Number(payload?.userId ?? "");

      if (!imageIdRaw || Number.isNaN(imageId)) {
        ack?.({ success: false, message: "Invalid imageId" });
        return;
      }

      if (!userId) {
        ack?.({ success: false, message: "Invalid userId" });
        return;
      }

      const res = await this.restaurantService.toggleImageLike(userId, imageId);
      ack?.({ success: true, likes: res.likes, liked: res.liked });
    } catch (error) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.warn(`Failed to toggle image like for client ${client.id}`, trace);
      ack?.({ success: false, message: "Like toggle failed" });
    }
  }

  @SubscribeMessage(RestaurantImageEventType.THUMBNAILS_SYNC)
  async handleThumbnailsSync(
    client: Socket,
    payload: RestaurantThumbnailsSyncPayload,
    ack?: (res: RestaurantThumbnailsStatePayload) => void,
  ) {
    try {
      const requested = Array.isArray(payload?.userIds) ? payload.userIds : [];
      const userIds = Array.from(new Set(requested.filter(Boolean))).slice(0, MAX_THUMBNAIL_SYNC_USERS);

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

  @OnEvent(RestaurantImageEventType.IMAGE_LIKE_UPDATED)
  handleImageLikeUpdated(payload: RestaurantImageLikeUpdatedPayload) {
    this.server.emit(RestaurantImageEventType.IMAGE_LIKE_UPDATED, payload);
  }
}
