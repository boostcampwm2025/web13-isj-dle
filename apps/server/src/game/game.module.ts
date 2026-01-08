import { Module } from "@nestjs/common";

import { NoticeModule } from "src/notice/notice.module";

import { GameGateway } from "./game.gateway";

@Module({
  imports: [NoticeModule],
  providers: [GameGateway],
  exports: [GameGateway],
})
export class GameModule {}
