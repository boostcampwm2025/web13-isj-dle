import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { UserGateway } from "./user.gateway";
import { UserService } from "./user.service";

@Module({
  imports: [AuthModule],
  providers: [UserService, UserGateway],
  exports: [UserService],
})
export class UserModule {}
