export interface Notice {
  id: number;
  title: string;
  content: string;
  roomId: string;
  timestamp: Date;
}

export enum NoticeEventType {
  NOTICE_SYNC = "notice:sync",
}
