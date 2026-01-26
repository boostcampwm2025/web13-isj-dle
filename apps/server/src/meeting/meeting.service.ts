import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { DailyScrumQuestionEntity } from "./entities/daily_scrum_question.entity";
import { RetrospectiveTemplateEntity } from "./entities/retrospective_template.entity";

@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(DailyScrumQuestionEntity)
    private dailyScrumQuestionRepository: Repository<DailyScrumQuestionEntity>,
    @InjectRepository(RetrospectiveTemplateEntity)
    private retrospectiveTemplateRepository: Repository<RetrospectiveTemplateEntity>,
  ) {}

  getRandomDailyScrumQuestion(n: number): Promise<DailyScrumQuestionEntity[]> {
    return this.dailyScrumQuestionRepository.createQueryBuilder("question").orderBy("RAND()").limit(n).getMany();
  }

  getRandomRetrospectiveTemplate(): Promise<RetrospectiveTemplateEntity | null> {
    return this.retrospectiveTemplateRepository.createQueryBuilder("template").orderBy("RAND()").getOne();
  }
}
