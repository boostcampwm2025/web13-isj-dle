import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from "@nestjs/common";

import type { Request, Response } from "express";
import { Observable, finalize } from "rxjs";

import { MetricsService } from "./metrics.service";

type RouteLike = {
  path?: string | RegExp;
};

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  private getSafeRoute(request: Request): string {
    const route = request.route as RouteLike | undefined;

    if (route?.path) {
      return String(route.path);
    }

    if (request.baseUrl) {
      return request.baseUrl;
    }

    if (request.url) {
      return request.url.split("?")[0];
    }

    return "*";
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const method = request.method;
    const route = this.getSafeRoute(request);
    const startTime = performance.now();

    return next.handle().pipe(
      finalize(() => {
        const status = response.statusCode || 500;
        const durationSeconds = (performance.now() - startTime) / 1000;

        this.metricsService.observeHttpDuration(method, route, status, durationSeconds);
      }),
    );
  }
}
