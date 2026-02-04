import { IsNotEmpty, IsString } from "class-validator";

export class GenerateTokenDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  socketId: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;
}
