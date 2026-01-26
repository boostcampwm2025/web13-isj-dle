import { Controller, Get, Logger, Param } from "@nestjs/common";

import { RandomDailyScrumQuestionsResponse, RandomRetrospectiveTemplateResponse } from "@shared/types";

import { MeetingService } from "./meeting.service";

@Controller("meeting")
export class MeetingController {
  private readonly logger = new Logger(MeetingController.name);

  constructor(private readonly meetingService: MeetingService) {}

  @Get("daily-scrum-question/:n")
  async getDailyScrumQuestion(@Param("n") n: number): Promise<RandomDailyScrumQuestionsResponse> {
    const questions = await this.meetingService.getRandomDailyScrumQuestion(n);
    this.logger.log(`Fetched ${questions.length} daily scrum questions`);
    return { questions };
  }

  @Get("retrospective-template")
  async getRetrospectiveTemplate(): Promise<RandomRetrospectiveTemplateResponse> {
    const template = await this.meetingService.getRandomRetrospectiveTemplate();
    this.logger.log(`Fetched a retrospective template`);
    return { template };
  }
}
