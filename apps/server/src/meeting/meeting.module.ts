import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DailyScrumQuestionEntity } from "./entities/daily_scrum_question.entity";
import { RetrospectiveTemplateEntity } from "./entities/retrospective_template.entity";
import { MeetingController } from "./meeting.controller";
import { MeetingService } from "./meeting.service";

@Module({
  imports: [TypeOrmModule.forFeature([DailyScrumQuestionEntity, RetrospectiveTemplateEntity])],
  controllers: [MeetingController],
  providers: [MeetingService],
})
export class MeetingModule {}
