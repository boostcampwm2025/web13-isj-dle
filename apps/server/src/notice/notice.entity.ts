import { Notice } from "@shared/types";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("notices")
export class NoticeEntity implements Notice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column("text")
  content: string;

  @Column()
  roomId: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  timestamp: Date;
}
