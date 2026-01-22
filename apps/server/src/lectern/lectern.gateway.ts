import { Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import { type BreakoutConfig, LecternEventType, RoomType, UserEventType } from "@shared/types";
import { Server, Socket } from "socket.io";

import { UserManager } from "../user/user-manager.service";
import { LecternService } from "./lectern.service";

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL?.split(",") || ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
})
export class LecternGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(LecternGateway.name);

  constructor(
    private readonly lecternService: LecternService,
    private readonly userManager: UserManager,
  ) {}

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

  @SubscribeMessage(LecternEventType.BREAKOUT_CREATE)
  handleBreakoutCreate(
    client: Socket,
    payload: {
      hostRoomId: RoomType;
      config: BreakoutConfig;
      userIds: string[];
    },
  ) {
    const isHost = this.lecternService.isHost(payload.hostRoomId, client.id);

    if (!isHost) {
      this.logger.warn(`[Breakout] Not a host - rejecting`);
      client.emit("error", { message: "You're not a host" });
      return;
    }

    const state = this.lecternService.createBreakout(payload.hostRoomId, client.id, payload.config, payload.userIds);

    if (!state) {
      this.logger.warn(`[Breakout] createBreakout failed`);
      client.emit("error", { message: "Breakout cannot be executed" });
      return;
    }

    this.server.to(payload.hostRoomId).emit(LecternEventType.BREAKOUT_UPDATE, {
      hostRoomId: payload.hostRoomId,
      state,
    });
  }

  @SubscribeMessage(LecternEventType.BREAKOUT_END)
  handleBreakoutEnd(client: Socket, payload: { hostRoomId: RoomType }) {
    if (!this.lecternService.isHost(payload.hostRoomId, client.id)) {
      client.emit("error", { message: "You're not a host" });
      return;
    }

    this.lecternService.endBreakout(payload.hostRoomId);

    this.server.to(payload.hostRoomId).emit(LecternEventType.BREAKOUT_UPDATE, {
      hostRoomId: payload.hostRoomId,
      state: null,
    });
  }

  @SubscribeMessage(LecternEventType.BREAKOUT_JOIN)
  handleBreakoutJoin(client: Socket, payload: { hostRoomId: RoomType; userId: string; targetRoomId: string }) {
    const breakoutState = this.lecternService.getBreakoutState(payload.hostRoomId);

    if (!breakoutState) {
      client.emit("error", { message: "진행 중인 소회의실이 없습니다." });
      return;
    }

    const isHost = this.lecternService.isHost(payload.hostRoomId, client.id);
    const isRandom = breakoutState.config.isRandom;

    if (!isHost && isRandom) {
      client.emit("error", { message: "랜덤 배정 모드에서는 방 이동이 불가능합니다." });
      return;
    }

    const state = this.lecternService.joinBreakoutRoom(payload.hostRoomId, payload.userId, payload.targetRoomId);

    if (state) {
      this.server.to(payload.hostRoomId).emit(LecternEventType.BREAKOUT_UPDATE, {
        hostRoomId: payload.hostRoomId,
        state,
      });
    }
  }

  @SubscribeMessage(LecternEventType.BREAKOUT_LEAVE)
  handleBreakoutLeave(_client: Socket, payload: { hostRoomId: RoomType; userId: string; targetRoomId: string }) {
    const state = this.lecternService.leaveBreakoutRoom(payload.hostRoomId, payload.userId);

    if (state) {
      this.server.to(payload.hostRoomId).emit(LecternEventType.BREAKOUT_UPDATE, {
        hostRoomId: payload.hostRoomId,
        state,
      });
    }
  }

  @OnEvent("user.disconnecting")
  handleUserDisconnect({ clientId }: { clientId: string }) {
    const affectedRooms = this.lecternService.removeUserFromAllLecterns(clientId);
    for (const [roomId, state] of affectedRooms) {
      this.server.to(roomId).emit(LecternEventType.LECTERN_UPDATE, {
        roomId,
        hostId: state.hostId,
        usersOnLectern: state.usersOnLectern,
      });
    }
  }
}
