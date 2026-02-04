import { RestaurantImageCleanupService } from "src/restaurant/restaurant-image-cleanup.service";
import { type S3Service } from "src/storage/s3.service";

describe("RestaurantImageCleanupService", () => {
  const makeService = (overrides?: { s3?: Partial<S3Service> }) => {
    const s3Service: Partial<S3Service> = {
      objectExists: jest.fn(),
      listObjects: jest.fn().mockResolvedValue([]),
      deleteObjects: jest.fn().mockResolvedValue(undefined),
      getTempPrefix: () => "temp/",
      ...overrides?.s3,
    };

    const restaurantImageRepository = {
      delete: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };

    const service = new RestaurantImageCleanupService(s3Service as S3Service, restaurantImageRepository as never);

    return { service, s3Service, restaurantImageRepository };
  };

  describe("cleanupOrphanRecords (DB orphan 정리)", () => {
    test("S3에 없는 파일의 DB 레코드를 삭제함", async () => {
      const { service, s3Service, restaurantImageRepository } = makeService();

      (service as never as { fetchBatch: jest.Mock }).fetchBatch = jest
        .fn()
        .mockResolvedValueOnce([
          { id: 1, key: "restaurant-images/u1/a.jpg" },
          { id: 2, key: "restaurant-images/u1/b.jpg" },
        ])
        .mockResolvedValueOnce([]);

      (s3Service.objectExists as jest.Mock)
        .mockResolvedValueOnce(false) // a.jpg 없음
        .mockResolvedValueOnce(true); // b.jpg 존재

      const stats = await service.cleanupOrphanRecords();

      expect(stats.deletedCount).toBe(1);
      expect(restaurantImageRepository.delete).toHaveBeenCalledTimes(1);
    });

    test("S3 연속 실패 시 정리를 중단함", async () => {
      const { service, s3Service, restaurantImageRepository } = makeService();

      (service as never as { fetchBatch: jest.Mock }).fetchBatch = jest
        .fn()
        .mockResolvedValueOnce([
          { id: 1, key: "restaurant-images/u1/a.jpg" },
          { id: 2, key: "restaurant-images/u1/b.jpg" },
          { id: 3, key: "restaurant-images/u1/c.jpg" },
          { id: 4, key: "restaurant-images/u1/d.jpg" },
        ])
        .mockResolvedValueOnce([]);

      (s3Service.objectExists as jest.Mock).mockRejectedValue(new Error("S3 down"));

      const stats = await service.cleanupOrphanRecords();

      expect(stats.failedCount).toBeGreaterThanOrEqual(3);
      expect(restaurantImageRepository.delete).not.toHaveBeenCalled();
    });

    test("DB 삭제 실패 시 해당 배치를 건너뜀", async () => {
      const { service, s3Service, restaurantImageRepository } = makeService();

      (service as never as { fetchBatch: jest.Mock }).fetchBatch = jest
        .fn()
        .mockResolvedValueOnce([{ id: 1, key: "restaurant-images/u1/a.jpg" }])
        .mockResolvedValueOnce([]);

      (s3Service.objectExists as jest.Mock).mockResolvedValueOnce(false);
      restaurantImageRepository.delete.mockRejectedValueOnce(new Error("DB error"));

      const stats = await service.cleanupOrphanRecords();

      expect(stats.skippedCount).toBe(1);
      expect(stats.deletedCount).toBe(0);
    });
  });

  describe("cleanupOrphanS3Files (S3 orphan 정리)", () => {
    test("DB에 레코드가 없는 S3 파일을 삭제함", async () => {
      const { service, s3Service, restaurantImageRepository } = makeService();

      (s3Service.listObjects as jest.Mock).mockResolvedValueOnce([
        { key: "restaurant-images/u1/a.webp" },
        { key: "restaurant-images/u1/b.webp" },
        { key: "restaurant-images/u1/c.webp" },
      ]);

      // b.webp만 DB에 존재
      restaurantImageRepository
        .createQueryBuilder()
        .getMany.mockResolvedValueOnce([{ key: "restaurant-images/u1/b.webp" }]);

      const stats = await service.cleanupOrphanS3Files();

      expect(stats.deletedCount).toBe(2);
      expect(s3Service.deleteObjects).toHaveBeenCalledWith([
        "restaurant-images/u1/a.webp",
        "restaurant-images/u1/c.webp",
      ]);
    });

    test("모든 S3 파일이 DB에 존재하면 삭제하지 않음", async () => {
      const { service, s3Service, restaurantImageRepository } = makeService();

      (s3Service.listObjects as jest.Mock).mockResolvedValueOnce([{ key: "restaurant-images/u1/a.webp" }]);

      restaurantImageRepository
        .createQueryBuilder()
        .getMany.mockResolvedValueOnce([{ key: "restaurant-images/u1/a.webp" }]);

      const stats = await service.cleanupOrphanS3Files();

      expect(stats.deletedCount).toBe(0);
      expect(s3Service.deleteObjects).not.toHaveBeenCalled();
    });

    test("S3 버킷이 비어있으면 아무 작업도 하지 않음", async () => {
      const { service, s3Service } = makeService();

      (s3Service.listObjects as jest.Mock).mockResolvedValueOnce([]);

      const stats = await service.cleanupOrphanS3Files();

      expect(stats.deletedCount).toBe(0);
      expect(stats.failedCount).toBe(0);
    });

    test("S3 목록 조회 실패 시 graceful하게 처리함", async () => {
      const { service } = makeService({
        s3: {
          listObjects: jest.fn().mockRejectedValue(new Error("S3 error")),
        },
      });

      const stats = await service.cleanupOrphanS3Files();

      expect(stats.failedCount).toBe(1);
      expect(stats.deletedCount).toBe(0);
    });

    test("S3 삭제 실패 시 graceful하게 처리함", async () => {
      const { service, restaurantImageRepository } = makeService({
        s3: {
          listObjects: jest.fn().mockResolvedValue([{ key: "restaurant-images/u1/a.webp" }]),
          deleteObjects: jest.fn().mockRejectedValue(new Error("delete failed")),
        },
      });

      restaurantImageRepository.createQueryBuilder().getMany.mockResolvedValueOnce([]);

      const stats = await service.cleanupOrphanS3Files();

      expect(stats.failedCount).toBe(1);
      expect(stats.deletedCount).toBe(0);
    });
  });
});
