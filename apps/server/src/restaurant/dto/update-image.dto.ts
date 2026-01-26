import { IsString } from "class-validator";

export class UpdateImageDto {
  @IsString()
  imageUrl!: string;

  @IsString()
  newImageUrl!: string;
}
