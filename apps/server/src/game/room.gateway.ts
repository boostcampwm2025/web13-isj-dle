import { Logger } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import { KnockEventType, RoomEventType, type RoomJoinPayload, RoomType, UserEventType } from "@shared/types";
import { Server, Socket } from "socket.io";

import { KnockService } from "../knock/knock.service";
import { StopwatchGateway } from "../stopwatch/stopwatch.gateway";
import { TimerService } from "../timer/timer.service";
import { UserInternalEvent, type UserLeavingRoomPayload } from "../user/user-event.types";
import { UserService } from "../user/user.service";

const isMeetingRoom = (roomId: RoomType): boolean => roomId.startsWith("meeting");
const isMogakcoRoom = (roomId: RoomType): boolean => roomId === "mogakco";

@WebSocketGateway()
export class RoomGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RoomGateway.name);

  constructor(
    private readonly userService: UserService,
    private readonly knockService: KnockService,
    private readonly timerService: TimerService,
    private readonly stopwatchGateway: StopwatchGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @SubscribeMessage(RoomEventType.ROOM_JOIN)
  async handleRoomJoin(client: Socket, payload: RoomJoinPayload, ack?: (res: any) => void) {
    if (!payload || !payload.roomId) {
      this.logger.warn(`⚠️ ROOM_JOIN called without roomId from client: ${client.id}`);
      ack?.({ success: false });
      return;
    }

    try {
      const user = this.userService.getSession(client.id);
      if (!user) {
        this.logger.error(`❌ User session not found for client: ${client.id}`);
        client.emit("error", { message: "User session not found" });
        ack?.({ success: false });
        return;
      }

      const previousRoomId = user.avatar.currentRoomId;

      if (previousRoomId === "desk zone" && payload.roomId !== "desk zone") {
        this.endTalkIfNeeded(client.id, user.nickname, "left_desk_zone");

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

        this.userService.updateSessionDeskStatus(client.id, null);
      }

      const updated = this.userService.updateSessionRoom(client.id, payload.roomId);
      if (!updated) {
        this.logger.error(`❌ Failed to update room for user: ${client.id}`);
        ack?.({ success: false });
        return;
      }

      this.userService.updateSessionContactId(client.id, null);

      if (previousRoomId === "lobby") {
        this.server.emit("internal:boundary-clear", { userId: client.id });
        this.userService.updateSessionContactId(client.id, null);
      }

      await client.leave(previousRoomId);
      await client.join(payload.roomId);

      this.eventEmitter.emit(UserInternalEvent.LEAVING_ROOM, { roomId: previousRoomId });

      this.cleanupTimerAfterLeave(previousRoomId);
      this.cleanupStopwatchAfterLeave(previousRoomId, client.id);

      const updatedUser = this.userService.getSession(client.id);
      if (!updatedUser) return;

      this.server.emit(RoomEventType.ROOM_JOINED, {
        userId: client.id,
        avatar: updatedUser.avatar,
      });

      client.emit(UserEventType.USER_SYNC, {
        user: updatedUser,
        users: this.userService.getAllSessions(),
      });

      if (payload.roomId === "desk zone") {
        this.userService.updateSessionDeskStatus(client.id, "available");

        this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
          userId: client.id,
          status: "available",
        });

        const deskzoneUsers = this.userService.getRoomSessions("desk zone");
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

  @OnEvent(UserInternalEvent.LEAVING_ROOM)
  handleUserLeavingRoom({ roomId }: UserLeavingRoomPayload) {
    this.cleanupTimerAfterLeave(roomId);
  }

  private cleanupTimerAfterLeave(roomId: RoomType) {
    if (!isMeetingRoom(roomId)) return;

    const remaining = this.userService.getRoomSessions(roomId).length;
    if (remaining !== 0) return;

    this.timerService.deleteTimer(roomId);
  }

  private cleanupStopwatchAfterLeave(roomId: RoomType, userId: string) {
    if (isMogakcoRoom(roomId)) {
      this.stopwatchGateway.handleUserLeft(roomId, userId);
      return;
    }

    if (isMeetingRoom(roomId)) {
      const remaining = this.userService.getRoomSessions(roomId).length;
      if (remaining === 0) {
        this.stopwatchGateway.handleMeetingRoomEmpty(roomId);
      }
    }
  }

  private endTalkIfNeeded(userId: string, userNickname: string, reason: "disconnected" | "left_desk_zone"): void {
    const partnerId = this.knockService.removeTalkingPair(userId);

    if (!partnerId) return;

    const partner = this.userService.getSession(partnerId);
    if (!partner) return;

    this.userService.updateSessionDeskStatus(partnerId, "available");
    this.userService.updateSessionContactId(partnerId, null);

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
}
