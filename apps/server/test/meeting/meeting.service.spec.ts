import { MeetingService } from "../../src/meeting/meeting.service";

describe("MeetingService", () => {
  const makeService = () => {
    const dailyScrumQuestionRepository = {
      clear: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 1, question: "오늘의 기분은 어떤가요?" },
          { id: 2, question: "어제 어떤 일이 있었나요?" },
        ]),
      }),
    };

    const retrospectiveTemplateRepository = {
      clear: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 1,
          theme: "테스트 테마",
          content: "테스트 내용",
        }),
      }),
    };

    const service = new MeetingService(dailyScrumQuestionRepository as never, retrospectiveTemplateRepository as never);

    return { service, dailyScrumQuestionRepository, retrospectiveTemplateRepository };
  };

  describe("getRandomDailyScrumQuestion", () => {
    it("지정된 개수만큼 랜덤 질문을 반환해야 함", async () => {
      const { service, dailyScrumQuestionRepository } = makeService();

      const result = await service.getRandomDailyScrumQuestion(2);

      expect(result).toHaveLength(2);
      expect(dailyScrumQuestionRepository.createQueryBuilder).toHaveBeenCalledWith("question");
    });

    it("0개 요청 시 빈 배열을 반환해야 함", async () => {
      const { service, dailyScrumQuestionRepository } = makeService();
      dailyScrumQuestionRepository.createQueryBuilder.mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getRandomDailyScrumQuestion(0);

      expect(result).toHaveLength(0);
    });

    it("RAND()로 정렬해야 함", async () => {
      const { service, dailyScrumQuestionRepository } = makeService();
      const orderByMock = jest.fn().mockReturnThis();
      dailyScrumQuestionRepository.createQueryBuilder.mockReturnValue({
        orderBy: orderByMock,
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      await service.getRandomDailyScrumQuestion(3);

      expect(orderByMock).toHaveBeenCalledWith("RAND()");
    });
  });

  describe("getRandomRetrospectiveTemplate", () => {
    it("랜덤 회고 템플릿을 반환해야 함", async () => {
      const { service, retrospectiveTemplateRepository } = makeService();

      const result = await service.getRandomRetrospectiveTemplate();

      expect(result).toBeDefined();
      expect(result?.theme).toBe("테스트 테마");
      expect(retrospectiveTemplateRepository.createQueryBuilder).toHaveBeenCalledWith("template");
    });

    it("템플릿이 없으면 null을 반환해야 함", async () => {
      const { service, retrospectiveTemplateRepository } = makeService();
      retrospectiveTemplateRepository.createQueryBuilder.mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      const result = await service.getRandomRetrospectiveTemplate();

      expect(result).toBeNull();
    });

    it("RAND()로 정렬해야 함", async () => {
      const { service, retrospectiveTemplateRepository } = makeService();
      const orderByMock = jest.fn().mockReturnThis();
      retrospectiveTemplateRepository.createQueryBuilder.mockReturnValue({
        orderBy: orderByMock,
        getOne: jest.fn().mockResolvedValue(null),
      });

      await service.getRandomRetrospectiveTemplate();

      expect(orderByMock).toHaveBeenCalledWith("RAND()");
    });
  });

  describe("onModuleInit", () => {
    it("모듈 초기화 시 시드 데이터를 저장해야 함", async () => {
      const { service, dailyScrumQuestionRepository, retrospectiveTemplateRepository } = makeService();

      await service.onModuleInit();

      expect(dailyScrumQuestionRepository.clear).toHaveBeenCalled();
      expect(dailyScrumQuestionRepository.save).toHaveBeenCalled();
      expect(retrospectiveTemplateRepository.clear).toHaveBeenCalled();
      expect(retrospectiveTemplateRepository.save).toHaveBeenCalled();
    });
  });
});
