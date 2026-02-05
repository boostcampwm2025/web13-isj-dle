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

    @InjectMetric("rooms_active_total")
    private roomsActiveGauge: Gauge<string>,

    @InjectMetric("http_request_duration_seconds")
    private httpDurationHistogram: Histogram<string>,

    @InjectMetric("s3_requests_total")
    private s3RequestsCounter: Counter<string>,

    @InjectMetric("s3_request_duration_seconds")
    private s3DurationHistogram: Histogram<string>,

    @InjectMetric("s3_upload_bytes_total")
    private s3UploadBytesCounter: Counter<string>,

    @InjectMetric("socket_room_transitions_total")
    private roomTransitionsCounter: Counter<string>,

    @InjectMetric("session_duration_seconds")
    private sessionDurationHistogram: Histogram<string>,
  ) {}

  incrementWsConnections() {
    this.wsConnectionsGauge.inc();
  }

  decrementWsConnections() {
    this.wsConnectionsGauge.dec();
  }

  userJoined(roomType: string) {
    this.usersOnlineGauge.inc();
    this.usersByRoomGauge.labels(roomType).inc();
  }

  userLeft(roomType: string) {
    this.usersOnlineGauge.dec();
    this.usersByRoomGauge.labels(roomType).dec();
  }

  userMoved(fromRoomType: string, toRoomType: string) {
    if (fromRoomType === toRoomType) return;
    this.usersByRoomGauge.labels(fromRoomType).dec();
    this.usersByRoomGauge.labels(toRoomType).inc();
    this.roomTransitionsCounter.labels(fromRoomType, toRoomType).inc();
  }

  incrementActiveRooms(roomType: string) {
    this.roomsActiveGauge.labels(roomType).inc();
  }

  decrementActiveRooms(roomType: string) {
    this.roomsActiveGauge.labels(roomType).dec();
  }

  recordSessionDuration(durationSeconds: number) {
    this.sessionDurationHistogram.observe(durationSeconds);
  }

  observeHttpDuration(method: string, route: string, statusCode: number, durationSeconds: number) {
    this.httpDurationHistogram.labels(method, route, statusCode.toString()).observe(durationSeconds);
  }

  recordS3Request(operation: string, status: "success" | "error", durationSeconds: number) {
    this.s3RequestsCounter.labels(operation, status).inc();
    this.s3DurationHistogram.labels(operation).observe(durationSeconds);
  }

  recordS3Upload(bytes: number) {
    this.s3UploadBytesCounter.inc(bytes);
  }

  reconcileOnlineUsers(actualCount: number) {
    this.usersOnlineGauge.set(actualCount);
  }

  reconcileUsersByRoom(roomType: string, actualCount: number) {
    this.usersByRoomGauge.labels(roomType).set(actualCount);
  }

  reconcileActiveRooms(roomType: string, actualCount: number) {
    this.roomsActiveGauge.labels(roomType).set(actualCount);
  }

  reconcileWsConnections(actualCount: number) {
    this.wsConnectionsGauge.set(actualCount);
  }
}
