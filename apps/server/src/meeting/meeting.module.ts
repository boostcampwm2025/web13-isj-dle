import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DailyScrumQuestionEntity } from "./entities/daily_scrum_question.entity";
import { RetrospectiveTemplateEntity } from "./entities/retrospective_template.entity";
import { MeetingGateway } from "./meeting.gateway";
import { MeetingService } from "./meeting.service";

@Module({
  imports: [TypeOrmModule.forFeature([DailyScrumQuestionEntity, RetrospectiveTemplateEntity])],
  providers: [MeetingService, MeetingGateway],
})
export class MeetingModule {}
