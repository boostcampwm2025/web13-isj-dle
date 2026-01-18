import { Module } from "@nestjs/common";

import { YjsService } from "./yjs.service";

@Module({
  providers: [YjsService],
  exports: [YjsService],
})
export class YjsModule {}
