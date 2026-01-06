import type { Avatar, AvatarDirection } from "../model/avatar.types";
import { IDLE_BODY_FRAME, IDLE_HEAD_FRAME } from "./avatar-appearance";
import Phaser from "phaser";

type RenderAvatarProps = {
  scene: Phaser.Scene;
  avatar: Avatar;
};

const DEFAULT_DIRECTION: AvatarDirection = "down";

export type AvatarRenderResult = {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Sprite;
  head: Phaser.GameObjects.Sprite;
};

export const renderAvatar = ({ scene, avatar }: RenderAvatarProps): AvatarRenderResult => {
  const x = avatar.x;
  const y = avatar.y;

  const bodyFrame = IDLE_BODY_FRAME[DEFAULT_DIRECTION];
  const headFrame = IDLE_HEAD_FRAME[DEFAULT_DIRECTION];

  const container = scene.add.container(x, y);

  const body = scene.add.sprite(0, 16, avatar.assetKey, bodyFrame);
  const head = scene.add.sprite(0, 0, avatar.assetKey, headFrame);

  container.add([body, head]);

  return { container, body, head };
};
