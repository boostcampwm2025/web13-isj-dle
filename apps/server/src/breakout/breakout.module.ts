import { Module } from "@nestjs/common";

import { BreakoutService } from "./breakout.service";

@Module({
  providers: [BreakoutService],
  exports: [BreakoutService],
})
export class BreakoutModule {}
