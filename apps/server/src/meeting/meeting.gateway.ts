import { Logger } from "@nestjs/common";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import {
  MeetingEventType,
  type RandomDailyScrumQuestionRequest,
  type RandomDailyScrumQuestionsResponse,
  type RandomRetrospectiveTemplateRequest,
  type RandomRetrospectiveTemplateResponse,
} from "@shared/types";
import { Server, Socket } from "socket.io";

import { MeetingService } from "./meeting.service";

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL?.split(",") || ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
})
export class MeetingGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MeetingGateway.name);

  constructor(private readonly meetingService: MeetingService) {}

  @SubscribeMessage(MeetingEventType.DAILY_SCRUM_QUESTION_UPDATE)
  async getDailyScrumQuestion(client: Socket, payload: RandomDailyScrumQuestionRequest) {
    if (!payload || !payload.roomId || !payload.num) {
      this.logger.warn(`⚠️ DAILY_SCRUM_QUESTION_UPDATE called without roomId or num from client: ${client.id}`);
      return;
    }

    try {
      const questions = await this.meetingService.getRandomDailyScrumQuestion(payload.num);
      this.server.to(payload.roomId).emit(MeetingEventType.DAILY_SCRUM_QUESTION_SYNC, {
        questions,
      } as RandomDailyScrumQuestionsResponse);
    } catch (error) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `❗ Failed to get daily scrum questions for room ${payload.roomId} from client ${client.id}`,
        trace,
      );
      client.emit("error", { message: "Failed to get daily scrum questions" });
    }
  }

  @SubscribeMessage(MeetingEventType.RETROSPECTIVE_TEMPLATE_UPDATE)
  async getRetrospectiveTemplate(client: Socket, payload: RandomRetrospectiveTemplateRequest) {
    if (!payload || !payload.roomId) {
      this.logger.warn(`⚠️ RETROSPECTIVE_TEMPLATE_UPDATE called without roomId from client: ${client.id}`);
      return;
    }

    try {
      const template = await this.meetingService.getRandomRetrospectiveTemplate();
      this.server.to(payload.roomId).emit(MeetingEventType.RETROSPECTIVE_TEMPLATE_SYNC, {
        template,
      } as RandomRetrospectiveTemplateResponse);
    } catch (error) {
      const trace = error instanceof Error ? error.stack : String(error);
      this.logger.error(
        `❗ Failed to get retrospective template for room ${payload.roomId} from client ${client.id}`,
        trace,
      );
      client.emit("error", { message: "Failed to get retrospective template" });
    }
  }
}
