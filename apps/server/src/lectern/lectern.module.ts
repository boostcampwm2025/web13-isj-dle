import { Module } from "@nestjs/common";

import { LecternService } from "./lectern.service";

@Module({
  providers: [LecternService],
  exports: [LecternService],
})
export class LecternModule {}
