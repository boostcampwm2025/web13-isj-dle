import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AccessToken } from "livekit-server-sdk";

@Injectable()
export class LivekitService {
  private readonly logger = new Logger(LivekitService.name);
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly livekitUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>("LIVEKIT_API_KEY");
    this.apiSecret = this.configService.getOrThrow<string>("LIVEKIT_API_SECRET");
    this.livekitUrl = this.configService.getOrThrow<string>("LIVEKIT_URL");
  }

  async generateToken(roomId: string, userId: string, nickname: string) {
    try {
      const token = new AccessToken(this.apiKey, this.apiSecret, {
        identity: userId,
        name: nickname,
      });

      token.addGrant({
        roomJoin: true,
        room: roomId,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      return await token.toJwt();
    } catch (error) {
      this.logger.error(
        `Failed to generate token for ${nickname}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        `Failed to generate Livekit token ${error instanceof Error ? error.message : "Internal server error"}`,
      );
    }
  }

  getLivekitUrl() {
    return this.livekitUrl;
  }
}
