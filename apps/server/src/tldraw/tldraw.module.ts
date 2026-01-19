import { Module } from "@nestjs/common";

import { TldrawService } from "./tldraw.service";

@Module({
  providers: [TldrawService],
  exports: [TldrawService],
})
export class TldrawModule {}
