import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("restaurant_images")
export class RestaurantImageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  nickname: string;

  @Column()
  key: string;

  @Column({ default: 0 })
  likes: number;

  @Column({ type: "simple-json", nullable: true })
  likedBy: string[] | null;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
