import { type ExecutionContext, createParamDecorator } from "@nestjs/common";

import type { Request } from "express";

import { type AuthUserEntity } from "../../auth/auth_user.entity";

export const AuthUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUserEntity | undefined => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return req.authUser;
});
