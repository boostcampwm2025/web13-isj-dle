import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { memoryStorage } from "multer";

import { ConfirmImageDto } from "./dto/confirm-image.dto";
import { DeleteImageDto } from "./dto/delete-image.dto";
import { PresignImageDto } from "./dto/presign-image.dto";
import { UpdateImageDto } from "./dto/update-image.dto";
import { RestaurantService } from "./restaurant.service";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 7 * 1024 * 1024;

@Controller("restaurant")
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get("images/me")
  getMyImages(@Headers("x-user-id") userId: string) {
    if (!userId) {
      throw new BadRequestException("x-user-id header is required");
    }

    return this.restaurantService.getImagesByUserId(userId);
  }

  @Get("images/user/:targetUserId")
  getUserImages(@Headers("x-user-id") userId: string, @Param("targetUserId") targetUserId: string) {
    if (!userId) {
      throw new BadRequestException("x-user-id header is required");
    }

    return this.restaurantService.getImagesByUserId(targetUserId);
  }

  @Get("images/feed")
  getImagesFeed(@Headers("x-user-id") userId: string) {
    if (!userId) {
      throw new BadRequestException("x-user-id header is required");
    }

    return this.restaurantService.getRecentImages();
  }

  @Post("images/presign")
  async presignImageUpload(@Headers("x-user-id") userId: string, @Body() body: PresignImageDto) {
    if (!userId) {
      throw new BadRequestException("x-user-id header is required");
    }

    return this.restaurantService.createTempImagePresign(userId, body.contentType, body.originalName);
  }

  @Post("images/confirm")
  async confirmImageUpload(@Headers("x-user-id") userId: string, @Body() body: ConfirmImageDto) {
    if (!userId) {
      throw new BadRequestException("x-user-id header is required");
    }

    try {
      const imageUrl = await this.restaurantService.confirmTempImage(userId, body.key);
      return { success: true, imageUrl };
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : "Invalid key");
    }
  }

  @Delete("images")
  async deleteImage(@Headers("x-user-id") userId: string, @Body() body: DeleteImageDto) {
    if (!userId) {
      throw new BadRequestException("x-user-id header is required");
    }

    try {
      await this.restaurantService.deleteImageByUrl(userId, body.imageUrl);
      return { success: true };
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : "Delete failed");
    }
  }

  @Patch("images")
  async replaceImage(@Headers("x-user-id") userId: string, @Body() body: UpdateImageDto) {
    if (!userId) {
      throw new BadRequestException("x-user-id header is required");
    }

    try {
      const imageUrl = await this.restaurantService.replaceImageByUrl(userId, body.imageUrl, body.newImageUrl);
      return { success: true, imageUrl };
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : "Update failed");
    }
  }

  @Post("images")
  @UseInterceptors(
    FileInterceptor("image", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, callback) => {
        const contentType = (file.mimetype ?? "").split(";")[0].trim().toLowerCase();
        if (!ALLOWED_MIME_TYPES.includes(contentType)) {
          callback(
            new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(@Headers("x-user-id") userId: string, @UploadedFile() file: Express.Multer.File) {
    if (!userId) {
      throw new BadRequestException("x-user-id header is required");
    }

    if (!file) {
      throw new BadRequestException("image file is required");
    }

    const imageUrl = await this.restaurantService.uploadTempImageFromFile(userId, file);

    return { success: true, imageUrl };
  }
}
