import { Module } from "@nestjs/common";

import { UserManager } from "./user-manager.service";
import { UserGateway } from "./user.gateway";

@Module({
  providers: [UserManager, UserGateway],
  exports: [UserManager],
})
export class UserModule {}
