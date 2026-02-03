import { Body, Controller, Get, Post, Put, Query, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { CookieOptions, Request, Response } from "express";

import { AuthService } from "./auth.service";
import { UpdateAuthUserDto } from "./update-auth-user.dto";

@Controller("auth")
export class AuthController {
  private readonly isProduction: boolean;

  private readonly OAUTH_STATE_COOKIE_NAME = "oauth_state";
  private readonly OAUTH_STATE_COOKIE_MAX_AGE = 5 * 60 * 1000; // 5 minutes
  private readonly OAUTH_STATE_COOKIE_OPTIONS: CookieOptions;

  private readonly SESSION_COOKIE_NAME = "session";
  private readonly SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly SESSION_COOKIE_OPTIONS: CookieOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    this.isProduction = this.configService.get<string>("NODE_ENV") === "production";
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
  githubLogin(@Res() res: Response) {
    const { url, state } = this.authService.getGithubAuthorizeUrl();

    res.cookie(this.OAUTH_STATE_COOKIE_NAME, state, this.OAUTH_STATE_COOKIE_OPTIONS);

    return res.redirect(url);
  }

  @Get("github/callback")
  async githubCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query("code") code?: string,
    @Query("state") state?: string,
  ) {
    if (!code) return res.status(400).send("No code");

    const savedState = req.cookies?.oauth_state as string | undefined;
    if (!state || !savedState || state !== savedState) {
      return res.status(400).send("Invalid state");
    }

    const { jwt } = await this.authService.handleGithubCallback(code);

    res.clearCookie(this.OAUTH_STATE_COOKIE_NAME);
    res.cookie(this.SESSION_COOKIE_NAME, jwt, this.SESSION_COOKIE_OPTIONS);

    return res.redirect(process.env.CLIENT_ORIGIN!);
  }

  @Put("update")
  async updateAuthUser(@Req() req: Request, @Res() res: Response, @Body() body: UpdateAuthUserDto) {
    const authUser = await this.authService.getMeFromRequest(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (
      body.nickname &&
      body.nickname === authUser.nickname &&
      body.avatarAssetKey &&
      body.avatarAssetKey === authUser.avatarAssetKey
    ) {
      return res.json({ user: authUser });
    }

    const updatedUser = await this.authService.updateAuthUser(body);

    return res.json({ user: updatedUser });
  }

  @Get("tutorial/completed")
  async tutorialCompleted(@Req() req: Request, @Res() res: Response) {
    const authUser = await this.authService.getMeFromRequest(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await this.authService.tutorialCompleted(authUser.id);
    return res.json({ ok: true });
  }

  @Get("me")
  async me(@Req() req: Request) {
    return this.authService.getMeFromRequest(req);
  }

  @Post("logout")
  logout(@Res() res: Response) {
    res.clearCookie(this.SESSION_COOKIE_NAME);
    return res.json({ ok: true });
  }
}
