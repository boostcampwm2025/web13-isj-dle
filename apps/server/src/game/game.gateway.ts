import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import {
  AvatarDirection,
  AvatarState,
  KnockEventType,
  LecternEventType,
  NoticeEventType,
  RoomEventType,
  TimerEventType,
  UserEventType,
} from "@shared/types";
import type {
  BreakoutConfig,
  DeskStatusUpdatePayload,
  KnockResponsePayload,
  KnockSendPayload,
  RoomJoinPayload,
  RoomType,
  TimerAddTimePayload,
  TimerPausePayload,
  TimerResetPayload,
  TimerStartPayload,
  TimerSyncPayload,
} from "@shared/types";
import { Server, Socket } from "socket.io";
import { BoundaryService } from "src/boundary/boundary.service";
import { BoundaryTracker } from "src/boundary/boundaryTracker.service";
import { NoticeService } from "src/notice/notice.service";
import { TimerService } from "src/timer/timer.service";

import { KnockService } from "../knock/knock.service";
import { LecternService } from "../lectern/lectern.service";
import { UserManager } from "../user/user-manager.service";

const BOUNDARY_TICK_MS = 100;

const isMeetingRoomId = (roomId: string): boolean => roomId.startsWith("meeting");
const isTimerRoomId = (roomId: string): boolean => isMeetingRoomId(roomId);

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL?.split(",") || ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(GameGateway.name);

  private boundaryTick: NodeJS.Timeout | null = null;

  constructor(
    private readonly userManager: UserManager,
    private readonly noticeService: NoticeService,
    private readonly boundaryService: BoundaryService,
    private readonly boundaryTracker: BoundaryTracker,
    private readonly timerService: TimerService,
    private readonly lecternService: LecternService,
    private readonly knockService: KnockService,
  ) {}

  private cleanupTimerAfterLeave(roomId: RoomType) {
    if (!isTimerRoomId(roomId)) return;

    const remaining = this.userManager.getRoomSessions(roomId).length;
    if (remaining !== 0) return;

    this.timerService.deleteTimer(roomId);
  }

  private validateTimerRequest(client: Socket, roomId: RoomType): boolean {
    const user = this.userManager.getSession(client.id);
    if (!user) return false;

    return user.avatar.currentRoomId === roomId;
  }

  afterInit() {
    this.logger.log("🚀 WebSocket Gateway initialized");
    this.logger.log(`📡 CORS origins: ${process.env.CLIENT_URL || "http://localhost:5173,http://localhost:3000"}`);

    this.boundaryTick = setInterval(() => {
      this.runBoundaryTick();
    }, BOUNDARY_TICK_MS);
  }

  async handleConnection(client: Socket) {
    try {
      const user = this.userManager.createSession({ id: client.id });

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

      this.boundaryTracker.clear(client.id);
      const user = this.userManager.getSession(client.id);
      const previousRoomId = user?.avatar.currentRoomId;
      this.endTalkIfNeeded(client.id, user?.nickname ?? "알 수 없음", "disconnected");

      const { sentTo, receivedFrom } = this.knockService.removeAllKnocksForUser(client.id);
      for (const targetUserId of sentTo) {
        this.server.to(targetUserId).emit(KnockEventType.KNOCK_CANCELLED, {
          fromUserId: client.id,
        });
      }
      for (const fromUserId of receivedFrom) {
        this.server.to(fromUserId).emit(KnockEventType.KNOCK_CANCELLED, {
          targetUserId: client.id,
        });
      }

      const deleted = this.userManager.deleteSession(client.id);
      if (!deleted) {
        this.logger.warn(`Session not found for disconnected client: ${client.id}`);
      }

      client.broadcast.emit(UserEventType.USER_LEFT, { userId: client.id });

      if (previousRoomId) {
        this.cleanupTimerAfterLeave(previousRoomId);
      }

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
  async handleRoomJoin(client: Socket, payload: RoomJoinPayload, ack?: (res: any) => void) {
    if (!payload || !payload.roomId) {
      this.logger.warn(`⚠️ ROOM_JOIN called without roomId from client: ${client.id}`);
      ack?.({ success: false });
      return;
    }

    try {
      const user = this.userManager.getSession(client.id);
      if (!user) {
        this.logger.error(`❌ User session not found for client: ${client.id}`);
        client.emit("error", { message: "User session not found" });
        ack?.({ success: false });
        return;
      }

      const previousRoomId = user.avatar.currentRoomId;

      this.userManager.updateSessionRoom(client.id, payload.roomId);
      if (previousRoomId === "desk zone" && payload.roomId !== "desk zone") {
        this.endTalkIfNeeded(client.id, user.nickname, "left_deskzone");

        const { sentTo, receivedFrom } = this.knockService.removeAllKnocksForUser(client.id);
        for (const targetUserId of sentTo) {
          this.server.to(targetUserId).emit(KnockEventType.KNOCK_CANCELLED, {
            fromUserId: client.id,
          });
        }
        for (const fromUserId of receivedFrom) {
          this.server.to(fromUserId).emit(KnockEventType.KNOCK_CANCELLED, {
            targetUserId: client.id,
          });
        }

        this.userManager.updateSessionDeskStatus(client.id, null);
      }

      const updated = this.userManager.updateSessionRoom(client.id, payload.roomId);
      if (!updated) {
        this.logger.error(`❌ Failed to update room for user: ${client.id}`);
        ack?.({ success: false });
        return;
      }

      this.userManager.updateSessionContactId(client.id, null);

      if (previousRoomId === "lobby") {
        this.boundaryTracker.clear(client.id);
        this.userManager.updateSessionContactId(client.id, null);
      }

      await client.leave(previousRoomId);
      await client.join(payload.roomId);

      this.cleanupTimerAfterLeave(previousRoomId);

      const updatedUser = this.userManager.getSession(client.id);
      if (!updatedUser) return;

      this.server.emit(RoomEventType.ROOM_JOINED, {
        userId: client.id,
        avatar: updatedUser.avatar,
      });

      client.emit(UserEventType.USER_SYNC, {
        user: updatedUser,
        users: this.userManager.getAllSessions(),
      });

      if (payload.roomId === "desk zone") {
        this.userManager.updateSessionDeskStatus(client.id, "available");

        this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
          userId: client.id,
          status: "available",
        });

        const deskzoneUsers = this.userManager.getRoomSessions("desk zone");
        for (const deskUser of deskzoneUsers) {
          if (deskUser.id !== client.id && deskUser.deskStatus) {
            client.emit(KnockEventType.DESK_STATUS_UPDATED, {
              userId: deskUser.id,
              status: deskUser.deskStatus,
            });
          }
        }
      }
      ack?.({ success: true });
    } catch (error) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error(`❗ Failed to handle room join for client ${client.id}`, trace);
      client.emit("error", { message: "Failed to join room" });
      ack?.({ success: false });
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

  private runBoundaryTick() {
    const lobbyUsers = this.userManager.getRoomSessions("lobby");
    if (lobbyUsers.length === 0) return;

    const updates = new Map<string, string | null>();

    const connectedGroups = this.boundaryService.findConnectedGroups(lobbyUsers);
    this.boundaryTracker.pruneInactiveGroups(new Set(connectedGroups.keys()));

    const usersInGroups = new Set<string>();
    for (const members of connectedGroups.values()) {
      for (const memberId of members) {
        usersInGroups.add(memberId);
      }
    }

    for (const [groupId, members] of connectedGroups) {
      for (const memberId of members) {
        const update = this.boundaryTracker.joinGroup(memberId, groupId);
        if (update !== undefined) updates.set(memberId, update);
      }
    }

    for (const user of lobbyUsers) {
      if (usersInGroups.has(user.id)) continue;

      const update = this.boundaryTracker.leaveGroup(user.id);
      if (update !== undefined) updates.set(user.id, update);
    }

    if (updates.size === 0) return;

    for (const [userId, contactId] of updates) {
      this.userManager.updateSessionContactId(userId, contactId);
    }

    this.server.to("lobby").emit(UserEventType.BOUNDARY_UPDATE, Object.fromEntries(updates));
  }

  @SubscribeMessage(TimerEventType.TIMER_START)
  handleTimerStart(client: Socket, payload: TimerStartPayload) {
    const roomId = payload?.roomId;
    if (!roomId || !isMeetingRoomId(roomId) || !this.validateTimerRequest(client, roomId)) return;

    const timerState = this.timerService.startTimer(roomId, payload.initialTimeSec, payload.startedAt);
    this.server.to(roomId).emit(TimerEventType.TIMER_STATE, timerState);
  }

  @SubscribeMessage(TimerEventType.TIMER_PAUSE)
  handleTimerPause(client: Socket, payload: TimerPausePayload) {
    const roomId = payload?.roomId;
    if (!roomId || !isMeetingRoomId(roomId) || !this.validateTimerRequest(client, roomId)) return;

    const timerState = this.timerService.pauseTimer(roomId, payload.pausedTimeSec);
    this.server.to(roomId).emit(TimerEventType.TIMER_STATE, timerState);
  }

  @SubscribeMessage(TimerEventType.TIMER_RESET)
  handleTimerReset(client: Socket, payload: TimerResetPayload) {
    const roomId = payload?.roomId;
    if (!roomId || !isMeetingRoomId(roomId) || !this.validateTimerRequest(client, roomId)) return;

    const timerState = this.timerService.resetTimer(roomId);
    this.server.to(roomId).emit(TimerEventType.TIMER_STATE, timerState);
  }

  @SubscribeMessage(TimerEventType.TIMER_ADD_TIME)
  handleTimerAddTime(client: Socket, payload: TimerAddTimePayload) {
    const roomId = payload?.roomId;
    if (!roomId || !isMeetingRoomId(roomId) || !this.validateTimerRequest(client, roomId)) return;

    const timerState = this.timerService.addTime(roomId, payload.additionalSec);
    this.server.to(roomId).emit(TimerEventType.TIMER_STATE, timerState);
  }

  @SubscribeMessage(TimerEventType.TIMER_SYNC)
  handleTimerSync(client: Socket, payload: TimerSyncPayload) {
    const roomId = payload?.roomId;
    if (!roomId || !isMeetingRoomId(roomId) || !this.validateTimerRequest(client, roomId)) return;

    const timerState = this.timerService.getTimerState(roomId);
    client.emit(TimerEventType.TIMER_STATE, timerState);
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

  @SubscribeMessage(KnockEventType.KNOCK_SEND)
  handleKnockSend(client: Socket, payload: KnockSendPayload) {
    const fromUser = this.userManager.getSession(client.id);
    const toUser = this.userManager.getSession(payload.targetUserId);

    if (!fromUser || !toUser) {
      client.emit("error", { message: "사용자를 찾을 수 없습니다." });
      return;
    }

    const { canKnock, reason } = this.knockService.canKnock(fromUser.deskStatus, toUser.deskStatus);

    if (!canKnock) {
      client.emit("error", { message: reason });
      return;
    }

    if (this.knockService.hasPendingKnock(client.id, payload.targetUserId)) {
      client.emit("error", { message: "이미 노크 요청을 보냈습니다." });
      return;
    }

    const knock = {
      fromUserId: client.id,
      fromUserNickname: fromUser.nickname,
      timestamp: Date.now(),
    };

    this.knockService.addPendingKnock(knock, payload.targetUserId);

    this.server.to(payload.targetUserId).emit(KnockEventType.KNOCK_RECEIVED, {
      fromUserId: client.id,
      fromUserNickname: fromUser.nickname,
      timestamp: knock.timestamp,
    });
  }

  @SubscribeMessage(KnockEventType.KNOCK_ACCEPT)
  handleKnockAccept(client: Socket, payload: KnockResponsePayload) {
    const toUser = this.userManager.getSession(client.id);
    const fromUser = this.userManager.getSession(payload.fromUserId);

    if (!toUser || !fromUser) {
      client.emit(KnockEventType.KNOCK_ACCEPT_FAILED, {
        fromUserId: payload.fromUserId,
        reason: "사용자를 찾을 수 없습니다.",
      });
      return;
    }

    const knock = this.knockService.getPendingKnock(payload.fromUserId, client.id);
    if (!knock) {
      client.emit(KnockEventType.KNOCK_ACCEPT_FAILED, {
        fromUserId: payload.fromUserId,
        reason: "노크 요청을 찾을 수 없습니다.",
      });
      return;
    }

    if (fromUser.deskStatus === "talking") {
      client.emit(KnockEventType.KNOCK_ACCEPT_FAILED, {
        fromUserId: payload.fromUserId,
        reason: "상대방이 이미 다른 대화 중입니다.",
      });
      this.knockService.removePendingKnock(payload.fromUserId, client.id);
      return;
    }

    this.knockService.removePendingKnock(payload.fromUserId, client.id);

    this.userManager.updateSessionDeskStatus(client.id, "talking");
    this.userManager.updateSessionDeskStatus(payload.fromUserId, "talking");

    this.knockService.addTalkingPair(client.id, payload.fromUserId);

    const contactId = [client.id, payload.fromUserId].sort().join("-");
    this.userManager.updateSessionContactId(client.id, contactId);
    this.userManager.updateSessionContactId(payload.fromUserId, contactId);

    this.server.to(payload.fromUserId).emit(KnockEventType.KNOCK_ACCEPTED, {
      targetUserId: client.id,
      targetUserNickname: toUser.nickname,
      status: "accepted",
    });

    client.emit(KnockEventType.KNOCK_ACCEPT_SUCCESS, {
      fromUserId: payload.fromUserId,
    });

    this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
      userId: client.id,
      status: "talking",
    });
    this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
      userId: payload.fromUserId,
      status: "talking",
    });

    const contactIdUpdates = {
      [client.id]: contactId,
      [payload.fromUserId]: contactId,
    };
    this.server.to("desk zone").emit(UserEventType.BOUNDARY_UPDATE, contactIdUpdates);
  }

  @SubscribeMessage(KnockEventType.KNOCK_REJECT)
  handleKnockReject(client: Socket, payload: KnockResponsePayload) {
    const toUser = this.userManager.getSession(client.id);
    const fromUser = this.userManager.getSession(payload.fromUserId);

    if (!fromUser) {
      this.knockService.removePendingKnock(payload.fromUserId, client.id);
      return;
    }

    this.knockService.removePendingKnock(payload.fromUserId, client.id);

    this.server.to(payload.fromUserId).emit(KnockEventType.KNOCK_REJECTED, {
      targetUserId: client.id,
      targetUserNickname: toUser?.nickname ?? "알 수 없음",
      status: "rejected",
    });
  }

  @SubscribeMessage(KnockEventType.DESK_STATUS_UPDATE)
  handleDeskStatusUpdate(client: Socket, payload: DeskStatusUpdatePayload) {
    const user = this.userManager.getSession(client.id);

    if (!user) {
      client.emit("error", { message: "사용자를 찾을 수 없습니다." });
      return;
    }
    if (user.avatar.currentRoomId !== "desk zone") {
      client.emit("error", { message: "데스크존에서만 상태를 변경할 수 있습니다." });
      return;
    }

    if (user.deskStatus === "talking" && payload.status !== "talking") {
      client.emit("error", { message: "대화 중에는 상태를 변경할 수 없습니다. 대화를 종료해주세요." });
      return;
    }

    this.userManager.updateSessionDeskStatus(client.id, payload.status);

    this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
      userId: client.id,
      status: payload.status,
    });
  }
  private endTalkIfNeeded(userId: string, userNickname: string, reason: "disconnected" | "left_deskzone"): void {
    const partnerId = this.knockService.removeTalkingPair(userId);

    if (!partnerId) return;

    const partner = this.userManager.getSession(partnerId);
    if (!partner) return;

    this.userManager.updateSessionDeskStatus(partnerId, "available");
    this.userManager.updateSessionContactId(partnerId, null);

    this.server.to(partnerId).emit(KnockEventType.TALK_ENDED, {
      partnerUserId: userId,
      partnerNickname: userNickname,
      reason,
    });

    this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
      userId: partnerId,
      status: "available",
    });

    this.server.to("desk zone").emit(UserEventType.BOUNDARY_UPDATE, {
      [partnerId]: null,
    });

    this.logger.log(`📞 대화 종료: ${userNickname} (${reason}) - 상대: ${partner.nickname}`);
  }

  @SubscribeMessage(KnockEventType.TALK_END)
  handleTalkEnd(client: Socket) {
    const user = this.userManager.getSession(client.id);

    if (!user) {
      client.emit("error", { message: "사용자를 찾을 수 없습니다." });
      return;
    }

    if (user.deskStatus !== "talking") {
      client.emit("error", { message: "현재 대화 중이 아닙니다." });
      return;
    }

    const partnerId = this.knockService.getTalkingPartner(client.id);
    if (!partnerId) {
      client.emit("error", { message: "대화 상대를 찾을 수 없습니다." });
      return;
    }

    const partner = this.userManager.getSession(partnerId);

    this.knockService.removeTalkingPair(client.id);

    this.userManager.updateSessionDeskStatus(client.id, "available");
    this.userManager.updateSessionDeskStatus(partnerId, "available");

    this.userManager.updateSessionContactId(client.id, null);
    this.userManager.updateSessionContactId(partnerId, null);

    this.server.to(partnerId).emit(KnockEventType.TALK_ENDED, {
      partnerUserId: client.id,
      partnerNickname: user.nickname,
      reason: "ended_by_user",
    });

    client.emit(KnockEventType.TALK_ENDED, {
      partnerUserId: partnerId,
      partnerNickname: partner?.nickname ?? "알 수 없음",
      reason: "ended_by_user",
    });

    this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
      userId: client.id,
      status: "available",
    });
    this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
      userId: partnerId,
      status: "available",
    });

    this.server.to("desk zone").emit(UserEventType.BOUNDARY_UPDATE, {
      [client.id]: null,
      [partnerId]: null,
    });

    this.logger.log(`📞 대화 종료 (사용자 요청): ${user.nickname} ↔ ${partner?.nickname}`);
  }
}
