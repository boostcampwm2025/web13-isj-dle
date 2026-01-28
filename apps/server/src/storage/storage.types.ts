export type PutPresignParams = {
  key: string;
  expiresInSeconds?: number;
};

export type GetPresignParams = {
  key: string;
  expiresInSeconds?: number;
};

export type PutObjectParams = {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
};

export type CopyObjectParams = {
  sourceKey: string;
  destinationKey: string;
};
