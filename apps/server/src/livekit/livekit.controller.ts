import { Body, Controller, Logger, Post } from "@nestjs/common";

import { LivekitTokenResponse } from "@shared/types";

import { GenerateTokenDto } from "./dto/GenerateToken.dto";
import { LivekitService } from "./livekit.service";

@Controller("livekit")
export class LivekitController {
  private readonly logger = new Logger(LivekitController.name);

  constructor(private readonly livekitService: LivekitService) {}

  @Post("token")
  async getToken(@Body() dto: GenerateTokenDto): Promise<LivekitTokenResponse> {
    const { roomId, userId, nickname } = dto;

    const token = await this.livekitService.generateToken(roomId, userId, nickname);
    const url = this.livekitService.getLivekitUrl();

    this.logger.log(`Livekit token generated successfully for room: ${roomId}, participant: ${userId} | ${nickname}`);

    return { token, url };
  }
}
