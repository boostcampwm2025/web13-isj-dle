import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

import type { Request } from "express";

import { AuthService } from "../../auth/auth.service";
import { AuthUserEntity } from "../../auth/auth_user.entity";

declare module "express" {
  interface Request {
    authUser?: AuthUserEntity;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();

    const session = typeof req.cookies?.session === "string" ? req.cookies.session : undefined;
    if (!session) throw new UnauthorizedException("Unauthorized");

    const authUser = await this.authService.getMeBySession(session);
    if (!authUser) throw new UnauthorizedException("Unauthorized");

    req.authUser = authUser;
    return true;
  }
}
