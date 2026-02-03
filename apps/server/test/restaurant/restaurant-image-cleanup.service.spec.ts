import { type EventEmitter2 } from "@nestjs/event-emitter";

import { RestaurantImageCleanupService } from "../../src/restaurant/restaurant-image-cleanup.service";
import { type S3Service } from "../../src/storage/s3.service";

describe("RestaurantImageCleanupService", () => {
  const createQueryBuilderMock = (getManyResult: unknown[] = []) => {
    const mock = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(getManyResult),
    };
    return mock;
  };

  const makeService = (overrides?: {
    s3?: Partial<S3Service>;
    queryBuilderMock?: ReturnType<typeof createQueryBuilderMock>;
  }) => {
    const s3Service: Partial<S3Service> = {
      listObjects: jest.fn().mockResolvedValue([]),
      deleteObjects: jest.fn().mockResolvedValue(undefined),
      ...overrides?.s3,
    };

    const queryBuilderMock = overrides?.queryBuilderMock ?? createQueryBuilderMock();

    const restaurantImageRepository = {
      delete: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    const eventEmitter: Partial<EventEmitter2> = {
      emit: jest.fn(),
    };

    const service = new RestaurantImageCleanupService(
      s3Service as S3Service,
      restaurantImageRepository as never,
      eventEmitter as EventEmitter2,
    );

    return { service, s3Service, restaurantImageRepository, queryBuilderMock, eventEmitter };
  };

  describe("cleanupOrphanRecords (DB orphan 정리)", () => {
    it("S3에 없는 파일의 DB 레코드를 삭제해야 함", async () => {
      const queryBuilderMock = createQueryBuilderMock();
      queryBuilderMock.getMany
        .mockResolvedValueOnce([
          { id: 1, key: "restaurant-images/u1/a.jpg" },
          { id: 2, key: "restaurant-images/u1/b.jpg" },
        ])
        .mockResolvedValueOnce([]);

      const { service, s3Service, restaurantImageRepository } = makeService({
        s3: {
          listObjects: jest.fn().mockResolvedValue([{ key: "restaurant-images/u1/b.jpg" }]),
          deleteObjects: jest.fn().mockResolvedValue(undefined),
        },
        queryBuilderMock,
      });

      await (service as never as { cleanupOrphanRecords: () => Promise<void> }).cleanupOrphanRecords();

      expect(s3Service.listObjects).toHaveBeenCalled();
      expect(restaurantImageRepository.delete).toHaveBeenCalledTimes(1);
    });

    it("S3 목록 조회 실패 시 에러 없이 처리해야 함", async () => {
      const { service, restaurantImageRepository } = makeService({
        s3: {
          listObjects: jest.fn().mockRejectedValue(new Error("S3 down")),
          deleteObjects: jest.fn().mockResolvedValue(undefined),
        },
      });

      await expect(
        (service as never as { cleanupOrphanRecords: () => Promise<void> }).cleanupOrphanRecords(),
      ).resolves.not.toThrow();

      expect(restaurantImageRepository.delete).not.toHaveBeenCalled();
    });

    it("DB 삭제 실패 시 에러 없이 계속 진행해야 함", async () => {
      const queryBuilderMock = createQueryBuilderMock();
      queryBuilderMock.getMany
        .mockResolvedValueOnce([{ id: 1, key: "restaurant-images/u1/a.jpg" }])
        .mockResolvedValueOnce([]);

      const { service, restaurantImageRepository } = makeService({
        s3: {
          listObjects: jest.fn().mockResolvedValue([]),
          deleteObjects: jest.fn().mockResolvedValue(undefined),
        },
        queryBuilderMock,
      });

      restaurantImageRepository.delete.mockRejectedValueOnce(new Error("DB error"));

      await expect(
        (service as never as { cleanupOrphanRecords: () => Promise<void> }).cleanupOrphanRecords(),
      ).resolves.not.toThrow();
    });

    it("모든 DB 레코드가 S3에 존재하면 삭제하지 않아야 함", async () => {
      const queryBuilderMock = createQueryBuilderMock();
      queryBuilderMock.getMany
        .mockResolvedValueOnce([
          { id: 1, key: "restaurant-images/u1/a.jpg" },
          { id: 2, key: "restaurant-images/u1/b.jpg" },
        ])
        .mockResolvedValueOnce([]);

      const { service, restaurantImageRepository } = makeService({
        s3: {
          listObjects: jest
            .fn()
            .mockResolvedValue([{ key: "restaurant-images/u1/a.jpg" }, { key: "restaurant-images/u1/b.jpg" }]),
          deleteObjects: jest.fn().mockResolvedValue(undefined),
        },
        queryBuilderMock,
      });

      await (service as never as { cleanupOrphanRecords: () => Promise<void> }).cleanupOrphanRecords();

      expect(restaurantImageRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe("cleanupOrphanS3Files (S3 orphan 정리)", () => {
    it("DB에 레코드가 없는 S3 파일을 삭제해야 함", async () => {
      const queryBuilderMock = createQueryBuilderMock();
      queryBuilderMock.getMany.mockResolvedValueOnce([{ key: "restaurant-images/u1/b.webp" }]);

      const { service, s3Service } = makeService({
        s3: {
          listObjects: jest
            .fn()
            .mockResolvedValue([
              { key: "restaurant-images/u1/a.webp" },
              { key: "restaurant-images/u1/b.webp" },
              { key: "restaurant-images/u1/c.webp" },
            ]),
          deleteObjects: jest.fn().mockResolvedValue(undefined),
        },
        queryBuilderMock,
      });

      await (service as never as { cleanupOrphanS3Files: () => Promise<void> }).cleanupOrphanS3Files();

      expect(s3Service.deleteObjects).toHaveBeenCalledWith([
        "restaurant-images/u1/a.webp",
        "restaurant-images/u1/c.webp",
      ]);
    });

    it("모든 S3 파일이 DB에 존재하면 삭제하지 않아야 함", async () => {
      const queryBuilderMock = createQueryBuilderMock();
      queryBuilderMock.getMany.mockResolvedValueOnce([{ key: "restaurant-images/u1/a.webp" }]);

      const { service, s3Service } = makeService({
        s3: {
          listObjects: jest.fn().mockResolvedValue([{ key: "restaurant-images/u1/a.webp" }]),
          deleteObjects: jest.fn().mockResolvedValue(undefined),
        },
        queryBuilderMock,
      });

      await (service as never as { cleanupOrphanS3Files: () => Promise<void> }).cleanupOrphanS3Files();

      expect(s3Service.deleteObjects).not.toHaveBeenCalled();
    });

    it("S3 버킷이 비어있으면 아무 작업도 하지 않아야 함", async () => {
      const { service, s3Service, restaurantImageRepository } = makeService({
        s3: {
          listObjects: jest.fn().mockResolvedValue([]),
          deleteObjects: jest.fn().mockResolvedValue(undefined),
        },
      });

      await (service as never as { cleanupOrphanS3Files: () => Promise<void> }).cleanupOrphanS3Files();

      expect(s3Service.deleteObjects).not.toHaveBeenCalled();
      expect(restaurantImageRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it("S3 목록 조회 실패 시 에러 없이 처리해야 함", async () => {
      const { service, s3Service } = makeService({
        s3: {
          listObjects: jest.fn().mockRejectedValue(new Error("S3 error")),
          deleteObjects: jest.fn().mockResolvedValue(undefined),
        },
      });

      await expect(
        (service as never as { cleanupOrphanS3Files: () => Promise<void> }).cleanupOrphanS3Files(),
      ).resolves.not.toThrow();

      expect(s3Service.deleteObjects).not.toHaveBeenCalled();
    });

    it("S3 삭제 실패 시 에러 없이 처리해야 함", async () => {
      const queryBuilderMock = createQueryBuilderMock();
      queryBuilderMock.getMany.mockResolvedValueOnce([]);

      const { service } = makeService({
        s3: {
          listObjects: jest.fn().mockResolvedValue([{ key: "restaurant-images/u1/a.webp" }]),
          deleteObjects: jest.fn().mockRejectedValue(new Error("delete failed")),
        },
        queryBuilderMock,
      });

      await expect(
        (service as never as { cleanupOrphanS3Files: () => Promise<void> }).cleanupOrphanS3Files(),
      ).resolves.not.toThrow();
    });
  });
});
