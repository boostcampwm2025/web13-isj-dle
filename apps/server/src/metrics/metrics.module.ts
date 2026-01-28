import { Global, Module, forwardRef } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";

import {
  PrometheusModule,
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
} from "@willsoto/nestjs-prometheus";

import { UserModule } from "../user/user.module";
import { HttpMetricsInterceptor } from "./http-metrics.interceptor";
import { MetricsCollectorService } from "./metrics-collector.service";
import { MetricsService } from "./metrics.service";

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      path: "/metrics",
      defaultMetrics: { enabled: true },
    }),
    forwardRef(() => UserModule),
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
    makeGaugeProvider({
      name: "rooms_active_total",
      help: "Number of active rooms",
      labelNames: ["room_type"],
    }),
    makeHistogramProvider({
      name: "http_request_duration_seconds",
      help: "HTTP request duration in seconds",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    }),

    makeCounterProvider({
      name: "s3_requests_total",
      help: "Total number of S3 requests",
      labelNames: ["operation", "status"],
    }),
    makeHistogramProvider({
      name: "s3_request_duration_seconds",
      help: "S3 request duration in seconds",
      labelNames: ["operation"],
      buckets: [0.1, 0.5, 1, 2, 5],
    }),
    makeCounterProvider({
      name: "s3_upload_bytes_total",
      help: "Total bytes uploaded to S3",
    }),

    makeCounterProvider({
      name: "socket_room_transitions_total",
      help: "Total room transition events",
      labelNames: ["from_room", "to_room"],
    }),

    makeHistogramProvider({
      name: "session_duration_seconds",
      help: "User session duration in seconds",
      buckets: [60, 300, 600, 1800, 3600, 7200],
    }),

    MetricsService,
    MetricsCollectorService,
    {
      provide: APP_INTERCEPTOR,
      useFactory: (metricsService: MetricsService) => new HttpMetricsInterceptor(metricsService),
      inject: [MetricsService],
    },
  ],
  exports: [PrometheusModule, MetricsService],
})
export class MetricsModule {}
