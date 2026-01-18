import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";

import type { IncomingMessage } from "http";
import type { Server } from "http";
import { type WebSocket, WebSocketServer } from "ws";
import * as Y from "yjs";

@Injectable()
export class YjsService implements OnModuleDestroy {
  private readonly logger = new Logger(YjsService.name);

  private wss: WebSocketServer;

  private docs: Map<string, Y.Doc> = new Map();

  private rooms: Map<string, Set<WebSocket>> = new Map();

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });
    this.logger.log("📝 Yjs WebSocket Server initialized (noServer mode)");
  }

  attachToServer(server: Server): void {
    server.on("upgrade", (request: IncomingMessage, socket, head) => {
      const url = new URL(request.url || "", `http://${request.headers.host}`);
      const pathname = url.pathname;

      if (pathname.startsWith("/yjs/")) {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.handleConnection(ws, pathname);
        });
      }
    });

    this.logger.log("🔗 Yjs WebSocket attached to HTTP server on /yjs path");
  }

  private handleConnection(ws: WebSocket, pathname: string): void {
    const roomName = pathname.replace(/^\/yjs\//, "") || "default";

    this.logger.log(`✅ Client connected to Yjs room: ${roomName}`);

    this.addClientToRoom(roomName, ws);

    const doc = this.getOrCreateDoc(roomName);

    this.sendSyncStep1(ws, doc);

    ws.on("message", (data: Buffer) => {
      this.handleMessage(roomName, ws, doc, data);
    });

    ws.on("close", () => {
      this.logger.log(`❌ Client disconnected from Yjs room: ${roomName}`);
      this.removeClientFromRoom(roomName, ws);
    });

    ws.on("error", (error) => {
      this.logger.error(`WebSocket error in room ${roomName}:`, error);
    });
  }

  private getOrCreateDoc(roomName: string): Y.Doc {
    let doc = this.docs.get(roomName);

    if (!doc) {
      doc = new Y.Doc();
      this.docs.set(roomName, doc);
      this.logger.log(`📄 Created new Y.Doc for room: ${roomName}`);

      doc.on("update", (update: Uint8Array, origin: unknown) => {
        this.broadcastUpdate(roomName, update, origin as WebSocket | undefined);
      });
    }

    return doc;
  }

  private addClientToRoom(roomName: string, ws: WebSocket): void {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName)!.add(ws);
  }

  private removeClientFromRoom(roomName: string, ws: WebSocket): void {
    const room = this.rooms.get(roomName);
    if (room) {
      room.delete(ws);

      if (room.size === 0) {
        this.rooms.delete(roomName);
        const doc = this.docs.get(roomName);
        if (doc) {
          doc.destroy();
          this.docs.delete(roomName);
          this.logger.log(`🗑️ Cleaned up Y.Doc for empty room: ${roomName}`);
        }
      }
    }
  }

  private readonly MESSAGE_SYNC_STEP1 = 0;
  private readonly MESSAGE_SYNC_STEP2 = 1;
  private readonly MESSAGE_UPDATE = 2;
  private readonly MESSAGE_AWARENESS = 3;

  private handleMessage(roomName: string, ws: WebSocket, doc: Y.Doc, data: Buffer): void {
    const message = new Uint8Array(data);

    if (message.length === 0) return;

    const messageType = message[0];
    const payload = message.slice(1);

    switch (messageType) {
      case this.MESSAGE_SYNC_STEP1:
        this.handleSyncStep1(ws, doc, payload);
        break;

      case this.MESSAGE_UPDATE:
        Y.applyUpdate(doc, payload, ws);
        break;

      case this.MESSAGE_AWARENESS:
        this.broadcastAwareness(roomName, message, ws);
        break;

      case this.MESSAGE_SYNC_STEP2:
        this.logger.warn(`Received unexpected message of type SYNC_STEP_2 from a client in room ${roomName}`);
        break;
    }
  }

  private sendSyncStep1(ws: WebSocket, doc: Y.Doc): void {
    const stateVector = Y.encodeStateVector(doc);
    const message = new Uint8Array([this.MESSAGE_SYNC_STEP1, ...stateVector]);
    ws.send(message);
  }
  private handleSyncStep1(ws: WebSocket, doc: Y.Doc, stateVector: Uint8Array): void {
    const diff = Y.encodeStateAsUpdate(doc, stateVector);
    const message = new Uint8Array([this.MESSAGE_SYNC_STEP2, ...diff]);
    ws.send(message);
  }

  private broadcastUpdate(roomName: string, update: Uint8Array, origin?: WebSocket): void {
    const room = this.rooms.get(roomName);
    if (!room) return;

    const message = new Uint8Array([this.MESSAGE_UPDATE, ...update]);

    room.forEach((client) => {
      if (client !== origin && client.readyState === 1) {
        client.send(message);
      }
    });
  }

  private broadcastAwareness(roomName: string, message: Uint8Array, origin: WebSocket): void {
    const room = this.rooms.get(roomName);
    if (!room) return;

    room.forEach((client) => {
      if (client !== origin && client.readyState === 1) {
        client.send(message);
      }
    });
  }

  onModuleDestroy(): void {
    this.wss.close();
    this.docs.forEach((doc) => doc.destroy());
    this.docs.clear();
    this.rooms.clear();
    this.logger.log("🛑 Yjs WebSocket Server closed");
  }
}
