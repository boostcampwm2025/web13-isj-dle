import { Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import { AvatarAssetKey, AvatarDirection, AvatarState, UserEventType } from "@shared/types";
import { Server, Socket } from "socket.io";

import { UserService } from "./user.service";

@WebSocketGateway()
export class UserGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(UserGateway.name);

  constructor(private readonly userService: UserService) {}

  @SubscribeMessage(UserEventType.USER_UPDATE)
  handleUserUpdate(client: Socket, payload: { cameraOn?: boolean; micOn?: boolean }) {
    const updated = this.userService.updateSessionMedia(client.id, payload);
    const user = this.userService.getSession(client.id);

    if (!updated || !user) {
      this.logger.warn(`⚠️ USER_UPDATE: Session not found for client: ${client.id}`);
      return;
    }

    this.server.emit(UserEventType.USER_UPDATE, { socketId: client.id, ...payload });
  }

  @SubscribeMessage(UserEventType.PLAYER_MOVE)
  handlePlayerMove(
    client: Socket,
    payload: { x: number; y: number; direction: AvatarDirection; state: AvatarState; force?: boolean },
    ack?: (res: any) => void,
  ) {
    const updated = this.userService.updateSessionPosition(client.id, payload);
    const user = this.userService.getSession(client.id);

    if (!updated || !user) {
      this.logger.warn(`⚠️ PLAYER_MOVE: Session not found for client: ${client.id}`);
      ack?.({ success: false });
      return;
    }

    const roomId = user.avatar.currentRoomId;

    this.server.to(roomId).emit(UserEventType.PLAYER_MOVED, {
      socketId: client.id,
      ...payload,
    });
  }

  @OnEvent(UserEventType.USER_INFO_UPDATE)
  handleUserInfoUpdate(payload: { userId: number; nickname?: string; avatarAssetKey?: AvatarAssetKey }) {
    this.logger.log(`📢 Broadcasting USER_INFO_UPDATE to all clients:`, payload);
    this.userService.updateUserInfo(payload);
    this.server.emit(UserEventType.USER_INFO_UPDATE, payload);
  }
}
