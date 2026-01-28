import { type INestApplicationContext } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";

import { type ServerOptions } from "socket.io";

export class SocketIoAdapter extends IoAdapter {
  constructor(private app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): ReturnType<IoAdapter["createIOServer"]> {
    const corsOptions = {
      origin: process.env.CLIENT_URL?.split(",") || ["http://localhost:5173", "http://localhost:3000"],
      credentials: true,
    };

    const optionsWithCors = {
      ...options,
      cors: corsOptions,
    } as ServerOptions;

    return super.createIOServer(port, optionsWithCors);
  }
}
