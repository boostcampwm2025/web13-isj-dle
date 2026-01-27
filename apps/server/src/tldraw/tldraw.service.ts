import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { TLSocketRoom } from "@tldraw/sync-core";
import { createTLSchema, defaultBindingSchemas, defaultShapeSchemas } from "@tldraw/tlschema";
import { IncomingMessage, Server } from "http";
import { RawData, WebSocket, WebSocketServer } from "ws";

import { UserManager } from "../user/user-manager.service";

@Injectable()
export class TldrawService implements OnModuleDestroy {
  private readonly logger = new Logger(TldrawService.name);
  private readonly wss = new WebSocketServer({ noServer: true });

  private schema = createTLSchema({
    shapes: {
      ...defaultShapeSchemas,
    },
    bindings: defaultBindingSchemas,
  });
  private rooms = new Map<string, TLSocketRoom>();

  constructor(private readonly userManager: UserManager) {}

  attachToServer(server: Server) {
    server.on("upgrade", (req: IncomingMessage, socket, head) => {
      const url = new URL(req.url ?? "", `http://${req.headers.host}`);

      if (url.pathname.startsWith("/tldraw/")) {
        this.wss.handleUpgrade(req, socket, head, (ws) => {
          this.handleConnection(ws, url);
        });
      }
    });

    this.logger.log("🔗 Tldraw WebSocket attached to HTTP server on /tldraw path");
  }

  private handleConnection(ws: WebSocket, url: URL): void {
    const rawRoomId = url.pathname.replace("/tldraw/", "") || "default";
    const roomId = decodeURIComponent(rawRoomId);
    const sessionId = crypto.randomUUID();

    const room = this.getOrCreateRoom(roomId);
    let isConnected = true;

    const closeHandler = () => {
      if (!isConnected) return;
      this.logger.log(`❌ Client disconnected from tldraw room: ${roomId}`);
      isConnected = false;
      room.handleSocketClose(sessionId);
      cleanup();
      try {
        ws.terminate();
      } catch {
        /* empty */
      }
    };

    const errorHandler = (error: Error) => {
      if (!isConnected) return;
      isConnected = false;
      this.logger.error(`WebSocket error in tldraw room: ${roomId}`, error.message);
      room.handleSocketError(sessionId);
      cleanup();
      ws.terminate();
    };

    const cleanup = () => {
      ws.off("close", closeHandler);
      ws.off("error", errorHandler);
    };

    ws.on("close", closeHandler);
    ws.on("error", errorHandler);

    const originalSend = ws.send.bind(ws) as WebSocket["send"];

    ws.send = ((
      data: RawData,
      options: {
        mask?: boolean | undefined;
        binary?: boolean | undefined;
        compress?: boolean | undefined;
        fin?: boolean | undefined;
      },
      cb?: (err?: Error) => void,
    ) => {
      if (isConnected && ws.readyState === WebSocket.OPEN) {
        originalSend(data, options, cb);
      }
    }) as WebSocket["send"];

    room.handleSocketConnect({
      sessionId,
      socket: ws,
      isReadonly: false,
    });

    this.logger.log(`✅ Client connected to tldraw room: ${roomId}`);
  }

  private getOrCreateRoom(roomId: string): TLSocketRoom {
    const existing = this.rooms.get(roomId);
    if (existing) return existing;

    const room = new TLSocketRoom({
      schema: this.schema,
    });

    this.rooms.set(roomId, room);
    return room;
  }

  @OnEvent("user.leaving-room")
  handleUserLeavingRoom(payload: { roomId: string }): void {
    const { roomId } = payload;

    setTimeout(() => {
      const usersInRoom = this.userManager.getRoomSessions(roomId as any);

      if (usersInRoom.length === 0) {
        this.cleanupRoom(roomId);
      }
    }, 100);
  }

  private cleanupRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.close();
      this.rooms.delete(roomId);
    }
  }

  onModuleDestroy() {
    this.wss.close();
    this.rooms.forEach((r) => r.close());
    this.rooms.clear();
  }
}
