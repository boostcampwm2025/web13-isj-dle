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

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
