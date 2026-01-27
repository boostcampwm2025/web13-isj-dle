import { Injectable } from "@nestjs/common";

import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter, Gauge, Histogram } from "prom-client";

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric("websocket_connections_active")
    private wsConnectionsGauge: Gauge<string>,

    @InjectMetric("users_online_total")
    private usersOnlineGauge: Gauge<string>,

    @InjectMetric("users_online_by_room")
    private usersByRoomGauge: Gauge<string>,

    @InjectMetric("chat_messages_total")
    private chatMessagesCounter: Counter<string>,

    @InjectMetric("rooms_active_total")
    private roomsActiveGauge: Gauge<string>,

    @InjectMetric("http_request_duration_seconds")
    private httpDurationHistogram: Histogram<string>,
  ) {}

  incrementWsConnections() {
    this.wsConnectionsGauge.inc();
  }

  decrementWsConnection() {
    this.wsConnectionsGauge.dec();
  }

  setOnlineUsers(count: number) {
    this.usersOnlineGauge.set(count);
  }

  setUsersByRoom(roomType: string, count: number) {
    this.usersByRoomGauge.labels(roomType).set(count);
  }

  incrementChatMessages(roomType: string) {
    this.chatMessagesCounter.labels(roomType).inc();
  }

  setActiveRooms(roomType: string, count: number) {
    this.roomsActiveGauge.labels(roomType).set(count);
  }

  observeHttpDuration(method: string, route: string, statusCode: number, durationSeconds: number) {
    this.httpDurationHistogram.labels(method, route, statusCode.toString()).observe(durationSeconds);
  }
}
