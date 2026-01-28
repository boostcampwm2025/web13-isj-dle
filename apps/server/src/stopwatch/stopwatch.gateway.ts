import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { RoomType, StopwatchEventType, type StopwatchSyncPayload, type StopwatchUpdatePayload } from "@shared/types";
import { Server, Socket } from "socket.io";

import { UserService } from "../user/user.service";
import { StopwatchService } from "./stopwatch.service";

const isMogakcoRoom = (roomId: string): boolean => roomId === "mogakco";

@WebSocketGateway()
export class StopwatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(StopwatchGateway.name);

  private readonly socketUserMap = new Map<string, { userId: string; roomId: RoomType }>();

  constructor(
    private readonly stopwatchService: StopwatchService,
    private readonly userService: UserService,
  ) {}

  private validateRequest(client: Socket, roomId: RoomType): boolean {
    const user = this.userService.getSession(client.id);
    if (!user) return false;

    return user.avatar.currentRoomId === roomId;
  }

  handleConnection(client: Socket) {
    const user = this.userService.getSession(client.id);
    if (user && user.avatar.currentRoomId && isMogakcoRoom(user.avatar.currentRoomId)) {
      this.socketUserMap.set(client.id, {
        userId: user.id,
        roomId: user.avatar.currentRoomId,
      });
      this.logger.log(`User ${user.id} (${user.nickname}) connected to ${user.avatar.currentRoomId}`);
    }
  }

  @SubscribeMessage(StopwatchEventType.STOPWATCH_UPDATE)
  handleStopwatchUpdate(client: Socket, payload: StopwatchUpdatePayload) {
    const roomId = payload?.roomId;
    if (!roomId || !isMogakcoRoom(roomId) || !this.validateRequest(client, roomId)) return;

    const user = this.userService.getSession(client.id);
    if (!user) return;

    this.socketUserMap.set(client.id, {
      userId: user.id,
      roomId: roomId,
    });

    const state = this.stopwatchService.updateUserState(
      roomId,
      user.id,
      user.nickname,
      payload.stopwatch,
      payload.timer,
    );

    this.server.to(roomId).emit(StopwatchEventType.STOPWATCH_STATE, state);
  }

  @SubscribeMessage(StopwatchEventType.STOPWATCH_SYNC)
  handleStopwatchSync(client: Socket, payload: StopwatchSyncPayload) {
    const roomId = payload?.roomId;
    if (!roomId || !isMogakcoRoom(roomId) || !this.validateRequest(client, roomId)) return;

    const state = this.stopwatchService.getRoomStates(roomId);
    client.emit(StopwatchEventType.STOPWATCH_STATE, state);
  }

  handleDisconnect(client: Socket) {
    const userInfo = this.socketUserMap.get(client.id);

    if (!userInfo) {
      return;
    }

    const { userId, roomId } = userInfo;

    if (!isMogakcoRoom(roomId)) {
      this.socketUserMap.delete(client.id);
      return;
    }

    this.logger.log(`User ${userId} disconnected from ${roomId}`);

    const state = this.stopwatchService.removeUser(roomId, userId);
    this.server.to(roomId).emit(StopwatchEventType.STOPWATCH_STATE, state);

    this.socketUserMap.delete(client.id);
  }

  handleUserLeft(roomId: RoomType, userId: string) {
    if (!isMogakcoRoom(roomId)) return;

    const state = this.stopwatchService.removeUser(roomId, userId);
    this.server.to(roomId).emit(StopwatchEventType.STOPWATCH_STATE, state);
  }
}
