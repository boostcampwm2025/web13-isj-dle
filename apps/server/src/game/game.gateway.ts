import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { AvatarDirection, AvatarState, NoticeEventType, UserEventType } from "@shared/types";
import { Server, Socket } from "socket.io";
import { NoticeService } from "src/notice/notice.service";

import { UserManager } from "../user/user-manager.service";

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL?.split(",") || ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly userManager: UserManager,
    private readonly noticeService: NoticeService,
  ) {}

  afterInit() {
    this.logger.log("🚀 WebSocket Gateway initialized");
    this.logger.log(`📡 CORS origins: ${process.env.CLIENT_URL || "http://localhost:5173,http://localhost:3000"}`);
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`✅ Client connected: ${client.id}`);
      this.logger.debug(`👥 Total clients: ${this.server.sockets.sockets.size}`);

      const user = this.userManager.createSession({
        id: client.id,
      });

      if (!user) {
        this.logger.error(`Failed to create session for client: ${client.id}`);
        client.disconnect();
        return;
      }

      await client.join(user.avatar.currentRoomId);
      client.emit(UserEventType.USER_SYNC, { user, users: this.userManager.getAllSessions() });
      client.broadcast.emit(UserEventType.USER_JOIN, { user });

      this.logger.log(`Game user created: ${user.nickname} (${user.avatar.assetKey})`);
    } catch (err) {
      this.logger.error(`Failed to handle connection: ${client.id}`, err instanceof Error ? err.stack : String(err));
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      this.logger.log(`❌ Client disconnected: ${client.id}`);
      const deleted = this.userManager.deleteSession(client.id);
      if (!deleted) {
        this.logger.warn(`Session not found for disconnected client: ${client.id}`);
      }

      client.broadcast.emit(UserEventType.USER_LEFT, { userId: client.id });
      this.logger.debug(`👥 Total clients: ${this.server.sockets.sockets.size}`);
    } catch (err) {
      this.logger.error(`\`Error during disconnect for ${client.id}`, err instanceof Error ? err.stack : String(err));
    }
  }

  @SubscribeMessage(NoticeEventType.NOTICE_SYNC)
  async handleNoticeSync(client: Socket, payload: { roomId: string }) {
    if (!payload || !payload.roomId) {
      this.logger.warn(`⚠️ NOTICE_SYNC called without roomId from client: ${client.id}`);
      return;
    }

    try {
      const notices = await this.noticeService.findByRoomId(payload.roomId);
      this.logger.log(`${payload.roomId} notice count: ${notices.length}`);
      client.emit(NoticeEventType.NOTICE_SYNC, notices);
    } catch (error) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error(`❗ Failed to sync notices for room ${payload.roomId} from client ${client.id}`, trace);
      client.emit("error", { message: "Failed to sync notices" });
    }
  }

  @SubscribeMessage(UserEventType.PLAYER_MOVE)
  handlePlayerMove(client: Socket, payload: { x: number; y: number; direction: AvatarDirection; state: AvatarState }) {
    const updated = this.userManager.updateSessionPosition(client.id, payload);
    const user = this.userManager.getSession(client.id);

    if (!updated || !user) {
      this.logger.warn(`⚠️ PLAYER_MOVE: Session not found for client: ${client.id}`);
      return;
    }

    const roomId = user.avatar.currentRoomId;

    this.logger.debug(
      `➡️ PLAYER_MOVE: ${client.id} moved to (${payload.x}, ${payload.y}, ${payload.direction}) in room ${roomId}`,
    );

    this.server.to(roomId).emit(UserEventType.PLAYER_MOVED, {
      userId: client.id,
      ...payload,
    });
  }
}
