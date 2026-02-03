import { Body, Controller, Get, Post, Put, Query, Req, Res } from "@nestjs/common";

import type { Request, Response } from "express";

import { AuthService } from "./auth.service";
import { UpdateAuthUserDto } from "./update-auth-user.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("github")
  githubLogin(@Res() res: Response) {
    const { url, state } = this.authService.getGithubAuthorizeUrl();

    res.cookie("oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // https면 true
      maxAge: 5 * 60 * 1000,
    });

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

    res.clearCookie("oauth_state");
    res.cookie("session", jwt, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
    res.clearCookie("session");
    return res.json({ ok: true });
  }
}
