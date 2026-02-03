import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";

import { AuthUser, UserEventType } from "@shared/types";
import type { Request } from "express";
import { generateRandomAvatar } from "src/avatar/avatar.generator";
import { generateUniqueNickname } from "src/nickname/nickname.generator";
import { Repository } from "typeorm";

import type { GithubUser, JWTPayload } from "./auth.types";
import { AuthUserEntity } from "./auth_user.entity";
import { UpdateAuthUserDto } from "./update-auth-user.dto";

@Injectable()
export class AuthService {
  private readonly GITHUB_CLIENT_ID: string;
  private readonly GITHUB_CLIENT_SECRET: string;
  private readonly GITHUB_REDIRECT_URI: string;

  private readonly JWT_SECRET: string;

  private isDuplicateNickname = async (nickname: string, userId?: number): Promise<boolean> => {
    const user = await this.authUserRepository.findOne({ where: { nickname } });
    if (!user) return false;
    if (userId && user.id === userId) return false;
    return true;
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,

    @InjectRepository(AuthUserEntity)
    private readonly authUserRepository: Repository<AuthUserEntity>,
  ) {
    this.GITHUB_CLIENT_ID = this.configService.get<string>("GITHUB_CLIENT_ID") ?? "";
    this.GITHUB_CLIENT_SECRET = this.configService.get<string>("GITHUB_CLIENT_SECRET") ?? "";
    this.GITHUB_REDIRECT_URI = this.configService.get<string>("GITHUB_REDIRECT_URI") ?? "";

    this.JWT_SECRET = this.configService.get<string>("JWT_SECRET") ?? "";

    if (!this.GITHUB_CLIENT_ID || !this.GITHUB_CLIENT_SECRET || !this.GITHUB_REDIRECT_URI) {
      throw new Error("GitHub OAuth configuration is missing");
    }
    if (!this.JWT_SECRET) {
      throw new Error("JWT_SECRET is required");
    }
  }

  getGithubAuthorizeUrl() {
    const state = crypto.randomUUID();
    const params = new URLSearchParams({
      client_id: this.GITHUB_CLIENT_ID,
      redirect_uri: this.GITHUB_REDIRECT_URI,
      scope: "read:user user:email",
      state,
    });
    return { state, url: `https://github.com/login/oauth/authorize?${params.toString()}` };
  }

  async handleGithubCallback(code: string) {
    const accessToken = await this.exchangeCodeForToken(code);
    const ghUser = await this.fetchGithubUser(accessToken);

    let authUser = await this.authUserRepository.findOne({ where: { gitHubId: ghUser.id } });
    if (!authUser) {
      const nickname = await generateUniqueNickname(this.isDuplicateNickname);
      const avatarAssetKey = generateRandomAvatar();
      const newUser = this.authUserRepository.create({
        gitHubId: ghUser.id,
        nickname,
        avatarAssetKey,
      });
      authUser = await this.authUserRepository.save(newUser);
    }

    const payload: JWTPayload = {
      sub: authUser.id.toString(),
      nickname: authUser.nickname,
      avatarAssetKey: authUser.avatarAssetKey,
      createdAt: authUser.createdAt.toISOString(),
    };

    const jwt = await this.jwtService.signAsync(payload);
    return { jwt, user: authUser };
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.GITHUB_CLIENT_ID,
        client_secret: this.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: this.GITHUB_REDIRECT_URI,
      }),
    });

    const json = (await res.json()) as { access_token?: string };
    if (!json.access_token) throw new UnauthorizedException("Token exchange failed");
    return json.access_token;
  }

  private async fetchGithubUser(accessToken: string): Promise<GithubUser> {
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new UnauthorizedException("GitHub user fetch failed");
    return (await res.json()) as GithubUser;
  }

  getAuthUserById(id: number): Promise<AuthUserEntity | null> {
    return this.authUserRepository.findOne({ where: { id } });
  }

  async getMeFromRequest(req: Request): Promise<AuthUserEntity | null> {
    const token = req.cookies.session as string | undefined;
    if (!token) return null;

    try {
      const payload = await this.jwtService.verifyAsync<JWTPayload>(token);
      return this.getAuthUserById(Number(payload.sub));
    } catch {
      return null;
    }
  }

  async updateAuthUser(body: UpdateAuthUserDto): Promise<AuthUser | null> {
    if (body.nickname && (await this.isDuplicateNickname(body.nickname, body.userId))) return null;
    const updatedUser = await this.authUserRepository.save({ id: body.userId, ...body });
    this.eventEmitter.emit(UserEventType.USER_INFO_UPDATE, body);
    return updatedUser;
  }

  async tutorialCompleted(userId: number): Promise<void> {
    await this.authUserRepository.update({ id: userId }, { tutorialCompleted: true });
  }
}
