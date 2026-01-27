import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { DailyScrumQuestionEntity } from "./entities/daily_scrum_question.entity";
import { RetrospectiveTemplateEntity } from "./entities/retrospective_template.entity";
import { DAILY_SCRUM_QUESTION_SEED } from "./seeds/daily_scrum_question.seed";
import { RETROSPECTIVE_TEMPLATE_SEED } from "./seeds/retrospective_template.seed";

@Injectable()
export class MeetingService implements OnModuleInit {
  private readonly logger = new Logger(MeetingService.name);

  constructor(
    @InjectRepository(DailyScrumQuestionEntity)
    private dailyScrumQuestionRepository: Repository<DailyScrumQuestionEntity>,
    @InjectRepository(RetrospectiveTemplateEntity)
    private retrospectiveTemplateRepository: Repository<RetrospectiveTemplateEntity>,
  ) {}

  async onModuleInit() {
    await this.seedDailyScrumQuestions();
    await this.seedRetrospectiveTemplates();
  }

  private async seedDailyScrumQuestions() {
    await this.dailyScrumQuestionRepository.clear();
    await this.dailyScrumQuestionRepository.save(DAILY_SCRUM_QUESTION_SEED);
    this.logger.log("Daily scrum questions seeded");
  }

  private async seedRetrospectiveTemplates() {
    await this.retrospectiveTemplateRepository.clear();
    await this.retrospectiveTemplateRepository.save(RETROSPECTIVE_TEMPLATE_SEED);
    this.logger.log("Retrospective templates seeded");
  }

  getRandomDailyScrumQuestion(num: number): Promise<DailyScrumQuestionEntity[]> {
    return this.dailyScrumQuestionRepository.createQueryBuilder("question").orderBy("RAND()").limit(num).getMany();
  }

  getRandomRetrospectiveTemplate(): Promise<RetrospectiveTemplateEntity | null> {
    return this.retrospectiveTemplateRepository.createQueryBuilder("template").orderBy("RAND()").getOne();
  }
}
