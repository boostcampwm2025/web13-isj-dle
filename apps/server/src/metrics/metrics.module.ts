import { Module } from "@nestjs/common";

import {
  PrometheusModule,
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
} from "@willsoto/nestjs-prometheus";

import { MetricsService } from "./metrics.service";

@Module({
  imports: [
    PrometheusModule.register({
      path: "/metrics",
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    makeGaugeProvider({
      name: "websocket_connections_active",
      help: "Number of active WebSocket connections",
    }),
    makeGaugeProvider({
      name: "users_online_total",
      help: "Total number of online users",
    }),
    makeGaugeProvider({
      name: "users_online_by_room",
      help: "Users by room type",
      labelNames: ["room_type"],
    }),
    makeHistogramProvider({
      name: "http_request_duration_seconds",
      help: "HTTP request duration in seconds",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    }),
    makeCounterProvider({
      name: "chat_messages_total",
      help: "Total chat messages",
      labelNames: ["room_type"],
    }),
    makeGaugeProvider({
      name: "rooms_active_total",
      help: "Number of active rooms",
      labelNames: ["room_type"],
    }),
    MetricsService,
  ],
})
export class MetricsModule {}
