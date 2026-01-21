import { Module } from "@nestjs/common";

import { NoticeModule } from "src/notice/notice.module";
import { TimerModule } from "src/timer/timer.module";

import { BoundaryModule } from "../boundary/boundary.module";
import { KnockModule } from "../knock/knock.module";
import { LecternModule } from "../lectern/lectern.module";
import { UserModule } from "../user/user.module";
import { GameGateway } from "./game.gateway";

@Module({
  imports: [UserModule, NoticeModule, BoundaryModule, TimerModule, LecternModule, KnockModule],
  providers: [GameGateway],
  exports: [GameGateway],
})
export class GameModule {}
