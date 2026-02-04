export type GithubUser = {
  id: number;
  login: string;
  avatar_url: string;
};

export type JWTPayload = {
  sub: string;
  nickname: string;
  avatarAssetKey: string;
  createdAt: string;
};
