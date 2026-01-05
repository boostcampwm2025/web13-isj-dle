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

export interface UserContextType {
  user: User | null;
  users: User[];
  setUser: (user: User | null) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUser: (updated: Partial<User> & { id: string }) => void;
}
