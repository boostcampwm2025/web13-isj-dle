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

import { type UserDisconnectingPayload, UserInternalEvent } from "../user/user-event.types";
import { UserService } from "../user/user.service";
import { KnockService } from "./knock.service";

@WebSocketGateway()
export class KnockGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(KnockGateway.name);

  constructor(
    private readonly knockService: KnockService,
    private readonly userService: UserService,
  ) {}

  @SubscribeMessage(KnockEventType.KNOCK_SEND)
  handleKnockSend(client: Socket, payload: KnockSendPayload) {
    const fromUser = this.userService.getSession(client.id);
    const toUser = this.userService.getSession(payload.targetSocketId);

    if (!fromUser || !toUser) {
      client.emit("error", { message: "사용자를 찾을 수 없습니다." });
      return;
    }

    const { canKnock, reason } = this.knockService.canKnock(fromUser.deskStatus, toUser.deskStatus);

    if (!canKnock) {
      client.emit("error", { message: reason });
      return;
    }

    if (this.knockService.hasPendingKnock(client.id, payload.targetSocketId)) {
      client.emit("error", { message: "이미 노크 요청을 보냈습니다." });
      return;
    }

    const knock = {
      fromSocketId: client.id,
      fromUserNickname: fromUser.nickname,
      timestamp: Date.now(),
    };

    this.knockService.addPendingKnock(knock, payload.targetSocketId);

    this.server.to(payload.targetSocketId).emit(KnockEventType.KNOCK_RECEIVED, {
      fromSocketId: client.id,
      fromUserNickname: fromUser.nickname,
      timestamp: knock.timestamp,
    });
  }

  @SubscribeMessage(KnockEventType.KNOCK_ACCEPT)
  handleKnockAccept(client: Socket, payload: KnockResponsePayload) {
    const toUser = this.userService.getSession(client.id);
    const fromUser = this.userService.getSession(payload.fromSocketId);

    if (!toUser || !fromUser) {
      client.emit(KnockEventType.KNOCK_ACCEPT_FAILED, {
        fromSocketId: payload.fromSocketId,
        reason: "사용자를 찾을 수 없습니다.",
      });
      return;
    }

    const knock = this.knockService.getPendingKnock(payload.fromSocketId, client.id);
    if (!knock) {
      client.emit(KnockEventType.KNOCK_ACCEPT_FAILED, {
        fromSocketId: payload.fromSocketId,
        reason: "노크 요청을 찾을 수 없습니다.",
      });
      return;
    }

    if (fromUser.deskStatus === "talking") {
      client.emit(KnockEventType.KNOCK_ACCEPT_FAILED, {
        fromSocketId: payload.fromSocketId,
        reason: "상대방이 이미 다른 대화 중입니다.",
      });
      this.knockService.removePendingKnock(payload.fromSocketId, client.id);
      return;
    }

    this.knockService.removePendingKnock(payload.fromSocketId, client.id);

    const hasPairKnock = this.knockService.hasPendingKnock(client.id, payload.fromSocketId);
    if (hasPairKnock) {
      this.knockService.removePendingKnock(client.id, payload.fromSocketId);
      this.server.to(payload.fromSocketId).emit(KnockEventType.KNOCK_CANCELLED, {
        fromSocketId: client.id,
      });
    }

    this.userService.updateSessionDeskStatus(client.id, "talking");
    this.userService.updateSessionDeskStatus(payload.fromSocketId, "talking");

    this.knockService.addTalkingPair(client.id, payload.fromSocketId);

    const contactId = [client.id, payload.fromSocketId].sort().join("-");
    this.userService.updateSessionContactId(client.id, contactId);
    this.userService.updateSessionContactId(payload.fromSocketId, contactId);

    this.server.to(payload.fromSocketId).emit(KnockEventType.KNOCK_ACCEPTED, {
      targetSocketId: client.id,
      targetUserNickname: toUser.nickname,
      status: "accepted",
    });

    client.emit(KnockEventType.KNOCK_ACCEPT_SUCCESS, {
      fromSocketId: payload.fromSocketId,
    });

    this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
      socketId: client.id,
      status: "talking",
    });
    this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
      socketId: payload.fromSocketId,
      status: "talking",
    });

    const contactIdUpdates = {
      [client.id]: contactId,
      [payload.fromSocketId]: contactId,
    };
    this.server.to("desk zone").emit(UserEventType.BOUNDARY_UPDATE, contactIdUpdates);
  }

  @SubscribeMessage(KnockEventType.KNOCK_REJECT)
  handleKnockReject(client: Socket, payload: KnockResponsePayload) {
    const toUser = this.userService.getSession(client.id);
    const fromUser = this.userService.getSession(payload.fromSocketId);

    if (!fromUser) {
      this.knockService.removePendingKnock(payload.fromSocketId, client.id);
      return;
    }

    this.knockService.removePendingKnock(payload.fromSocketId, client.id);

    this.server.to(payload.fromSocketId).emit(KnockEventType.KNOCK_REJECTED, {
      targetSocketId: client.id,
      targetUserNickname: toUser?.nickname ?? "알 수 없음",
      status: "rejected",
    });
  }

  @SubscribeMessage(KnockEventType.DESK_STATUS_UPDATE)
  handleDeskStatusUpdate(client: Socket, payload: DeskStatusUpdatePayload) {
    const user = this.userService.getSession(client.id);

    if (!user) {
      client.emit("error", { message: "사용자를 찾을 수 없습니다." });
      return;
    }

    if (user.deskStatus === "talking" && payload.status !== "talking") {
      client.emit("error", { message: "대화 중에는 상태를 변경할 수 없습니다. 대화를 종료해주세요." });
      return;
    }

    this.userService.updateSessionDeskStatus(client.id, payload.status);

    this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
      socketId: client.id,
      status: payload.status,
    });
  }

  @SubscribeMessage(KnockEventType.TALK_END)
  handleTalkEnd(client: Socket) {
    const user = this.userService.getSession(client.id);

    if (!user) {
      client.emit("error", { message: "사용자를 찾을 수 없습니다." });
      return;
    }

    if (user.deskStatus !== "talking") {
      client.emit("error", { message: "현재 대화 중이 아닙니다." });
      return;
    }

    const partnerSocketId = this.knockService.getTalkingPartner(client.id);
    if (!partnerSocketId) {
      client.emit("error", { message: "대화 상대를 찾을 수 없습니다." });
      return;
    }

    const partner = this.userService.getSession(partnerSocketId);

    this.knockService.removeTalkingPair(client.id);

    this.userService.updateSessionDeskStatus(client.id, "available");
    this.userService.updateSessionDeskStatus(partnerSocketId, "available");

    this.userService.updateSessionContactId(client.id, null);
    this.userService.updateSessionContactId(partnerSocketId, null);

    this.server.to(partnerSocketId).emit(KnockEventType.TALK_ENDED, {
      partnerSocketId: client.id,
      partnerNickname: user.nickname,
      reason: "ended_by_user",
    });

    client.emit(KnockEventType.TALK_ENDED, {
      partnerSocketId,
      partnerNickname: partner?.nickname ?? "알 수 없음",
      reason: "ended_by_user",
    });

    this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
      socketId: client.id,
      status: "available",
    });
    this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
      socketId: partnerSocketId,
      status: "available",
    });

    this.server.to("desk zone").emit(UserEventType.BOUNDARY_UPDATE, {
      [client.id]: null,
      [partnerSocketId]: null,
    });

    this.logger.log(`📞 대화 종료 (사용자 요청): ${user.nickname} ↔ ${partner?.nickname}`);
  }

  @OnEvent(UserInternalEvent.DISCONNECTING)
  handleUserDisconnecting({ clientId, nickname }: UserDisconnectingPayload) {
    this.endTalkIfNeeded(clientId, nickname, "disconnected");

    const { sentTo, receivedFrom } = this.knockService.removeAllKnocksForUser(clientId);
    for (const targetSocketId of sentTo) {
      this.server.to(targetSocketId).emit(KnockEventType.KNOCK_CANCELLED, {
        fromSocketId: clientId,
      });
    }
    for (const fromSocketId of receivedFrom) {
      this.server.to(fromSocketId).emit(KnockEventType.KNOCK_CANCELLED, {
        targetSocketId: clientId,
      });
    }
  }

  private endTalkIfNeeded(socketId: string, userNickname: string, reason: "disconnected" | "left_desk_zone"): void {
    const partnerSocketId = this.knockService.removeTalkingPair(socketId);

    if (!partnerSocketId) return;

    const partner = this.userService.getSession(partnerSocketId);
    if (!partner) return;

    this.userService.updateSessionDeskStatus(partnerSocketId, "available");
    this.userService.updateSessionContactId(partnerSocketId, null);

    this.server.to(partnerSocketId).emit(KnockEventType.TALK_ENDED, {
      partnerSocketId: socketId,
      partnerNickname: userNickname,
      reason,
    });

    this.server.to("desk zone").emit(KnockEventType.DESK_STATUS_UPDATED, {
      socketId: partnerSocketId,
      status: "available",
    });

    this.server.to("desk zone").emit(UserEventType.BOUNDARY_UPDATE, {
      [partnerSocketId]: null,
    });

    this.logger.log(`📞 대화 종료: ${userNickname} (${reason}) - 상대: ${partner.nickname}`);
  }
}
