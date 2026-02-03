import { InternalServerErrorException } from "@nestjs/common";
import { type ConfigService } from "@nestjs/config";

import { LivekitService } from "../../src/livekit/livekit.service";

jest.mock("livekit-server-sdk", () => ({
  AccessToken: jest.fn().mockImplementation(() => ({
    addGrant: jest.fn(),
    toJwt: jest.fn().mockResolvedValue("mock-jwt-token"),
  })),
}));

describe("LivekitService", () => {
  let service: LivekitService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          LIVEKIT_API_KEY: "test-api-key",
          LIVEKIT_API_SECRET: "test-api-secret",
          LIVEKIT_URL: "wss://livekit.example.com",
        };
        return config[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new LivekitService(configService);
  });

  describe("생성자", () => {
    it("환경변수를 올바르게 로드해야 함", () => {
      expect(configService.getOrThrow).toHaveBeenCalledWith("LIVEKIT_API_KEY");
      expect(configService.getOrThrow).toHaveBeenCalledWith("LIVEKIT_API_SECRET");
      expect(configService.getOrThrow).toHaveBeenCalledWith("LIVEKIT_URL");
    });

    it("필수 환경변수가 없으면 에러를 발생시켜야 함", () => {
      const badConfigService = {
        getOrThrow: jest.fn().mockImplementation(() => {
          throw new Error("Config not found");
        }),
      } as unknown as jest.Mocked<ConfigService>;

      expect(() => new LivekitService(badConfigService)).toThrow();
    });
  });

  describe("generateToken", () => {
    it("토큰을 생성해야 함", async () => {
      const token = await service.generateToken("room-1", "user-1", "테스트유저");

      expect(token).toBe("mock-jwt-token");
    });

    it("토큰 생성 실패 시 InternalServerErrorException을 던져야 함", async () => {
      const { AccessToken } = jest.requireMock("livekit-server-sdk");
      AccessToken.mockImplementationOnce(() => ({
        addGrant: jest.fn(),
        toJwt: jest.fn().mockRejectedValue(new Error("Token generation failed")),
      }));

      const newService = new LivekitService(configService);

      await expect(newService.generateToken("room-1", "user-1", "테스트유저")).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("getLivekitUrl", () => {
    it("LiveKit URL을 반환해야 함", () => {
      const url = service.getLivekitUrl();

      expect(url).toBe("wss://livekit.example.com");
    });
  });
});
