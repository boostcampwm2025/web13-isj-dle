import { Module } from "@nestjs/common";

import { BoundaryService } from "./boundary.service";

@Module({
  providers: [BoundaryService],
  exports: [BoundaryService],
})
export class BoundaryModule {}
