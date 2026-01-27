import { Module } from "@nestjs/common";

import { UserModule } from "../user/user.module";
import { StopwatchGateway } from "./stopwatch.gateway";
import { StopwatchService } from "./stopwatch.service";

@Module({
  imports: [UserModule],
  providers: [StopwatchService, StopwatchGateway],
  exports: [StopwatchService, StopwatchGateway],
})
export class StopwatchModule {}
