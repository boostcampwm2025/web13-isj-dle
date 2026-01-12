import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { LivekitController } from "./livekit.controller";
import { LivekitService } from "./livekit.service";

@Module({
  imports: [ConfigModule],
  controllers: [LivekitController],
  providers: [LivekitService],
  exports: [LivekitService],
})
export class LivekitModule {}
