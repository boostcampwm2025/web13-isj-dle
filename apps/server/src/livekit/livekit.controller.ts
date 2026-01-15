import { Body, Controller, Post } from "@nestjs/common";

import { LivekitTokenResponse } from "@shared/types";

import { GenerateTokenDto } from "./dto/GenerateToken.dto";
import { LivekitService } from "./livekit.service";

@Controller("livekit")
export class LivekitController {
  constructor(private readonly livekitService: LivekitService) {}

  @Post("token")
  async getToken(@Body() dto: GenerateTokenDto): Promise<LivekitTokenResponse> {
    const { roomId, userId, nickname } = dto;

    const token = await this.livekitService.generateToken(roomId, userId, nickname);
    const url = this.livekitService.getLivekitUrl();

    return { token, url };
  }
}
