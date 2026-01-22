import { Module } from "@nestjs/common";

import { UserModule } from "../user/user.module";
import { KnockGateway } from "./knock.gateway";
import { KnockService } from "./knock.service";

@Module({
  imports: [UserModule],
  providers: [KnockService, KnockGateway],
  exports: [KnockService],
})
export class KnockModule {}
