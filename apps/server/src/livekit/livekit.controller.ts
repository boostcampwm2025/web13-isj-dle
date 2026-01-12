import { Body, Controller, Logger, Post } from "@nestjs/common";

import { LivekitService } from "./livekit.service";

@Controller("livekit")
export class LivekitController {
  private readonly logger = new Logger(LivekitController.name);

  constructor(private readonly livekitService: LivekitService) {}

  @Post("token")
  async getToken(
    @Body("roomName") roomName: string,
    @Body("participantId") participantId: string,
    @Body("participantName") participantName: string,
  ) {
    const token = await this.livekitService.generateToken(roomName, participantId, participantName);
    const url = this.livekitService.getLivekitUrl();

    this.logger.log(`Livekit token generated successfully: ${token}`);

    return { token, url };
  }
}
