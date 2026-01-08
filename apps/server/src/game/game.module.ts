import { Module } from "@nestjs/common";

import { NoticeModule } from "src/notice/notice.module";

import { UserModule } from "../user/user.module";
import { GameGateway } from "./game.gateway";

@Module({
  imports: [UserModule, NoticeModule],
  providers: [GameGateway],
  exports: [GameGateway],
})
export class GameModule {}
