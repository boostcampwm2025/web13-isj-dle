import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { NoticeEntity } from "./notice.entity";
import { NoticeService } from "./notice.service";

@Module({
  imports: [TypeOrmModule.forFeature([NoticeEntity])],
  providers: [NoticeService],
  exports: [NoticeService],
})
export class NoticeModule {}
