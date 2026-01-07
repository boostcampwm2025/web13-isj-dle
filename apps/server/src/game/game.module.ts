import { Module } from "@nestjs/common";

import { UserModule } from "../user/user.module";
import { GameGateway } from "./game.gateway";

@Module({
  imports: [UserModule],
  providers: [GameGateway],
  exports: [GameGateway],
})
export class GameModule {}
