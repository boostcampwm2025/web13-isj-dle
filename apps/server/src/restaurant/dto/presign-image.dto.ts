import { ALLOWED_IMAGE_MIME_TYPES } from "@shared/types";
import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString } from "class-validator";

export class PresignImageDto {
  @Transform(({ value }) => (typeof value === "string" ? value.split(";")[0].trim().toLowerCase() : ""))
  @IsString()
  @IsIn(ALLOWED_IMAGE_MIME_TYPES)
  contentType!: string;

  @IsOptional()
  @IsString()
  originalName?: string;
}
