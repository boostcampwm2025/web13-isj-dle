import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { NoticeEntity } from "./notice.entity";
import { NoticeGateway } from "./notice.gateway";
import { NoticeService } from "./notice.service";

@Module({
  imports: [TypeOrmModule.forFeature([NoticeEntity])],
  providers: [NoticeService, NoticeGateway],
  exports: [NoticeService],
})
export class NoticeModule {}
