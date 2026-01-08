import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { NoticeEventType } from "@shared/types";
import { Server, Socket } from "socket.io";
import { NoticeService } from "src/notice/notice.service";

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL?.split(",") || ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(GameGateway.name);

  constructor(private readonly noticeService: NoticeService) {}

  afterInit() {
    this.logger.log("🚀 WebSocket Gateway initialized");
    this.logger.log(`📡 CORS origins: ${process.env.CLIENT_URL || "http://localhost:5173,http://localhost:3000"}`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`✅ Client connected: ${client.id}`);
    this.logger.debug(`👥 Total clients: ${this.server.sockets.sockets.size}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
    this.logger.debug(`👥 Total clients: ${this.server.sockets.sockets.size}`);
  }

  @SubscribeMessage(NoticeEventType.NOTICE_SYNC)
  async handleNoticeSync(client: Socket, payload: { roomId: string }) {
    if (!payload.roomId) {
      this.logger.warn(`⚠️ NOTICE_SYNC called without roomId from client: ${client.id}`);
      return;
    }
    const notices = await this.noticeService.findByRoomId(payload.roomId);
    this.logger.log(`${payload.roomId} notice count: ${notices.length}`);
    client.emit(NoticeEventType.NOTICE_SYNC, notices);
  }
}
