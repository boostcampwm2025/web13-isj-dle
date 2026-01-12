import { IsNotEmpty, IsString } from "class-validator";

export class GenerateTokenDto {
  @IsString()
  @IsNotEmpty()
  roomName: string;

  @IsString()
  @IsNotEmpty()
  participantId: string;

  @IsString()
  @IsNotEmpty()
  participantName: string;
}
