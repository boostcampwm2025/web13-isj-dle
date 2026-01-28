import { RetrospectiveTemplate } from "@shared/types";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("retrospective_templates")
export class RetrospectiveTemplateEntity implements RetrospectiveTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  content: string;

  @Column("text")
  theme: string;
}
