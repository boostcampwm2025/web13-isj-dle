import { Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import { KnockEventType, RoomEventType, type RoomJoinPayload, RoomType, UserEventType } from "@shared/types";
import { Server, Socket } from "socket.io";

import { KnockService } from "../knock/knock.service";
import { TimerService } from "../timer/timer.service";
import { UserManager } from "../user/user-manager.service";

const isTimerRoomId = (roomId: RoomType): boolean => roomId.startsWith("meeting");

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL?.split(",") || ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
})
export class RoomGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RoomGateway.name);

  constructor(
    private readonly userManager: UserManager,
    private readonly knockService: KnockService,
    private readonly timerService: TimerService,
  ) {}

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

      // desk zone을 떠날 때 대화 종료 및 노크 정리
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

        this.userManager.updateSessionDeskStatus(client.id, null);
      }

      const updated = this.userManager.updateSessionRoom(client.id, payload.roomId);
      if (!updated) {
        this.logger.error(`❌ Failed to update room for user: ${client.id}`);
        ack?.({ success: false });
        return;
      }

      this.userManager.updateSessionContactId(client.id, null);

      // 로비를 떠날 때 boundary 추적 정리
      if (previousRoomId === "lobby") {
        // BoundaryTracker 정리는 이벤트로 알림
        this.server.emit("internal:boundary-clear", { userId: client.id });
        this.userManager.updateSessionContactId(client.id, null);
      }

      await client.leave(previousRoomId);
      await client.join(payload.roomId);

      // 이전 방의 타이머 정리
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

      // desk zone 입장 시 상태 초기화
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

  @OnEvent("user.leaving-room")
  handleUserLeavingRoom({ roomId }: { roomId: RoomType }) {
    this.cleanupTimerAfterLeave(roomId);
  }

  private cleanupTimerAfterLeave(roomId: RoomType) {
    if (!isTimerRoomId(roomId)) return;

    const remaining = this.userManager.getRoomSessions(roomId).length;
    if (remaining !== 0) return;

    this.timerService.deleteTimer(roomId);
  }

  private endTalkIfNeeded(userId: string, userNickname: string, reason: "disconnected" | "left_desk_zone"): void {
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
}
