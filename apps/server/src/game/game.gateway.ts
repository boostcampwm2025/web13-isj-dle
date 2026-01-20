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
import {
  type BreakoutConfig,
  BreakoutEventType,
  LecternEventType,
  type RoomJoinPayload,
  type RoomType,
} from "@shared/types";
import { Server, Socket } from "socket.io";
import { NoticeService } from "src/notice/notice.service";

import { BoundaryService } from "../boundary/boundary.service";
import { BreakoutService } from "../breakout/breakout.service";
import { LecternService } from "../lectern/lectern.service";
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
    private readonly lecternService: LecternService,
    private readonly breakoutService: BreakoutService,
  ) {}

  afterInit() {
    this.logger.log("🚀 WebSocket Gateway initialized");
    this.logger.log(`📡 CORS origins: ${process.env.CLIENT_URL || "http://localhost:5173,http://localhost:3000"}`);
  }

  async handleConnection(client: Socket) {
    try {
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

      this.logger.log(`✅ Client connected: ${client.id} ${user.nickname} (${user.avatar.assetKey})`);
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

      const affectedRooms = this.lecternService.removeUserFromAllLecterns(client.id);
      for (const [roomId, state] of affectedRooms) {
        this.server.to(roomId).emit(LecternEventType.LECTERN_UPDATE, {
          roomId,
          hostId: state.hostId,
          usersOnLectern: state.usersOnLectern,
        });
      }
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

      this.userManager.updateSessionContactId(client.id, null);

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

      const updatedUser = this.userManager.getSession(client.id);

      this.server.emit(RoomEventType.ROOM_JOINED, {
        userId: client.id,
        avatar: updatedUser!.avatar,
      });

      client.emit(UserEventType.USER_SYNC, {
        user: updatedUser,
        users: this.userManager.getAllSessions(),
      });
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

    this.server.to(roomId).emit(UserEventType.PLAYER_MOVED, {
      userId: client.id,
      ...payload,
    });

    if (roomId === "lobby") {
      const roomUsers = this.userManager.getRoomSessions(roomId);
      const groups = this.boundaryService.findBoundaryGroups(roomUsers);
      const contactIdUpdates = this.boundaryService.updateContactIds(roomUsers, groups);

      for (const [userId, newContactId] of contactIdUpdates) {
        this.userManager.updateSessionContactId(userId, newContactId);
      }

      if (contactIdUpdates.size > 0) {
        const updates = Object.fromEntries(contactIdUpdates);
        this.server.to(roomId).emit(UserEventType.BOUNDARY_UPDATE, updates);
      }
    }
  }

  @SubscribeMessage(LecternEventType.LECTERN_ENTER)
  handleLecternEnter(client: Socket, payload: { roomId: RoomType }) {
    const state = this.lecternService.enterLectern(payload.roomId, client.id);

    this.server.to(payload.roomId).emit(LecternEventType.LECTERN_UPDATE, {
      roomId: payload.roomId,
      hostId: state.hostId,
      usersOnLectern: state.usersOnLectern,
    });
  }

  @SubscribeMessage(LecternEventType.LECTERN_LEAVE)
  handleLecternLeave(client: Socket, payload: { roomId: RoomType }) {
    const state = this.lecternService.leaveLectern(payload.roomId, client.id);

    this.server.to(payload.roomId).emit(LecternEventType.LECTERN_UPDATE, {
      roomId: payload.roomId,
      hostId: state.hostId,
      usersOnLectern: state.usersOnLectern,
    });
  }

  @SubscribeMessage(LecternEventType.MUTE_ALL)
  handleMuteAll(client: Socket, payload: { roomId: RoomType }, callback?: (response: { success: boolean }) => void) {
    if (!this.lecternService.isHost(payload.roomId, client.id)) {
      callback?.({ success: false });
      return;
    }

    const targetUsers = this.userManager.getRoomSessions(payload.roomId).filter((user) => user.id !== client.id);
    for (const user of targetUsers) {
      if (user.id !== client.id) {
        this.userManager.updateSessionMedia(user.id, { micOn: false });
      }
    }

    this.server.to(payload.roomId).emit(LecternEventType.MUTE_ALL_EXECUTED, {
      hostId: client.id,
    });

    for (const user of targetUsers) {
      if (user.id !== client.id) {
        this.server.emit(UserEventType.USER_UPDATE, {
          userId: user.id,
          micOn: false,
        });
      }
    }

    callback?.({ success: true });
  }

  @SubscribeMessage(BreakoutEventType.BREAKOUT_CREATE)
  handleBreakoutCreate(
    client: Socket,
    payload: {
      roomId: RoomType;
      config: BreakoutConfig;
      userIds: string[];
    },
  ) {
    if (!this.lecternService.isHost(payload.roomId, client.id)) {
      client.emit("error", { message: "You're not a host" });
      return;
    }

    const state = this.breakoutService.createBreakout(payload.roomId, client.id, payload.config, payload.userIds);

    this.server.to(payload.roomId).emit(BreakoutEventType.BREAKOUT_UPDATE, {
      roomId: payload.roomId,
      state,
    });
  }

  @SubscribeMessage(BreakoutEventType.BREAKOUT_END)
  handleBreakoutEnd(client: Socket, payload: { roomId: RoomType }) {
    if (!this.lecternService.isHost(payload.roomId, client.id)) {
      client.emit("error", { message: "You're not a host" });
      return;
    }

    this.breakoutService.endBreakout(payload.roomId);

    this.server.to(payload.roomId).emit(BreakoutEventType.BREAKOUT_UPDATE, {
      roomId: payload.roomId,
      state: null,
    });
  }
}
