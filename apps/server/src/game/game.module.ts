import { Module } from "@nestjs/common";

import { NoticeModule } from "src/notice/notice.module";

import { BoundaryModule } from "../boundary/boundary.module";
import { LecternModule } from "../lectern/lectern.module";
import { UserModule } from "../user/user.module";
import { GameGateway } from "./game.gateway";

@Module({
  imports: [UserModule, NoticeModule, BoundaryModule, LecternModule],
  providers: [GameGateway],
  exports: [GameGateway],
})
export class GameModule {}
