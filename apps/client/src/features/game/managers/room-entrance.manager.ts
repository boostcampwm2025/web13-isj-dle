import { GAME_REGISTRY_KEYS, getRegistryFunction } from "../model/game-registry.constants";
import Phaser from "phaser";

import { isMeetingRoomRange } from "@shared/config";

export class RoomEntranceManager {
  private scene: Phaser.Scene;
  private currentRoomId: string = "lobby";
  private map: Phaser.Tilemaps.Tilemap | null = null;

  constructor(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap | null) {
    this.scene = scene;
    this.map = map;
  }

  setMap(map: Phaser.Tilemaps.Tilemap | null): void {
    this.map = map;
  }

  getCurrentRoomId(): string {
    return this.currentRoomId;
  }

  checkRoomEntrance(spriteX: number, spriteY: number): void {
    if (!this.map) return;

    const objectLayer = this.map.getObjectLayer("ObjectLayer-Area");
    if (!objectLayer) {
      console.warn("[RoomEntranceManager] ObjectLayer-Area not found");
      return;
    }

    let targetRoomId = "lobby";

    for (const obj of objectLayer.objects) {
      const objX = obj.x ?? 0;
      const objY = obj.y ?? 0;
      const objWidth = obj.width ?? 0;
      const objHeight = obj.height ?? 0;

      if (spriteX >= objX && spriteX <= objX + objWidth && spriteY >= objY && spriteY <= objY + objHeight) {
        const properties = obj.properties as { name: string; value: unknown }[];
        if (!properties) continue;

        const typeProperty = properties.find((p) => p.name === "type");
        if (typeProperty?.value !== "room") continue;

        const idProperty = properties.find((p) => p.name === "id");
        const roomId = idProperty?.value;

        if (roomId && typeof roomId === "string") {
          targetRoomId = roomId;
          if (targetRoomId !== "lobby") break;
        }
      }
    }

    if (targetRoomId !== this.currentRoomId) {
      this.currentRoomId = targetRoomId;

      const joinRoom = getRegistryFunction(this.scene.game, "JOIN_ROOM");
      if (joinRoom) {
        joinRoom(targetRoomId);
      } else {
        console.warn(`[RoomEntranceManager] ${GAME_REGISTRY_KEYS.JOIN_ROOM} function not found in registry`);
      }

      if (isMeetingRoomRange(targetRoomId)) {
        const openRoomSelector = getRegistryFunction(this.scene.game, "OPEN_ROOM_SELECTOR");
        if (openRoomSelector) {
          openRoomSelector(targetRoomId);
        } else {
          console.warn(`[RoomEntranceManager] ${GAME_REGISTRY_KEYS.OPEN_ROOM_SELECTOR} function not found in registry`);
        }
      }
    }
  }
}
