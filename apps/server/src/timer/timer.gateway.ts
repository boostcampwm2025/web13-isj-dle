import { Logger } from "@nestjs/common";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import {
  RoomType,
  type TimerAddTimePayload,
  TimerEventType,
  type TimerPausePayload,
  type TimerResetPayload,
  type TimerStartPayload,
  type TimerSyncPayload,
} from "@shared/types";
import { Server, Socket } from "socket.io";

import { UserService } from "../user/user.service";
import { TimerService } from "./timer.service";

const isMeetingRoomId = (roomId: string): boolean => roomId.startsWith("meeting");

@WebSocketGateway()
export class TimerGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(TimerGateway.name);

  constructor(
    private readonly timerService: TimerService,
    private readonly userService: UserService,
  ) {}

  private validateTimerRequest(client: Socket, roomId: RoomType): boolean {
    const user = this.userService.getSession(client.id);
    if (!user) return false;

    return user.avatar.currentRoomId === roomId;
  }

  @SubscribeMessage(TimerEventType.TIMER_START)
  handleTimerStart(client: Socket, payload: TimerStartPayload) {
    const roomId = payload?.roomId;
    if (!roomId || !isMeetingRoomId(roomId) || !this.validateTimerRequest(client, roomId)) return;

    const timerState = this.timerService.startTimer(roomId, payload.initialTimeSec, payload.startedAt);
    this.server.to(roomId).emit(TimerEventType.TIMER_STATE, timerState);
  }

  @SubscribeMessage(TimerEventType.TIMER_PAUSE)
  handleTimerPause(client: Socket, payload: TimerPausePayload) {
    const roomId = payload?.roomId;
    if (!roomId || !isMeetingRoomId(roomId) || !this.validateTimerRequest(client, roomId)) return;

    const timerState = this.timerService.pauseTimer(roomId, payload.pausedTimeSec);
    this.server.to(roomId).emit(TimerEventType.TIMER_STATE, timerState);
  }

  @SubscribeMessage(TimerEventType.TIMER_RESET)
  handleTimerReset(client: Socket, payload: TimerResetPayload) {
    const roomId = payload?.roomId;
    if (!roomId || !isMeetingRoomId(roomId) || !this.validateTimerRequest(client, roomId)) return;

    const timerState = this.timerService.resetTimer(roomId);
    this.server.to(roomId).emit(TimerEventType.TIMER_STATE, timerState);
  }

  @SubscribeMessage(TimerEventType.TIMER_ADD_TIME)
  handleTimerAddTime(client: Socket, payload: TimerAddTimePayload) {
    const roomId = payload?.roomId;
    if (!roomId || !isMeetingRoomId(roomId) || !this.validateTimerRequest(client, roomId)) return;

    const timerState = this.timerService.addTime(roomId, payload.additionalSec);
    this.server.to(roomId).emit(TimerEventType.TIMER_STATE, timerState);
  }

  @SubscribeMessage(TimerEventType.TIMER_SYNC)
  handleTimerSync(client: Socket, payload: TimerSyncPayload) {
    const roomId = payload?.roomId;
    if (!roomId || !isMeetingRoomId(roomId) || !this.validateTimerRequest(client, roomId)) return;

    const timerState = this.timerService.getTimerState(roomId);
    client.emit(TimerEventType.TIMER_STATE, timerState);
  }
}
