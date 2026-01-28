import { Module } from "@nestjs/common";

import { UserModule } from "../user/user.module";
import { YjsService } from "./yjs.service";

@Module({
  imports: [UserModule],
  providers: [YjsService],
  exports: [YjsService],
})
export class YjsModule {}
