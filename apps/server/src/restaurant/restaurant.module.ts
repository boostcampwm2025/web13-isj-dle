import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { StorageModule } from "../storage/storage.module";
import { UserModule } from "../user/user.module";
import { RestaurantImageCleanupService } from "./restaurant-image-cleanup.service";
import { RestaurantImageEntity } from "./restaurant-image.entity";
import { RestaurantImageGateway } from "./restaurant-image.gateway";
import { RestaurantController } from "./restaurant.controller";
import { RestaurantService } from "./restaurant.service";

@Module({
  imports: [StorageModule, UserModule, TypeOrmModule.forFeature([RestaurantImageEntity])],
  controllers: [RestaurantController],
  providers: [RestaurantService, RestaurantImageCleanupService, RestaurantImageGateway],
  exports: [RestaurantService],
})
export class RestaurantModule {}
