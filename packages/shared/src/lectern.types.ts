export interface LecternState {
  hostId: string | null;
  usersOnLectern: string[];
  roomId: string;
}

export enum LecternEventType {
  LECTERN_ENTER = "lectern:enter",
  LECTERN_LEAVE = "lectern:leave",
  LECTERN_UPDATE = "lectern:update",
  MUTE_ALL = "lectern:mute-all",
  MUTE_ALL_EXECUTED = "lectern:mute-all-executed",
}
