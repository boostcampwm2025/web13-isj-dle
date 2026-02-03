import { LivekitController } from "../../src/livekit/livekit.controller";
import { type LivekitService } from "../../src/livekit/livekit.service";

describe("LivekitController", () => {
  let controller: LivekitController;
  let livekitService: jest.Mocked<LivekitService>;

  beforeEach(() => {
    livekitService = {
      generateToken: jest.fn().mockResolvedValue("mock-jwt-token"),
      getLivekitUrl: jest.fn().mockReturnValue("wss://livekit.example.com"),
    } as unknown as jest.Mocked<LivekitService>;

    controller = new LivekitController(livekitService);
  });

  describe("getToken", () => {
    it("토큰과 URL을 반환해야 함", async () => {
      const dto = { roomId: "room-1", userId: "user-1", nickname: "테스트유저" };

      const result = await controller.getToken(dto);

      expect(livekitService.generateToken).toHaveBeenCalledWith("room-1", "user-1", "테스트유저");
      expect(livekitService.getLivekitUrl).toHaveBeenCalled();
      expect(result).toEqual({
        token: "mock-jwt-token",
        url: "wss://livekit.example.com",
      });
    });

    it("서비스 에러를 전파해야 함", async () => {
      livekitService.generateToken.mockRejectedValue(new Error("Token error"));

      const dto = { roomId: "room-1", userId: "user-1", nickname: "테스트유저" };

      await expect(controller.getToken(dto)).rejects.toThrow("Token error");
    });
  });
});
