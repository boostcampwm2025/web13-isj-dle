import { type ExecutionContext, createParamDecorator } from "@nestjs/common";

import type { Request } from "express";

export const Cookies = createParamDecorator(
  (key: string, ctx: ExecutionContext): string | undefined | Record<string, string> => {
    const request = ctx.switchToHttp().getRequest<Request>();

    const cookies = request.cookies as Record<string, string> | undefined;

    if (!cookies) return undefined;
    if (!key) return cookies;

    return cookies[key];
  },
);
