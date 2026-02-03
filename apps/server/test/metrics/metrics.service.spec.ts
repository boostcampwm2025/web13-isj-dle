import { MetricsService } from "../../src/metrics/metrics.service";

describe("MetricsService", () => {
  let service: MetricsService;
  let mockGauges: Record<string, jest.Mocked<{ inc: jest.Mock; dec: jest.Mock; set: jest.Mock; labels: jest.Mock }>>;
  let mockCounters: Record<string, jest.Mocked<{ inc: jest.Mock; labels: jest.Mock }>>;
  let mockHistograms: Record<string, jest.Mocked<{ observe: jest.Mock; labels: jest.Mock }>>;

  beforeEach(() => {
    const createMockGauge = () => {
      const mock = {
        inc: jest.fn(),
        dec: jest.fn(),
        set: jest.fn(),
        labels: jest.fn().mockReturnThis(),
      };
      return mock;
    };

    const createMockCounter = () => {
      const mock = {
        inc: jest.fn(),
        labels: jest.fn().mockReturnThis(),
      };
      return mock;
    };

    const createMockHistogram = () => {
      const mock = {
        observe: jest.fn(),
        labels: jest.fn().mockReturnThis(),
      };
      return mock;
    };

    mockGauges = {
      wsConnectionsGauge: createMockGauge(),
      usersOnlineGauge: createMockGauge(),
      usersByRoomGauge: createMockGauge(),
      roomsActiveGauge: createMockGauge(),
    };

    mockCounters = {
      s3RequestsCounter: createMockCounter(),
      roomTransitionsCounter: createMockCounter(),
      s3UploadBytesCounter: createMockCounter(),
    };

    mockHistograms = {
      httpDurationHistogram: createMockHistogram(),
      s3DurationHistogram: createMockHistogram(),
      sessionDurationHistogram: createMockHistogram(),
    };

    service = new MetricsService(
      mockGauges.wsConnectionsGauge as never,
      mockGauges.usersOnlineGauge as never,
      mockGauges.usersByRoomGauge as never,
      mockGauges.roomsActiveGauge as never,
      mockHistograms.httpDurationHistogram as never,
      mockCounters.s3RequestsCounter as never,
      mockHistograms.s3DurationHistogram as never,
      mockCounters.s3UploadBytesCounter as never,
      mockCounters.roomTransitionsCounter as never,
      mockHistograms.sessionDurationHistogram as never,
    );
  });

  describe("WebSocket 연결 메트릭", () => {
    it("incrementWsConnections는 게이지를 증가시켜야 함", () => {
      service.incrementWsConnections();

      expect(mockGauges.wsConnectionsGauge.inc).toHaveBeenCalled();
    });

    it("decrementWsConnections는 게이지를 감소시켜야 함", () => {
      service.decrementWsConnections();

      expect(mockGauges.wsConnectionsGauge.dec).toHaveBeenCalled();
    });
  });

  describe("사용자 메트릭", () => {
    it("userJoined는 전체 사용자와 방별 사용자를 증가시켜야 함", () => {
      service.userJoined("lobby");

      expect(mockGauges.usersOnlineGauge.inc).toHaveBeenCalled();
      expect(mockGauges.usersByRoomGauge.labels).toHaveBeenCalledWith("lobby");
      expect(mockGauges.usersByRoomGauge.inc).toHaveBeenCalled();
    });

    it("userLeft는 전체 사용자와 방별 사용자를 감소시켜야 함", () => {
      service.userLeft("mogakco");

      expect(mockGauges.usersOnlineGauge.dec).toHaveBeenCalled();
      expect(mockGauges.usersByRoomGauge.labels).toHaveBeenCalledWith("mogakco");
      expect(mockGauges.usersByRoomGauge.dec).toHaveBeenCalled();
    });

    it("userMoved는 방 간 이동을 기록해야 함", () => {
      service.userMoved("lobby", "mogakco");

      expect(mockGauges.usersByRoomGauge.labels).toHaveBeenCalledWith("lobby");
      expect(mockGauges.usersByRoomGauge.dec).toHaveBeenCalled();
      expect(mockGauges.usersByRoomGauge.labels).toHaveBeenCalledWith("mogakco");
      expect(mockGauges.usersByRoomGauge.inc).toHaveBeenCalled();
      expect(mockCounters.roomTransitionsCounter.labels).toHaveBeenCalledWith("lobby", "mogakco");
    });

    it("userMoved는 같은 방이면 아무것도 하지 않아야 함", () => {
      service.userMoved("lobby", "lobby");

      expect(mockGauges.usersByRoomGauge.dec).not.toHaveBeenCalled();
      expect(mockGauges.usersByRoomGauge.inc).not.toHaveBeenCalled();
    });
  });

  describe("방 메트릭", () => {
    it("incrementActiveRooms는 활성 방을 증가시켜야 함", () => {
      service.incrementActiveRooms("meeting");

      expect(mockGauges.roomsActiveGauge.labels).toHaveBeenCalledWith("meeting");
      expect(mockGauges.roomsActiveGauge.inc).toHaveBeenCalled();
    });

    it("decrementActiveRooms는 활성 방을 감소시켜야 함", () => {
      service.decrementActiveRooms("meeting");

      expect(mockGauges.roomsActiveGauge.labels).toHaveBeenCalledWith("meeting");
      expect(mockGauges.roomsActiveGauge.dec).toHaveBeenCalled();
    });
  });

  describe("세션 메트릭", () => {
    it("recordSessionDuration은 세션 지속 시간을 기록해야 함", () => {
      service.recordSessionDuration(120.5);

      expect(mockHistograms.sessionDurationHistogram.observe).toHaveBeenCalledWith(120.5);
    });
  });

  describe("HTTP 메트릭", () => {
    it("observeHttpDuration은 HTTP 요청 지속 시간을 기록해야 함", () => {
      service.observeHttpDuration("GET", "/api/users", 200, 0.05);

      expect(mockHistograms.httpDurationHistogram.labels).toHaveBeenCalledWith("GET", "/api/users", "200");
      expect(mockHistograms.httpDurationHistogram.observe).toHaveBeenCalledWith(0.05);
    });
  });

  describe("S3 메트릭", () => {
    it("recordS3Request는 S3 요청을 기록해야 함", () => {
      service.recordS3Request("putObject", "success", 0.1);

      expect(mockCounters.s3RequestsCounter.labels).toHaveBeenCalledWith("putObject", "success");
      expect(mockCounters.s3RequestsCounter.inc).toHaveBeenCalled();
      expect(mockHistograms.s3DurationHistogram.labels).toHaveBeenCalledWith("putObject");
      expect(mockHistograms.s3DurationHistogram.observe).toHaveBeenCalledWith(0.1);
    });

    it("recordS3Upload은 업로드 바이트를 기록해야 함", () => {
      service.recordS3Upload(1024);

      expect(mockCounters.s3UploadBytesCounter.inc).toHaveBeenCalledWith(1024);
    });
  });

  describe("reconcile 메트릭", () => {
    it("reconcileOnlineUsers는 사용자 수를 설정해야 함", () => {
      service.reconcileOnlineUsers(50);

      expect(mockGauges.usersOnlineGauge.set).toHaveBeenCalledWith(50);
    });

    it("reconcileUsersByRoom은 방별 사용자 수를 설정해야 함", () => {
      service.reconcileUsersByRoom("lobby", 25);

      expect(mockGauges.usersByRoomGauge.labels).toHaveBeenCalledWith("lobby");
      expect(mockGauges.usersByRoomGauge.set).toHaveBeenCalledWith(25);
    });

    it("reconcileActiveRooms는 활성 방 수를 설정해야 함", () => {
      service.reconcileActiveRooms("meeting", 5);

      expect(mockGauges.roomsActiveGauge.labels).toHaveBeenCalledWith("meeting");
      expect(mockGauges.roomsActiveGauge.set).toHaveBeenCalledWith(5);
    });
  });
});
