import { GAME_REGISTRY_KEYS, getRegistryFunction } from "@features/game";
import { isLecternAtPosition } from "@features/game";

export class LecternManager {
  private scene: Phaser.Scene;
  private map: Phaser.Tilemaps.Tilemap | null = null;
  private isOnLectern: boolean = false;

  constructor(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap | null) {
    this.scene = scene;
    this.map = map;
  }

  setMap(map: Phaser.Tilemaps.Tilemap | null): void {
    this.map = map;
  }

  checkLectern(spriteX: number, spriteY: number, currentRoomId: string): void {
    const onLectern = isLecternAtPosition(this.map, spriteX, spriteY);

    if (onLectern && !this.isOnLectern) {
      this.isOnLectern = true;
      const emitLecternEnter = getRegistryFunction(this.scene.game, GAME_REGISTRY_KEYS.LECTERN_ENTER);
      if (emitLecternEnter) {
        emitLecternEnter(currentRoomId);
      }
    }

    if (!onLectern && this.isOnLectern) {
      this.isOnLectern = false;
      const emitLecternLeave = getRegistryFunction(this.scene.game, GAME_REGISTRY_KEYS.LECTERN_LEAVE);
      if (emitLecternLeave) {
        emitLecternLeave(currentRoomId);
      }
    }
  }

  getIsOnLectern(): boolean {
    return this.isOnLectern;
  }
}
