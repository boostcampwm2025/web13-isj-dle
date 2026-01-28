import { BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { type EventEmitter2 } from "@nestjs/event-emitter";

import { type DataSource } from "typeorm";

import { type RestaurantImageEntity } from "../../src/restaurant/restaurant-image.entity";
import { RestaurantService } from "../../src/restaurant/restaurant.service";
import { type S3Service } from "../../src/storage/s3.service";
import { type UserManager } from "../../src/user/user-manager.service";

describe("RestaurantService", () => {
  const makeService = (overrides?: {
    s3?: Partial<S3Service>;
    dataSource?: Partial<DataSource>;
    repo?: Partial<{ findOne: unknown; delete: unknown; count: unknown; save: unknown }>;
  }) => {
    const s3Service: Partial<S3Service> = {
      getBucket: () => "test-bucket",
      getTempPrefix: () => "temp/",
      isTempKey: (key: string) => key.startsWith("temp/"),
      deleteObjects: jest.fn().mockResolvedValue(undefined),
      getPublicUrl: (key: string) => `https://cdn.example.com/${key}`,
      ...overrides?.s3,
    };

    const userManager: Partial<UserManager> = {
      getSession: () => ({ nickname: "nick" }) as never,
    };

    const eventEmitter: Partial<EventEmitter2> = {
      emit: jest.fn(),
    };

    const restaurantImageRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      save: jest.fn(),
      ...overrides?.repo,
    };

    const managerRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const manager = {
      getRepository: jest.fn().mockReturnValue(managerRepo),
    };

    const dataSource: Partial<DataSource> = {
      transaction: jest.fn((runInTransaction: (manager: unknown) => unknown) => {
        return runInTransaction(manager);
      }) as unknown as DataSource["transaction"],
    };

    const service = new RestaurantService(
      s3Service as S3Service,
      userManager as UserManager,
      dataSource as DataSource,
      eventEmitter as EventEmitter2,
      restaurantImageRepository as never,
    );

    return { service, s3Service, restaurantImageRepository, dataSource, managerRepo, manager, eventEmitter };
  };

  describe("deleteImageByUrl", () => {
    test("temp 키는 S3에서만 삭제함", async () => {
      const { service, s3Service } = makeService();

      const imageUrl = "temp/restaurant-images/u1/a.jpg";
      await service.deleteImageByUrl("u1", imageUrl);

      expect(s3Service.deleteObjects).toHaveBeenCalledWith(["temp/restaurant-images/u1/a.jpg"]);
    });

    test("temp 키 삭제 실패 시 500 에러를 던짐", async () => {
      const { service, s3Service } = makeService({
        s3: { deleteObjects: jest.fn().mockRejectedValue(new Error("nope")) },
      });

      await expect(service.deleteImageByUrl("u1", "temp/restaurant-images/u1/a.jpg")).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );

      expect(s3Service.deleteObjects).toHaveBeenCalledTimes(1);
    });

    test("DB 삭제 후 트랜잭션 외부에서 S3를 삭제함", async () => {
      const { service, s3Service, dataSource, managerRepo } = makeService();

      managerRepo.findOne.mockResolvedValue({
        id: 123,
        key: "restaurant-images/u1/a.jpg",
      } satisfies Partial<RestaurantImageEntity>);

      await service.deleteImageByUrl("u1", "restaurant-images/u1/a.jpg");

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(managerRepo.delete).toHaveBeenCalledWith({ id: 123 });
      expect(s3Service.deleteObjects).toHaveBeenCalledWith(["restaurant-images/u1/a.jpg"]);
    });

    test("S3 삭제 실패 시 에러를 던지지 않음 (fire and forget)", async () => {
      const deleteObjects = jest.fn().mockRejectedValue(new Error("S3 error"));
      const { service, managerRepo } = makeService({
        s3: { deleteObjects },
      });

      managerRepo.findOne.mockResolvedValue({
        id: 123,
        key: "restaurant-images/u1/a.jpg",
      } satisfies Partial<RestaurantImageEntity>);

      await service.deleteImageByUrl("u1", "restaurant-images/u1/a.jpg");

      expect(managerRepo.delete).toHaveBeenCalledWith({ id: 123 });
      expect(deleteObjects).toHaveBeenCalledWith(["restaurant-images/u1/a.jpg"]);
    });

    test("DB 트랜잭션 실패 시 500 에러를 던짐", async () => {
      const s3Service: Partial<S3Service> = {
        getBucket: () => "test-bucket",
        getTempPrefix: () => "temp/",
        isTempKey: (key: string) => key.startsWith("temp/"),
        deleteObjects: jest.fn().mockResolvedValue(undefined),
        getPublicUrl: (key: string) => `https://cdn.example.com/${key}`,
      };

      const userManager: Partial<UserManager> = {
        getSession: () => ({ nickname: "nick" }) as never,
      };

      const eventEmitter: Partial<EventEmitter2> = {
        emit: jest.fn(),
      };

      const restaurantImageRepository = {
        findOne: jest.fn().mockResolvedValue(null),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        save: jest.fn(),
      };

      const dataSource: Partial<DataSource> = {
        transaction: jest.fn().mockRejectedValue(new Error("DB error")) as unknown as DataSource["transaction"],
      };

      const service = new RestaurantService(
        s3Service as S3Service,
        userManager as UserManager,
        dataSource as DataSource,
        eventEmitter as EventEmitter2,
        restaurantImageRepository as never,
      );

      await expect(service.deleteImageByUrl("u1", "restaurant-images/u1/a.jpg")).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe("validateContentType", () => {
    test("jpeg를 허용함", () => {
      const { service } = makeService();
      expect(() => service.validateContentType("image/jpeg")).not.toThrow();
    });

    test("png를 허용함", () => {
      const { service } = makeService();
      expect(() => service.validateContentType("image/png")).not.toThrow();
    });

    test("webp를 허용함", () => {
      const { service } = makeService();
      expect(() => service.validateContentType("image/webp")).not.toThrow();
    });

    test("gif를 거부함", () => {
      const { service } = makeService();
      expect(() => service.validateContentType("image/gif")).toThrow(BadRequestException);
    });

    test("charset이 포함된 content-type을 처리함", () => {
      const { service } = makeService();
      expect(() => service.validateContentType("image/jpeg; charset=utf-8")).not.toThrow();
    });
  });

  describe("extractKeyFromUrl", () => {
    test("raw 키와 S3 URL 스타일을 지원함", () => {
      const { service } = makeService();

      const asAny = service as unknown as { extractKeyFromUrl: (s: string) => string | null };

      expect(asAny.extractKeyFromUrl("restaurant-images/u1/a.jpg")).toBe("restaurant-images/u1/a.jpg");

      expect(
        asAny.extractKeyFromUrl("https://test-bucket.s3.ap-northeast-2.amazonaws.com/restaurant-images/u1/a.jpg"),
      ).toBe("restaurant-images/u1/a.jpg");

      expect(
        asAny.extractKeyFromUrl("https://s3.ap-northeast-2.amazonaws.com/test-bucket/restaurant-images/u1/a.jpg"),
      ).toBe("restaurant-images/u1/a.jpg");
    });

    test("CloudFront URL을 처리함", () => {
      const { service } = makeService();
      const asAny = service as unknown as { extractKeyFromUrl: (s: string) => string | null };

      expect(asAny.extractKeyFromUrl("https://cdn.example.com/restaurant-images/u1/a.webp")).toBe(
        "restaurant-images/u1/a.webp",
      );
    });
  });
});
