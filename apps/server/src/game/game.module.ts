import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";

import { NoticeModule } from "src/notice/notice.module";
import { StopwatchModule } from "src/stopwatch/stopwatch.module";
import { TimerModule } from "src/timer/timer.module";

import { BoundaryModule } from "../boundary/boundary.module";
import { KnockModule } from "../knock/knock.module";
import { LecternModule } from "../lectern/lectern.module";
import { UserModule } from "../user/user.module";
import { GameGateway } from "./game.gateway";
import { RoomGateway } from "./room.gateway";

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    UserModule,
    NoticeModule,
    BoundaryModule,
    TimerModule,
    StopwatchModule,
    LecternModule,
    KnockModule,
  ],
  providers: [GameGateway, RoomGateway],
  exports: [GameGateway, RoomGateway],
})
export class GameModule {}
