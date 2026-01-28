import { Module } from "@nestjs/common";

import { UserModule } from "../user/user.module";
import { TldrawService } from "./tldraw.service";

@Module({
  imports: [UserModule],
  providers: [TldrawService],
  exports: [TldrawService],
})
export class TldrawModule {}
