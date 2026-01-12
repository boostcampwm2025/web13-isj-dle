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

  async generateToken(roomName: string, participantId: string, participantName: string) {
    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantId,
      name: participantName,
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
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
