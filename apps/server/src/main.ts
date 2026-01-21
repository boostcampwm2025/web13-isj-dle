import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import type { Server } from "http";

import { AppModule } from "./app.module";
import { TldrawService } from "./tldraw/tldraw.service";
import { YjsService } from "./yjs/yjs.service";

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.CLIENT_URL?.split(",") || true,
    credentials: true,
  });

  const httpServer = app.getHttpServer() as Server;
  const yjsService = app.get(YjsService);
  const tldrawService = app.get(TldrawService);

  yjsService.attachToServer(httpServer);
  tldrawService.attachToServer(httpServer);

  await app.listen(process.env.PORT ?? 3000);
};

bootstrap().catch((err) => {
  console.log(err);
  process.exit(1);
});
