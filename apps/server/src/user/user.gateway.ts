import { Logger } from "@nestjs/common";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import { AvatarDirection, AvatarState, UserEventType } from "@shared/types";
import { Server, Socket } from "socket.io";

import { UserManager } from "./user-manager.service";

@WebSocketGateway()
export class UserGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(UserGateway.name);

  constructor(private readonly userManager: UserManager) {}

  @SubscribeMessage(UserEventType.USER_UPDATE)
  handleUserUpdate(client: Socket, payload: { cameraOn?: boolean; micOn?: boolean }) {
    const updated = this.userManager.updateSessionMedia(client.id, payload);
    const user = this.userManager.getSession(client.id);

    if (!updated || !user) {
      this.logger.warn(`⚠️ USER_UPDATE: Session not found for client: ${client.id}`);
      return;
    }

    this.server.emit(UserEventType.USER_UPDATE, { userId: client.id, ...payload });
  }

  @SubscribeMessage(UserEventType.PLAYER_MOVE)
  handlePlayerMove(
    client: Socket,
    payload: { x: number; y: number; direction: AvatarDirection; state: AvatarState; force?: boolean },
    ack?: (res: any) => void,
  ) {
    const updated = this.userManager.updateSessionPosition(client.id, payload);
    const user = this.userManager.getSession(client.id);

    if (!updated || !user) {
      this.logger.warn(`⚠️ PLAYER_MOVE: Session not found for client: ${client.id}`);
      ack?.({ success: false });
      return;
    }

    const roomId = user.avatar.currentRoomId;

    this.server.to(roomId).emit(UserEventType.PLAYER_MOVED, {
      userId: client.id,
      ...payload,
    });
  }
}
