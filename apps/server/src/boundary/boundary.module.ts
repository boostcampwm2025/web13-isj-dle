import { Module } from "@nestjs/common";

import { BoundaryService } from "./boundary.service";
import { BoundaryTracker } from "./boundaryTracker.service";

@Module({
  providers: [BoundaryService, BoundaryTracker],
  exports: [BoundaryService, BoundaryTracker],
})
export class BoundaryModule {}
