import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AppController } from "./app.controller";
import { GameModule } from "./game/game.module";
import { LecternModule } from "./lectern/lectern.module";
import { LivekitModule } from "./livekit/livekit.module";
import { TldrawModule } from "./tldraw/tldraw.module";
import { UserModule } from "./user/user.module";
import { YjsModule } from "./yjs/yjs.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "mysql",
        host: configService.get<string>("DB_HOST"),
        port: configService.get<number>("DB_PORT"),
        username: configService.get<string>("DB_USERNAME"),
        password: configService.get<string>("DB_PASSWORD"),
        database: configService.get<string>("DB_NAME"),
        autoLoadEntities: true,
        synchronize: true,
        logging: false,
      }),
    }),
    GameModule,
    UserModule,
    LivekitModule,
    LecternModule,
    YjsModule,
    TldrawModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
