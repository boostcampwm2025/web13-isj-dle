import { Module } from "@nestjs/common";

import { GameGateway } from "./game.gateway";

@Module({
  providers: [GameGateway],
  exports: [GameGateway],
})
export class GameModule {}
