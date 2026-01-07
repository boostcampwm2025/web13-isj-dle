import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { Server, Socket } from "socket.io";

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

  constructor(private readonly userManager: UserManager) {}

  afterInit() {
    this.logger.log("🚀 WebSocket Gateway initialized");
    this.logger.log(`📡 CORS origins: ${process.env.CLIENT_URL || "http://localhost:5173,http://localhost:3000"}`);
  }

  handleConnection(client: Socket) {
    this.logger.log(`✅ Client connected: ${client.id}`);
    this.logger.debug(`👥 Total clients: ${this.server.sockets.sockets.size}`);

    // 임시 contactId
    const contactId = `contact-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const user = this.userManager.createSession({
      id: client.id,
      contactId,
    });

    this.logger.log(`Game user created: ${user.nickname} (${user.avatar})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
    this.logger.debug(`👥 Total clients: ${this.server.sockets.sockets.size}`);
  }
}
