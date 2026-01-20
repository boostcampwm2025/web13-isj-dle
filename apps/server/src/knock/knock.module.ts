import { Module } from "@nestjs/common";

import { KnockService } from "./knock.service";

@Module({
  providers: [KnockService],
  exports: [KnockService],
})
export class KnockModule {}
