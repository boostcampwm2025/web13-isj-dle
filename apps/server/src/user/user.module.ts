import { Module } from "@nestjs/common";

import { UserGateway } from "./user.gateway";
import { UserService } from "./user.service";

@Module({
  providers: [UserService, UserGateway],
  exports: [UserService],
})
export class UserModule {}
