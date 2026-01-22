import { Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import {
  type DeskStatusUpdatePayload,
  KnockEventType,
  type KnockResponsePayload,
  type KnockSendPayload,
  UserEventType,
} from "@shared/types";
import { Server, Socket } from "socket.io";

import { UserManager } from "../user/user-manager.service";
import { KnockService } from "./knock.service";

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL?.split(",") || ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
})
export class KnockGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(KnockGateway.name);

  constructor(
    private readonly knockService: KnockService,
    private readonly userManager: UserManager,
  ) {}

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

  @OnEvent("user.disconnecting")
  handleUserDisconnecting({ clientId, nickname }: { clientId: string; nickname: string }) {
    // 대화 종료 처리
    this.endTalkIfNeeded(clientId, nickname, "disconnected");

    // 모든 노크 제거
    const { sentTo, receivedFrom } = this.knockService.removeAllKnocksForUser(clientId);
    for (const targetUserId of sentTo) {
      this.server.to(targetUserId).emit(KnockEventType.KNOCK_CANCELLED, {
        fromUserId: clientId,
      });
    }
    for (const fromUserId of receivedFrom) {
      this.server.to(fromUserId).emit(KnockEventType.KNOCK_CANCELLED, {
        targetUserId: clientId,
      });
    }
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
