import { Module } from "@nestjs/common";

import { UserManager } from "./user-manager.service";

@Module({
  providers: [UserManager],
  exports: [UserManager],
})
export class UserModule {}
