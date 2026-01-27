import { IsString } from "class-validator";

export class ConfirmImageDto {
  @IsString()
  key!: string;
}
