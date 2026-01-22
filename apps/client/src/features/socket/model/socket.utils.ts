import type { Socket } from "socket.io-client";

export const emitAck = <T>(socket: Socket, event: string, payload: object) =>
  new Promise<T>((resolve, reject) => {
    socket.timeout(5000).emit(event, payload, (err: unknown, res: T) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
