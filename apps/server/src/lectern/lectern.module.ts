import { Module } from "@nestjs/common";

import { UserModule } from "../user/user.module";
import { LecternGateway } from "./lectern.gateway";
import { LecternService } from "./lectern.service";

@Module({
  imports: [UserModule],
  providers: [LecternService, LecternGateway],
  exports: [LecternService],
})
export class LecternModule {}
