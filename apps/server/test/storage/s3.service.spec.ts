import { type ConfigService } from "@nestjs/config";

import { type MetricsService } from "../../src/metrics/metrics.service";
import { S3Service } from "../../src/storage/s3.service";

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectsCommand: jest.fn(),
  CopyObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
}));

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://presigned-url.example.com"),
}));

describe("S3Service", () => {
  const makeService = (configOverrides?: Record<string, string>) => {
    const configService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          S3_BUCKET: "test-bucket",
          S3_REGION: "ap-northeast-2",
          S3_TEMP_PREFIX: "temp/",
          S3_PUBLIC_BASE_URL: "https://cdn.example.com",
          ...configOverrides,
        };
        return config[key];
      }),
    };

    const metricsService: Partial<MetricsService> = {
      recordS3Request: jest.fn(),
      recordS3Upload: jest.fn(),
    };

    const service = new S3Service(configService as ConfigService, metricsService as MetricsService);

    return { service, configService, metricsService };
  };

  describe("생성자", () => {
    it("S3_BUCKET이 없으면 에러를 발생시켜야 함", () => {
      expect(
        () =>
          new S3Service(
            { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
            {} as MetricsService,
          ),
      ).toThrow("S3_BUCKET is required");
    });

    it("S3_REGION과 S3_ENDPOINT 둘 다 없으면 에러를 발생시켜야 함", () => {
      const configService: Partial<ConfigService> = {
        get: jest.fn((key: string) => {
          if (key === "S3_BUCKET") return "test-bucket";
          return undefined;
        }),
      };

      expect(() => new S3Service(configService as ConfigService, {} as MetricsService)).toThrow(
        "S3_REGION is required",
      );
    });
  });

  describe("getTempPrefix", () => {
    it("temp prefix를 반환해야 함", () => {
      const { service } = makeService();

      expect(service.getTempPrefix()).toBe("temp/");
    });

    it("빈 prefix는 빈 문자열을 반환해야 함", () => {
      const { service } = makeService({ S3_TEMP_PREFIX: "" });

      expect(service.getTempPrefix()).toBe("");
    });
  });

  describe("getBucket", () => {
    it("bucket 이름을 반환해야 함", () => {
      const { service } = makeService();

      expect(service.getBucket()).toBe("test-bucket");
    });
  });

  describe("isTempKey", () => {
    it("temp prefix로 시작하는 키는 true를 반환해야 함", () => {
      const { service } = makeService();

      expect(service.isTempKey("temp/image.jpg")).toBe(true);
    });

    it("temp prefix로 시작하지 않는 키는 false를 반환해야 함", () => {
      const { service } = makeService();

      expect(service.isTempKey("images/photo.jpg")).toBe(false);
    });

    it("temp prefix가 비어있으면 항상 false를 반환해야 함", () => {
      const { service } = makeService({ S3_TEMP_PREFIX: "" });

      expect(service.isTempKey("temp/image.jpg")).toBe(false);
    });
  });

  describe("getPublicUrl", () => {
    it("public base URL이 설정되어 있으면 해당 URL을 사용해야 함", () => {
      const { service } = makeService();

      const url = service.getPublicUrl("images/photo.jpg");

      expect(url).toBe("https://cdn.example.com/images/photo.jpg");
    });

    it("public base URL 끝의 슬래시를 제거해야 함", () => {
      const { service } = makeService({ S3_PUBLIC_BASE_URL: "https://cdn.example.com/" });

      const url = service.getPublicUrl("images/photo.jpg");

      expect(url).toBe("https://cdn.example.com/images/photo.jpg");
    });

    it("public base URL이 없으면 S3 URL을 생성해야 함", () => {
      const { service } = makeService({ S3_PUBLIC_BASE_URL: "" });

      const url = service.getPublicUrl("images/photo.jpg");

      expect(url).toBe("https://test-bucket.s3.ap-northeast-2.amazonaws.com/images/photo.jpg");
    });
  });

  describe("deleteObjects", () => {
    it("빈 배열이면 아무 작업도 하지 않아야 함", async () => {
      const { service } = makeService();

      await expect(service.deleteObjects([])).resolves.not.toThrow();
    });

    it("공백만 있는 키는 무시해야 함", async () => {
      const { service } = makeService();

      await expect(service.deleteObjects(["", "  ", "\t"])).resolves.not.toThrow();
    });
  });

  describe("copyObject", () => {
    it("sourceKey가 비어있으면 에러를 발생시켜야 함", async () => {
      const { service } = makeService();

      await expect(service.copyObject({ sourceKey: "", destinationKey: "dest.jpg" })).rejects.toThrow(
        "copyObject requires sourceKey and destinationKey",
      );
    });

    it("destinationKey가 비어있으면 에러를 발생시켜야 함", async () => {
      const { service } = makeService();

      await expect(service.copyObject({ sourceKey: "src.jpg", destinationKey: "" })).rejects.toThrow(
        "copyObject requires sourceKey and destinationKey",
      );
    });

    it("sourceKey와 destinationKey가 같으면 아무 작업도 하지 않아야 함", async () => {
      const { service } = makeService();

      await expect(service.copyObject({ sourceKey: "same.jpg", destinationKey: "same.jpg" })).resolves.not.toThrow();
    });
  });
});
