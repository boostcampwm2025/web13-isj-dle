//임시용
export interface Avatar {
  face: string;
  color: string;
}

export interface User {
  id: string;
  sessionId: string;
  nickname: string;
  cameraOn: boolean;
  micOn: boolean;
  avatar: Avatar;
}
