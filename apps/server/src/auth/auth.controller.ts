import { Body, Controller, Get, HttpStatus, Post, Put, Query, Redirect, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { AuthUserResponse, SuccessResponse } from "@shared/types";
import type { CookieOptions, Response } from "express";

import { Cookies } from "../common/decorators/cookie.decorator";
import { OAUTH_STATE_COOKIE_NAME, SESSION_COOKIE_NAME } from "./auth.constants";
import { AuthService } from "./auth.service";
import { UpdateAuthUserDto } from "./update-auth-user.dto";

@Controller("auth")
export class AuthController {
  private readonly isProduction: boolean;
  private readonly CLIENT_ORIGIN: string;

  private readonly OAUTH_STATE_COOKIE_MAX_AGE = 5 * 60 * 1000; // 5 minutes
  private readonly OAUTH_STATE_COOKIE_OPTIONS: CookieOptions;

  private readonly SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly SESSION_COOKIE_OPTIONS: CookieOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    this.isProduction = this.configService.get<string>("NODE_ENV") === "production";
    this.CLIENT_ORIGIN = this.configService.get<string>("CLIENT_ORIGIN") || "http://localhost:5173";
    this.OAUTH_STATE_COOKIE_OPTIONS = {
      httpOnly: true,
      sameSite: this.isProduction ? "none" : "lax",
      secure: this.isProduction,
      maxAge: this.OAUTH_STATE_COOKIE_MAX_AGE,
    };
    this.SESSION_COOKIE_OPTIONS = {
      httpOnly: true,
      sameSite: this.isProduction ? "none" : "lax",
      secure: this.isProduction,
      maxAge: this.SESSION_COOKIE_MAX_AGE,
    };
  }

  @Get("github")
  @Redirect()
  githubLogin(@Res({ passthrough: true }) res: Response) {
    const { url, state } = this.authService.getGithubAuthorizeUrl();

    res.cookie(OAUTH_STATE_COOKIE_NAME, state, this.OAUTH_STATE_COOKIE_OPTIONS);

    return { url };
  }

  @Get("github/callback")
  @Redirect()
  async githubCallback(
    @Res({ passthrough: true }) res: Response,
    @Cookies(OAUTH_STATE_COOKIE_NAME) oauth_state?: string,
    @Query("code") code?: string,
    @Query("state") state?: string,
  ) {
    if (!code) return { url: this.CLIENT_ORIGIN + "/login?error=missing_code" };

    if (!state || !oauth_state || state !== oauth_state) {
      return { url: this.CLIENT_ORIGIN + "/login?error=invalid_state" };
    }

    const { jwt } = await this.authService.handleGithubCallback(code);

    res.clearCookie(OAUTH_STATE_COOKIE_NAME);
    res.cookie(SESSION_COOKIE_NAME, jwt, this.SESSION_COOKIE_OPTIONS);

    return { url: this.CLIENT_ORIGIN };
  }

  @Put("update")
  async updateAuthUser(
    @Res({ passthrough: true }) res: Response,
    @Body() body: UpdateAuthUserDto,
    @Cookies(SESSION_COOKIE_NAME) session?: string,
  ): Promise<AuthUserResponse> {
    if (!session) {
      res.status(HttpStatus.UNAUTHORIZED);
      return { error: "Unauthorized" };
    }
    const authUser = await this.authService.getMeBySession(session);
    if (!authUser) {
      res.status(HttpStatus.UNAUTHORIZED);
      return { error: "Unauthorized" };
    }

    if (
      body.nickname &&
      body.nickname === authUser.nickname &&
      body.avatarAssetKey &&
      body.avatarAssetKey === authUser.avatarAssetKey
    ) {
      return { user: authUser };
    }

    const updatedUser = await this.authService.updateAuthUser(authUser.id, body);

    if (!updatedUser) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      return { error: "Failed to update user" };
    }

    return { user: updatedUser };
  }

  @Get("tutorial/completed")
  async tutorialCompleted(
    @Res({ passthrough: true }) res: Response,
    @Cookies(SESSION_COOKIE_NAME) session?: string,
  ): Promise<SuccessResponse> {
    if (!session) {
      res.status(HttpStatus.UNAUTHORIZED);
      return { success: false, error: "Unauthorized" };
    }
    const authUser = await this.authService.getMeBySession(session);
    if (!authUser) {
      res.status(HttpStatus.UNAUTHORIZED);
      return { success: false, error: "Unauthorized" };
    }
    await this.authService.tutorialCompleted(authUser.id);
    return { success: true };
  }

  @Get("me")
  async me(
    @Res({ passthrough: true }) res: Response,
    @Cookies(SESSION_COOKIE_NAME) session?: string,
  ): Promise<AuthUserResponse> {
    if (!session) {
      res.status(HttpStatus.UNAUTHORIZED);
      return { error: "Unauthorized" };
    }
    const authUser = await this.authService.getMeBySession(session);
    if (!authUser) {
      res.status(HttpStatus.UNAUTHORIZED);
      return { error: "Unauthorized" };
    }
    return { user: authUser };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response): SuccessResponse {
    res.clearCookie(SESSION_COOKIE_NAME);
    return { success: true };
  }
}
