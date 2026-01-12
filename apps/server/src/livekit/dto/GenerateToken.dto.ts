import { IsNotEmpty, IsString } from "class-validator";

export class GenerateTokenDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;
}
