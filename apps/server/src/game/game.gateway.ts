import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { AvatarDirection, AvatarState, NoticeEventType, RoomEventType, UserEventType } from "@shared/types";
import type { RoomJoinPayload } from "@shared/types";
import { Server, Socket } from "socket.io";
import { NoticeService } from "src/notice/notice.service";

import { BoundaryService } from "../boundary/boundary.service";
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
    private readonly boundaryService: BoundaryService,
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

  @SubscribeMessage(RoomEventType.ROOM_JOIN)
  async handleRoomJoin(client: Socket, payload: RoomJoinPayload) {
    if (!payload || !payload.roomId) {
      this.logger.warn(`⚠️ ROOM_JOIN called without roomId from client: ${client.id}`);
      return;
    }

    try {
      const user = this.userManager.getSession(client.id);
      if (!user) {
        this.logger.error(`❌ User session not found for client: ${client.id}`);
        client.emit("error", { message: "User session not found" });
        return;
      }

      const previousRoomId = user.avatar.currentRoomId;

      const updated = this.userManager.updateSessionRoom(client.id, payload.roomId);
      if (!updated) {
        this.logger.error(`❌ Failed to update room for user: ${client.id}`);
        return;
      }

      // 방 이동 시 contactId 초기화
      this.userManager.updateSessionContactId(client.id, null);

      // 이전 lobby 유저들의 boundary 재계산
      if (previousRoomId === "lobby") {
        const lobbyUsers = this.userManager.getRoomSessions("lobby");
        const groups = this.boundaryService.findBoundaryGroups(lobbyUsers);
        const contactIdUpdates = this.boundaryService.updateContactIds(lobbyUsers, groups);

        for (const [userId, newContactId] of contactIdUpdates) {
          this.userManager.updateSessionContactId(userId, newContactId);
        }

        if (contactIdUpdates.size > 0) {
          const updates = Object.fromEntries(contactIdUpdates);
          this.server.to("lobby").emit(UserEventType.BOUNDARY_UPDATE, updates);
        }
      }

      await client.leave(previousRoomId);
      await client.join(payload.roomId);
      this.logger.log(`🚪 User ${user.nickname} (${client.id}) joined room: ${payload.roomId}`);

      const roomUsers = this.userManager.getRoomSessions(payload.roomId);
      const updatedUser = this.userManager.getSession(client.id);

      this.server.emit(RoomEventType.ROOM_JOINED, {
        userId: client.id,
        roomId: payload.roomId,
      });

      client.emit(UserEventType.USER_SYNC, {
        user: updatedUser,
        users: this.userManager.getAllSessions(),
      });

      this.logger.log(
        `✅ Room join complete: ${user.nickname} → ${payload.roomId} (${roomUsers.length} users in room)`,
      );
    } catch (error) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error(`❗ Failed to handle room join for client ${client.id}`, trace);
      client.emit("error", { message: "Failed to join room" });
    }
  }

  @SubscribeMessage(UserEventType.USER_UPDATE)
  handleUserUpdate(client: Socket, payload: { cameraOn?: boolean; micOn?: boolean }) {
    const updated = this.userManager.updateSessionMedia(client.id, payload);
    const user = this.userManager.getSession(client.id);

    if (!updated || !user) {
      this.logger.warn(`⚠️ USER_UPDATE: Session not found for client: ${client.id}`);
      return;
    }

    this.logger.debug(`🎥 USER_UPDATE: ${client.id} -> (camera: ${user.cameraOn}, mic: ${user.micOn})`);

    this.server.emit(UserEventType.USER_UPDATE, { userId: client.id, ...payload });
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

    // Boundary 체크: lobby에서만 활성화
    if (roomId === "lobby") {
      const roomUsers = this.userManager.getRoomSessions(roomId);
      const groups = this.boundaryService.findBoundaryGroups(roomUsers);
      const contactIdUpdates = this.boundaryService.updateContactIds(roomUsers, groups);

      // contactId가 변경된 유저들 업데이트
      for (const [userId, newContactId] of contactIdUpdates) {
        this.userManager.updateSessionContactId(userId, newContactId);
      }

      // contactId 변경 사항 브로드캐스트
      if (contactIdUpdates.size > 0) {
        const updates = Object.fromEntries(contactIdUpdates);
        this.server.to(roomId).emit(UserEventType.BOUNDARY_UPDATE, updates);
      }
    }
  }
}
