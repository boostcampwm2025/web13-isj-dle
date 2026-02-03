import { type AvatarAssetKey, UpdateAuthUserPayload } from "@shared/types";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateAuthUserDto implements UpdateAuthUserPayload {
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatarAssetKey?: AvatarAssetKey;
}
