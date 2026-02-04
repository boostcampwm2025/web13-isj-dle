import { type AvatarAssetKey, UpdateAuthUserPayload } from "@shared/types";
import { IsOptional, IsString } from "class-validator";

export class UpdateAuthUserDto implements UpdateAuthUserPayload {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatarAssetKey?: AvatarAssetKey;
}
