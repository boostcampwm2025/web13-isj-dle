import { AuthUser, type AvatarAssetKey } from "@shared/types";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("users")
export class AuthUserEntity implements AuthUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("boolean", { default: false })
  tutorialCompleted: boolean;

  @Column("int", { unique: true })
  gitHubId: number;

  @Column("varchar", { length: 255, unique: true })
  nickname: string;

  @Column("varchar", { length: 255 })
  avatarAssetKey: AvatarAssetKey;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}
