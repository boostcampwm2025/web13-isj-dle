import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import type { IncomingMessage } from "http";
import type { Server } from "http";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import { type WebSocket, WebSocketServer } from "ws";
import * as awarenessProtocol from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";
import * as Y from "yjs";

import { UserManager } from "../user/user-manager.service";

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const MESSAGE_QUERY_AWARENESS = 3;

@Injectable()
export class YjsService implements OnModuleDestroy {
  private readonly logger = new Logger(YjsService.name);

  private wss: WebSocketServer;

  private docs: Map<string, Y.Doc> = new Map();

  private rooms: Map<string, Set<WebSocket>> = new Map();

  private awarenessStates: Map<string, awarenessProtocol.Awareness> = new Map();

  constructor(private readonly userManager: UserManager) {
    this.wss = new WebSocketServer({ noServer: true });
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
    const awareness = this.getOrCreateAwareness(roomName, doc);

    this.sendSyncStep1(ws, doc);

    this.sendAwarenessState(ws, awareness);

    ws.on("message", (data: Buffer) => {
      this.handleMessage(roomName, ws, doc, awareness, data);
    });

    ws.on("close", () => {
      this.logger.log(`❌ Client disconnected from Yjs room: ${roomName}`);
      this.removeClientFromRoom(roomName, ws, awareness);
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
      doc.on("update", (update: Uint8Array, origin: unknown) => {
        this.broadcastUpdate(roomName, update, origin as WebSocket | undefined);
      });
    }

    return doc;
  }

  private getOrCreateAwareness(roomName: string, doc: Y.Doc): awarenessProtocol.Awareness {
    let awareness = this.awarenessStates.get(roomName);

    if (!awareness) {
      awareness = new awarenessProtocol.Awareness(doc);
      this.awarenessStates.set(roomName, awareness);

      awareness.on(
        "update",
        ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
          const changedClients = [...added, ...updated, ...removed];
          if (changedClients.length > 0) {
            const encodedAwareness = awarenessProtocol.encodeAwarenessUpdate(awareness!, changedClients);
            this.broadcastAwareness(roomName, encodedAwareness, origin as WebSocket | undefined);
          }
        },
      );
    }

    return awareness;
  }

  private addClientToRoom(roomName: string, ws: WebSocket): void {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName)!.add(ws);
  }

  private removeClientFromRoom(roomName: string, ws: WebSocket, _awareness: awarenessProtocol.Awareness): void {
    const room = this.rooms.get(roomName);
    if (room) {
      room.delete(ws);

      if (room.size === 0) {
        this.rooms.delete(roomName);
      }
    }
  }

  private handleMessage(
    roomName: string,
    ws: WebSocket,
    doc: Y.Doc,
    awareness: awarenessProtocol.Awareness,
    data: Buffer,
  ): void {
    try {
      const message = new Uint8Array(data);
      const decoder = decoding.createDecoder(message);
      const encoder = encoding.createEncoder();
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC: {
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, doc, ws);

          if (encoding.length(encoder) > 1) {
            ws.send(encoding.toUint8Array(encoder));
          }
          break;
        }

        case MESSAGE_AWARENESS: {
          awarenessProtocol.applyAwarenessUpdate(awareness, decoding.readVarUint8Array(decoder), ws);
          break;
        }

        case MESSAGE_QUERY_AWARENESS: {
          const clients = Array.from(awareness.getStates().keys());
          if (clients.length > 0) {
            const awarenessEncoder = encoding.createEncoder();
            encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
            encoding.writeVarUint8Array(awarenessEncoder, awarenessProtocol.encodeAwarenessUpdate(awareness, clients));
            ws.send(encoding.toUint8Array(awarenessEncoder));
          }
          break;
        }

        default:
          this.logger.warn(`Unknown message type: ${messageType}`);
      }
    } catch (error) {
      this.logger.error(`Error handling message in room ${roomName}:`, error);
    }
  }

  private sendSyncStep1(ws: WebSocket, doc: Y.Doc): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(encoder, doc);
    ws.send(encoding.toUint8Array(encoder));
  }

  private sendAwarenessState(ws: WebSocket, awareness: awarenessProtocol.Awareness): void {
    const clients = Array.from(awareness.getStates().keys());
    if (clients.length > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, clients));
      ws.send(encoding.toUint8Array(encoder));
    }
  }

  private broadcastUpdate(roomName: string, update: Uint8Array, origin?: WebSocket): void {
    const room = this.rooms.get(roomName);
    if (!room) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);

    room.forEach((client) => {
      if (client !== origin && client.readyState === 1) {
        client.send(message);
      }
    });
  }

  private broadcastAwareness(roomName: string, awarenessUpdate: Uint8Array, origin?: WebSocket): void {
    const room = this.rooms.get(roomName);
    if (!room) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(encoder, awarenessUpdate);
    const message = encoding.toUint8Array(encoder);

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
    this.awarenessStates.forEach((awareness) => awareness.destroy());
    this.awarenessStates.clear();
    this.rooms.clear();
    this.logger.log("🛑 Yjs WebSocket Server closed");
  }

  @OnEvent("user.leaving-room")
  handleUserLeavingRoom(payload: { roomId: string }): void {
    const { roomId } = payload;

    setTimeout(() => {
      const usersInRoom = this.userManager.getRoomSessions(roomId as any);

      if (usersInRoom.length === 0) {
        const sanitizedRoomId = roomId.replace(/[\s()]/g, "-");
        const yjsRoomName = `code-editor-${sanitizedRoomId}`;

        this.cleanupRoom(yjsRoomName);
      }
    }, 100);
  }

  private cleanupRoom(roomName: string): void {
    const doc = this.docs.get(roomName);
    if (doc) {
      doc.destroy();
      this.docs.delete(roomName);
    }

    const awareness = this.awarenessStates.get(roomName);
    if (awareness) {
      awareness.destroy();
      this.awarenessStates.delete(roomName);
    }

    this.rooms.delete(roomName);
  }
}
