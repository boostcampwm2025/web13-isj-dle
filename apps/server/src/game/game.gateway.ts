import { Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { UserEventType } from "@shared/types";
import { Server, Socket } from "socket.io";
import { BoundaryService } from "src/boundary/boundary.service";
import { BoundaryTracker } from "src/boundary/boundaryTracker.service";

import { MetricsService } from "../metrics";
import { UserInternalEvent } from "../user/user-event.types";
import { UserManager } from "../user/user-manager.service";

const BOUNDARY_TICK_MS = 100;

@WebSocketGateway()
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(GameGateway.name);

  private boundaryTick: NodeJS.Timeout | null = null;

  constructor(
    private readonly userManager: UserManager,
    private readonly boundaryService: BoundaryService,
    private readonly boundaryTracker: BoundaryTracker,
    private readonly eventEmitter: EventEmitter2,
    private readonly metricsService: MetricsService,
  ) {}

  afterInit() {
    this.logger.log("🚀 WebSocket Gateway initialized");
    this.logger.log(`📡 CORS origins: ${process.env.CLIENT_URL || "http://localhost:5173,http://localhost:3000"}`);

    this.server.setMaxListeners(20);

    this.boundaryTick = setInterval(() => {
      this.runBoundaryTick();
    }, BOUNDARY_TICK_MS);
  }

  async handleConnection(client: Socket) {
    try {
      client.setMaxListeners(20);

      const user = this.userManager.createSession({ id: client.id });

      if (!user) {
        this.logger.error(`Failed to create session for client: ${client.id}`);
        client.disconnect();
        return;
      }

      this.metricsService.incrementWsConnections();
      this.logger.log(`✅ Client connected: ${client.id} ${user.nickname} (${user.avatar.assetKey})`);

      await client.join(user.avatar.currentRoomId);
      client.emit(UserEventType.USER_SYNC, { user, users: this.userManager.getAllSessions() });
      client.broadcast.emit(UserEventType.USER_JOIN, { user });
    } catch (err) {
      this.logger.error(`Failed to handle connection: ${client.id}`, err instanceof Error ? err.stack : String(err));
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const user = this.userManager.getSession(client.id);
      const nickname = user?.nickname ?? "알 수 없음";
      const previousRoomId = user?.avatar.currentRoomId;

      this.boundaryTracker.clear(client.id);

      this.eventEmitter.emit(UserInternalEvent.DISCONNECTING, { clientId: client.id, nickname });

      const deleted = this.userManager.deleteSession(client.id);
      if (!deleted) {
        this.logger.warn(`Session not found for disconnected client: ${client.id}`);
      }

      this.metricsService.decrementWsConnections();
      this.logger.log(`❌ Client disconnected: ${client.id}`);

      client.broadcast.emit(UserEventType.USER_LEFT, { userId: client.id });

      if (previousRoomId) {
        this.eventEmitter.emit(UserInternalEvent.LEAVING_ROOM, { roomId: previousRoomId });
      }
    } catch (err) {
      this.logger.error(`Error during disconnect for ${client.id}`, err instanceof Error ? err.stack : String(err));
    }
  }

  @SubscribeMessage("internal:boundary-clear")
  handleBoundaryClear(client: Socket, payload: { userId: string }) {
    this.boundaryTracker.clear(payload.userId);
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
}
