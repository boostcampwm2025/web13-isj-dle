import { Body, Controller, Logger, Post } from "@nestjs/common";

import { GenerateTokenDto } from "./dto/GenerateToken.dto";
import { LivekitService } from "./livekit.service";

@Controller("livekit")
export class LivekitController {
  private readonly logger = new Logger(LivekitController.name);

  constructor(private readonly livekitService: LivekitService) {}

  @Post("token")
  async getToken(@Body() dto: GenerateTokenDto) {
    const { roomName, participantId, participantName } = dto;

    const token = await this.livekitService.generateToken(roomName, participantId, participantName);
    const url = this.livekitService.getLivekitUrl();

    this.logger.log(
      `Livekit token generated successfully for room: ${roomName}, participant: ${participantId} | ${participantName}`,
    );

    return { token, url };
  }
}
