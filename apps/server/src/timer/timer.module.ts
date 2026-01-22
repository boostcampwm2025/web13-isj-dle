import { Module } from "@nestjs/common";

import { UserModule } from "../user/user.module";
import { TimerGateway } from "./timer.gateway";
import { TimerService } from "./timer.service";

@Module({
  imports: [UserModule],
  providers: [TimerService, TimerGateway],
  exports: [TimerService],
})
export class TimerModule {}
