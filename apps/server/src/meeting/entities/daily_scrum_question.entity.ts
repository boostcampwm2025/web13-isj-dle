import { DailyScrumQuestion } from "@shared/types";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("daily_scrum_questions")
export class DailyScrumQuestionEntity implements DailyScrumQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  question: string;
}
