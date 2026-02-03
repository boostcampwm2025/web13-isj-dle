import { LecternService } from "../../src/lectern/lectern.service";

describe("LecternService", () => {
  let service: LecternService;

  beforeEach(() => {
    service = new LecternService();
  });

  describe("enterLectern", () => {
    it("강연대에 입장하면 사용자가 추가되어야 함", () => {
      const state = service.enterLectern("seminar (ios)", "user1");

      expect(state.usersOnLectern).toContain("user1");
    });

    it("첫 번째 입장자가 호스트가 되어야 함", () => {
      const state = service.enterLectern("seminar (ios)", "user1");

      expect(state.hostId).toBe("user1");
    });

    it("두 번째 입장자는 호스트가 아니어야 함", () => {
      service.enterLectern("seminar (ios)", "user1");
      const state = service.enterLectern("seminar (ios)", "user2");

      expect(state.hostId).toBe("user1");
      expect(state.usersOnLectern).toHaveLength(2);
    });

    it("같은 사용자가 중복 입장해도 한 번만 추가되어야 함", () => {
      service.enterLectern("seminar (ios)", "user1");
      const state = service.enterLectern("seminar (ios)", "user1");

      expect(state.usersOnLectern).toHaveLength(1);
    });
  });

  describe("leaveLectern", () => {
    it("강연대에서 퇴장하면 사용자가 제거되어야 함", () => {
      service.enterLectern("seminar (ios)", "user1");
      service.enterLectern("seminar (ios)", "user2");

      const state = service.leaveLectern("seminar (ios)", "user1");

      expect(state.usersOnLectern).not.toContain("user1");
      expect(state.usersOnLectern).toContain("user2");
    });

    it("호스트가 퇴장하면 다음 사용자가 호스트가 되어야 함", () => {
      service.enterLectern("seminar (ios)", "user1");
      service.enterLectern("seminar (ios)", "user2");

      const state = service.leaveLectern("seminar (ios)", "user1");

      expect(state.hostId).toBe("user2");
    });

    it("마지막 사용자가 퇴장하면 호스트가 null이 되어야 함", () => {
      service.enterLectern("seminar (ios)", "user1");

      const state = service.leaveLectern("seminar (ios)", "user1");

      expect(state.hostId).toBeNull();
      expect(state.usersOnLectern).toHaveLength(0);
    });

    it("없는 사용자 퇴장은 무시되어야 함", () => {
      service.enterLectern("seminar (ios)", "user1");

      const state = service.leaveLectern("seminar (ios)", "nonexistent");

      expect(state.usersOnLectern).toHaveLength(1);
    });
  });

  describe("isHost", () => {
    it("호스트면 true를 반환해야 함", () => {
      service.enterLectern("seminar (ios)", "user1");

      expect(service.isHost("seminar (ios)", "user1")).toBe(true);
    });

    it("호스트가 아니면 false를 반환해야 함", () => {
      service.enterLectern("seminar (ios)", "user1");
      service.enterLectern("seminar (ios)", "user2");

      expect(service.isHost("seminar (ios)", "user2")).toBe(false);
    });

    it("강연대가 없으면 false를 반환해야 함", () => {
      expect(service.isHost("seminar (ios)", "user1")).toBe(false);
    });
  });

  describe("createBreakout", () => {
    it("소회의실을 생성해야 함", () => {
      service.enterLectern("seminar (ios)", "host1");
      const config = { roomCount: 2, isRandom: false };

      const state = service.createBreakout("seminar (ios)", "host1", config, ["user1", "user2"]);

      expect(state).not.toBeNull();
      expect(state?.isActive).toBe(true);
      expect(state?.rooms).toHaveLength(2);
      expect(state?.hostId).toBe("host1");
    });

    it("랜덤 배정 시 사용자가 분배되어야 함", () => {
      service.enterLectern("seminar (ios)", "host1");
      const config = { roomCount: 2, isRandom: true };

      const state = service.createBreakout("seminar (ios)", "host1", config, ["user1", "user2", "user3", "user4"]);

      expect(state).not.toBeNull();
      const totalUsers = state!.rooms.reduce((sum, room) => sum + room.userIds.length, 0);
      expect(totalUsers).toBe(4);
    });

    it("수동 배정 시 빈 방이 생성되어야 함", () => {
      service.enterLectern("seminar (ios)", "host1");
      const config = { roomCount: 3, isRandom: false };

      const state = service.createBreakout("seminar (ios)", "host1", config, ["user1", "user2"]);

      expect(state).not.toBeNull();
      expect(state?.rooms).toHaveLength(3);
      state?.rooms.forEach((room) => {
        expect(room.userIds).toHaveLength(0);
      });
    });

    it("방 개수가 사용자 수보다 많으면 null을 반환해야 함 (랜덤 배정)", () => {
      service.enterLectern("seminar (ios)", "host1");
      const config = { roomCount: 5, isRandom: true };

      const state = service.createBreakout("seminar (ios)", "host1", config, ["user1", "user2"]);

      expect(state).toBeNull();
    });

    it("기존 소회의실이 있으면 덮어써야 함", () => {
      service.enterLectern("seminar (ios)", "host1");
      const config1 = { roomCount: 2, isRandom: false };
      const config2 = { roomCount: 3, isRandom: false };

      service.createBreakout("seminar (ios)", "host1", config1, []);
      const state = service.createBreakout("seminar (ios)", "host1", config2, []);

      expect(state?.rooms).toHaveLength(3);
    });

    it("소회의실 ID가 올바른 형식이어야 함", () => {
      service.enterLectern("seminar (ios)", "host1");
      const config = { roomCount: 2, isRandom: false };

      const state = service.createBreakout("seminar (ios)", "host1", config, []);

      expect(state?.rooms[0].roomId).toMatch(/^breakout-seminar--ios--1$/);
      expect(state?.rooms[1].roomId).toMatch(/^breakout-seminar--ios--2$/);
    });
  });

  describe("getBreakoutState", () => {
    it("소회의실 상태를 반환해야 함", () => {
      service.enterLectern("seminar (ios)", "host1");
      const config = { roomCount: 2, isRandom: false };
      service.createBreakout("seminar (ios)", "host1", config, []);

      const state = service.getBreakoutState("seminar (ios)");
      expect(state).not.toBeNull();
      expect(state?.isActive).toBe(true);
    });

    it("소회의실이 없으면 null을 반환해야 함", () => {
      const state = service.getBreakoutState("seminar (ios)");

      expect(state).toBeNull();
    });
  });

  describe("endBreakout", () => {
    it("소회의실을 종료해야 함", () => {
      service.enterLectern("seminar (ios)", "host1");
      const config = { roomCount: 2, isRandom: false };
      service.createBreakout("seminar (ios)", "host1", config, []);

      service.endBreakout("seminar (ios)");
      expect(service.getBreakoutState("seminar (ios)")).toBeNull();
    });
  });

  describe("joinBreakoutRoom", () => {
    it("사용자가 소회의실에 참여해야 함", () => {
      service.enterLectern("seminar (ios)", "host1");
      const config = { roomCount: 2, isRandom: false };
      service.createBreakout("seminar (ios)", "host1", config, []);

      const state = service.joinBreakoutRoom("seminar (ios)", "user1", "breakout-seminar--ios--1");
      expect(state?.rooms[0].userIds).toContain("user1");
    });

    it("다른 방에서 이동하면 기존 방에서 제거되어야 함", () => {
      service.enterLectern("seminar (ios)", "host1");
      const config = { roomCount: 2, isRandom: false };
      service.createBreakout("seminar (ios)", "host1", config, []);
      service.joinBreakoutRoom("seminar (ios)", "user1", "breakout-seminar--ios--1");

      const state = service.joinBreakoutRoom("seminar (ios)", "user1", "breakout-seminar--ios--2");

      expect(state?.rooms[0].userIds).not.toContain("user1");
      expect(state?.rooms[1].userIds).toContain("user1");
    });

    it("소회의실이 없으면 null을 반환해야 함", () => {
      const state = service.joinBreakoutRoom("seminar (ios)", "user1", "breakout-seminar--ios--1");

      expect(state).toBeNull();
    });

    it("비활성 소회의실이면 null을 반환해야 함", () => {
      service.enterLectern("seminar (ios)", "host1");
      const config = { roomCount: 2, isRandom: false };
      service.createBreakout("seminar (ios)", "host1", config, []);
      service.endBreakout("seminar (ios)");

      const state = service.joinBreakoutRoom("seminar (ios)", "user1", "breakout-seminar--ios--1");

      expect(state).toBeNull();
    });
  });

  describe("leaveBreakoutRoom", () => {
    it("사용자가 소회의실에서 나가야 함", () => {
      service.enterLectern("seminar (ios)", "host1");
      const config = { roomCount: 2, isRandom: false };
      service.createBreakout("seminar (ios)", "host1", config, []);
      service.joinBreakoutRoom("seminar (ios)", "user1", "breakout-seminar--ios--1");

      const state = service.leaveBreakoutRoom("seminar (ios)", "user1");

      expect(state?.rooms[0].userIds).not.toContain("user1");
    });

    it("소회의실이 없으면 null을 반환해야 함", () => {
      const state = service.leaveBreakoutRoom("seminar (ios)", "user1");

      expect(state).toBeNull();
    });
  });
});
