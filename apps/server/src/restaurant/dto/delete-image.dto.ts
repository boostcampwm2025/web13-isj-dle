import { IsString } from "class-validator";

export class DeleteImageDto {
  @IsString()
  imageUrl!: string;
}
