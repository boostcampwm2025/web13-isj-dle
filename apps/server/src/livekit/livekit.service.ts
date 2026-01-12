import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AccessToken } from "livekit-server-sdk";

@Injectable()
export class LivekitService {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly livekitUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>("LIVEKIT_API_KEY");
    this.apiSecret = this.configService.getOrThrow<string>("LIVEKIT_API_SECRET");
    this.livekitUrl = this.configService.getOrThrow<string>("LIVEKIT_URL");
  }

  async generateToken(roomId: string, userId: string, nickname: string) {
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
  }

  getLivekitUrl() {
    return this.livekitUrl;
  }
}
