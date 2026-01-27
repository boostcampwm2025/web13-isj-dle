import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString } from "class-validator";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"] as const;

export class PresignImageDto {
  @Transform(({ value }) => (typeof value === "string" ? value.split(";")[0].trim().toLowerCase() : ""))
  @IsString()
  @IsIn(ALLOWED_MIME_TYPES, { message: `contentType must be one of: ${ALLOWED_MIME_TYPES.join(", ")}` })
  contentType!: string;

  @IsOptional()
  @IsString()
  originalName?: string;
}
