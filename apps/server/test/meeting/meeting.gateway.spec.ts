import { MeetingEventType } from "@shared/types";
import { type Server, type Socket } from "socket.io";

import { MeetingGateway } from "../../src/meeting/meeting.gateway";
import { type MeetingService } from "../../src/meeting/meeting.service";

describe("MeetingGateway", () => {
  let gateway: MeetingGateway;
  let meetingService: jest.Mocked<MeetingService>;
  let mockServer: jest.Mocked<Server>;

  const createMockSocket = (id: string): jest.Mocked<Socket> =>
    ({
      id,
      emit: jest.fn(),
    }) as unknown as jest.Mocked<Socket>;

  beforeEach(() => {
    meetingService = {
      getRandomDailyScrumQuestion: jest.fn().mockResolvedValue([
        { id: 1, question: "오늘의 기분은 어떤가요?" },
        { id: 2, question: "어제 어떤 일이 있었나요?" },
      ]),
      getRandomRetrospectiveTemplate: jest.fn().mockResolvedValue({
        id: 1,
        theme: "테스트 테마",
        content: "테스트 내용",
      }),
    } as unknown as jest.Mocked<MeetingService>;

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    gateway = new MeetingGateway(meetingService);
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getDailyScrumQuestion", () => {
    it("유효한 요청 시 질문을 방에 브로드캐스트해야 함", async () => {
      const mockSocket = createMockSocket("client-1");

      await gateway.getDailyScrumQuestion(mockSocket, {
        roomId: "meeting (web 1)",
        num: 3,
      });

      expect(meetingService.getRandomDailyScrumQuestion).toHaveBeenCalledWith(3);
      expect(mockServer.to).toHaveBeenCalledWith("meeting (web 1)");
      expect(mockServer.emit).toHaveBeenCalledWith(
        MeetingEventType.DAILY_SCRUM_QUESTION_SYNC,
        expect.objectContaining({
          questions: expect.any(Array),
        }),
      );
    });

    it("roomId가 없으면 무시해야 함", async () => {
      const mockSocket = createMockSocket("client-1");

      await gateway.getDailyScrumQuestion(mockSocket, {
        roomId: "",
        num: 3,
      });

      expect(meetingService.getRandomDailyScrumQuestion).not.toHaveBeenCalled();
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it("num이 없으면 무시해야 함", async () => {
      const mockSocket = createMockSocket("client-1");

      await gateway.getDailyScrumQuestion(mockSocket, {
        roomId: "meeting (web 1)",
        num: 0,
      });

      expect(meetingService.getRandomDailyScrumQuestion).not.toHaveBeenCalled();
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it("payload가 없으면 무시해야 함", async () => {
      const mockSocket = createMockSocket("client-1");

      await gateway.getDailyScrumQuestion(mockSocket, undefined as never);

      expect(meetingService.getRandomDailyScrumQuestion).not.toHaveBeenCalled();
    });

    it("서비스 에러 시 클라이언트에 에러를 전송해야 함", async () => {
      const mockSocket = createMockSocket("client-1");
      meetingService.getRandomDailyScrumQuestion.mockRejectedValue(new Error("DB error"));

      await gateway.getDailyScrumQuestion(mockSocket, {
        roomId: "meeting (web 1)",
        num: 3,
      });

      expect(mockSocket.emit).toHaveBeenCalledWith("error", {
        message: "Failed to get daily scrum questions",
      });
    });
  });

  describe("getRetrospectiveTemplate", () => {
    it("유효한 요청 시 템플릿을 방에 브로드캐스트해야 함", async () => {
      const mockSocket = createMockSocket("client-1");

      await gateway.getRetrospectiveTemplate(mockSocket, {
        roomId: "meeting (web 1)",
      });

      expect(meetingService.getRandomRetrospectiveTemplate).toHaveBeenCalled();
      expect(mockServer.to).toHaveBeenCalledWith("meeting (web 1)");
      expect(mockServer.emit).toHaveBeenCalledWith(
        MeetingEventType.RETROSPECTIVE_TEMPLATE_SYNC,
        expect.objectContaining({
          template: expect.any(Object),
        }),
      );
    });

    it("roomId가 없으면 무시해야 함", async () => {
      const mockSocket = createMockSocket("client-1");

      await gateway.getRetrospectiveTemplate(mockSocket, {
        roomId: "",
      });

      expect(meetingService.getRandomRetrospectiveTemplate).not.toHaveBeenCalled();
      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it("payload가 없으면 무시해야 함", async () => {
      const mockSocket = createMockSocket("client-1");

      await gateway.getRetrospectiveTemplate(mockSocket, undefined as never);

      expect(meetingService.getRandomRetrospectiveTemplate).not.toHaveBeenCalled();
    });

    it("서비스 에러 시 클라이언트에 에러를 전송해야 함", async () => {
      const mockSocket = createMockSocket("client-1");
      meetingService.getRandomRetrospectiveTemplate.mockRejectedValue(new Error("DB error"));

      await gateway.getRetrospectiveTemplate(mockSocket, {
        roomId: "meeting (web 1)",
      });

      expect(mockSocket.emit).toHaveBeenCalledWith("error", {
        message: "Failed to get retrospective template",
      });
    });
  });

  describe("resetDailyScrumQuestions", () => {
    it("유효한 요청 시 리셋 이벤트를 방에 브로드캐스트해야 함", () => {
      const mockSocket = createMockSocket("client-1");

      gateway.resetDailyScrumQuestions(mockSocket, { roomId: "meeting (web 1)" });

      expect(mockServer.to).toHaveBeenCalledWith("meeting (web 1)");
      expect(mockServer.emit).toHaveBeenCalledWith(MeetingEventType.DAILY_SCRUM_QUESTION_RESET);
    });

    it("roomId가 없으면 무시해야 함", () => {
      const mockSocket = createMockSocket("client-1");

      gateway.resetDailyScrumQuestions(mockSocket, { roomId: "" });

      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it("payload가 없으면 무시해야 함", () => {
      const mockSocket = createMockSocket("client-1");

      gateway.resetDailyScrumQuestions(mockSocket, undefined as never);

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  describe("resetRetrospectiveTemplate", () => {
    it("유효한 요청 시 리셋 이벤트를 방에 브로드캐스트해야 함", () => {
      const mockSocket = createMockSocket("client-1");

      gateway.resetRetrospectiveTemplate(mockSocket, { roomId: "meeting (web 1)" });

      expect(mockServer.to).toHaveBeenCalledWith("meeting (web 1)");
      expect(mockServer.emit).toHaveBeenCalledWith(MeetingEventType.RETROSPECTIVE_TEMPLATE_RESET);
    });

    it("roomId가 없으면 무시해야 함", () => {
      const mockSocket = createMockSocket("client-1");

      gateway.resetRetrospectiveTemplate(mockSocket, { roomId: "" });

      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it("payload가 없으면 무시해야 함", () => {
      const mockSocket = createMockSocket("client-1");

      gateway.resetRetrospectiveTemplate(mockSocket, undefined as never);

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });
});
