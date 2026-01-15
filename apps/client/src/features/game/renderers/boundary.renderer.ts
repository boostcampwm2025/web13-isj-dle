import { BOUNDARY_DASH, BOUNDARY_OFFSET } from "../model/game.constants";
import Phaser from "phaser";

import { MINIMUM_NUMBER_OF_MEMBERS, type User } from "@shared/types";

export class BoundaryRenderer {
  private graphics?: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  initialize(depth: number): void {
    if (!this.graphics) {
      this.graphics = this.scene.add.graphics();
    }
    this.graphics.setDepth(depth);
  }

  render(
    users: User[],
    currentUser: User | null | undefined,
    currentAvatarPosition?: { x: number; y: number },
    currentAvatarState?: string,
  ): void {
    if (this.graphics) {
      this.graphics.clear();
    }

    if (currentUser?.avatar.currentRoomId !== "lobby") return;

    const contactGroups = new Map<string, Array<{ x: number; y: number }>>();

    for (const user of users) {
      if (!user.contactId || user.avatar.currentRoomId !== "lobby" || user.avatar.state !== "idle") continue;

      let group = contactGroups.get(user.contactId);
      if (!group) {
        group = [];
        contactGroups.set(user.contactId, group);
      }

      group.push({ x: user.avatar.x, y: user.avatar.y });
    }

    if (currentUser?.contactId && currentAvatarState === "idle" && currentAvatarPosition) {
      let group = contactGroups.get(currentUser.contactId);
      if (!group) {
        group = [];
        contactGroups.set(currentUser.contactId, group);
      }

      group.push({ x: currentAvatarPosition.x, y: currentAvatarPosition.y });
    }

    for (const [, points] of contactGroups) {
      if (points.length < MINIMUM_NUMBER_OF_MEMBERS) continue;

      const hull = this.computeConvexHull(points);
      this.drawDashedHull(hull, BOUNDARY_OFFSET);
    }
  }

  private computeConvexHull(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
    if (points.length <= MINIMUM_NUMBER_OF_MEMBERS) return points;

    let start = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].y > points[start].y || (points[i].y === points[start].y && points[i].x < points[start].x)) {
        start = i;
      }
    }

    const pivot = points[start];

    const sorted = points
      .filter((_, i) => i !== start)
      .sort((a, b) => {
        const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
        const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
        if (angleA !== angleB) return angleA - angleB;

        const distA = (a.x - pivot.x) ** 2 + (a.y - pivot.y) ** 2;
        const distB = (b.x - pivot.x) ** 2 + (b.y - pivot.y) ** 2;
        return distA - distB;
      });

    const hull: Array<{ x: number; y: number }> = [pivot];

    for (const point of sorted) {
      while (hull.length > 1 && this.cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
        hull.pop();
      }
      hull.push(point);
    }

    return hull;
  }

  private cross(o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  private drawDashedHull(hull: Array<{ x: number; y: number }>, padding: number): void {
    if (!this.graphics || hull.length < MINIMUM_NUMBER_OF_MEMBERS) return;

    this.graphics.lineStyle(1, 0x00ff00, 0.8);
    this.drawDashedRoundedPolygon(hull, padding);
  }

  private drawDashedRoundedPolygon(hull: Array<{ x: number; y: number }>, padding: number): void {
    if (!this.graphics || hull.length < MINIMUM_NUMBER_OF_MEMBERS) return;

    let signedArea = 0;
    for (let i = 0; i < hull.length; i++) {
      const curr = hull[i];
      const next = hull[(i + 1) % hull.length];
      signedArea += (next.x - curr.x) * (next.y + curr.y);
    }
    const clockwise = signedArea > 0;

    let isDrawing = true;
    let dashRemaining = 4;

    for (let i = 0; i < hull.length; i++) {
      const curr = hull[i];
      const next = hull[(i + 1) % hull.length];
      const prev = hull[(i - 1 + hull.length) % hull.length];

      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;

      const sign = clockwise ? -1 : 1;
      const nx = (sign * dy) / len;
      const ny = (-sign * dx) / len;

      const startX = curr.x + nx * padding;
      const startY = curr.y + ny * padding;
      const endX = next.x + nx * padding;
      const endY = next.y + ny * padding;

      const pdx = curr.x - prev.x;
      const pdy = curr.y - prev.y;
      const plen = Math.hypot(pdx, pdy);

      if (plen > 0) {
        const pnx = (sign * pdy) / plen;
        const pny = (-sign * pdx) / plen;

        const prevX = curr.x + pnx * padding;
        const prevY = curr.y + pny * padding;

        const startAngle = Math.atan2(prevY - curr.y, prevX - curr.x);
        const endAngle = Math.atan2(startY - curr.y, startX - curr.x);

        const arcResult = this.drawDashedArc(curr.x, curr.y, padding, startAngle, endAngle, dashRemaining, isDrawing);
        dashRemaining = arcResult.dashRemaining;
        isDrawing = arcResult.isDrawing;
      }

      const lineResult = this.drawDashedLine(startX, startY, endX, endY, dashRemaining, isDrawing);
      dashRemaining = lineResult.dashRemaining;
      isDrawing = lineResult.isDrawing;
    }
  }

  private drawDashedLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    dashRemaining: number,
    isDrawing: boolean,
  ): { dashRemaining: number; isDrawing: boolean } {
    if (!this.graphics) return { dashRemaining, isDrawing };

    const dashLength = BOUNDARY_DASH.LENGTH;
    const gapLength = BOUNDARY_DASH.GAP;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return { dashRemaining, isDrawing };

    const unitX = dx / distance;
    const unitY = dy / distance;

    let traveled = 0;
    let cx = x1;
    let cy = y1;

    while (traveled < distance) {
      const segLen = Math.min(dashRemaining, distance - traveled);

      if (isDrawing) {
        this.graphics.beginPath();
        this.graphics.moveTo(cx, cy);
        this.graphics.lineTo(cx + unitX * segLen, cy + unitY * segLen);
        this.graphics.strokePath();
      }

      cx += unitX * segLen;
      cy += unitY * segLen;
      traveled += segLen;
      dashRemaining -= segLen;

      if (dashRemaining <= 0) {
        isDrawing = !isDrawing;
        dashRemaining = isDrawing ? dashLength : gapLength;
      }
    }

    return { dashRemaining, isDrawing };
  }

  private drawDashedArc(
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    dashRemaining: number,
    isDrawing: boolean,
  ): { dashRemaining: number; isDrawing: boolean } {
    if (!this.graphics) return { dashRemaining, isDrawing };

    const dashLength = BOUNDARY_DASH.LENGTH;
    const gapLength = BOUNDARY_DASH.GAP;

    while (endAngle < startAngle) endAngle += 2 * Math.PI;
    const totalAngle = endAngle - startAngle;
    const arcLength = totalAngle * radius;
    const segments = Math.max(8, Math.ceil(arcLength / 4));

    for (let i = 0; i < segments; i++) {
      const a1 = startAngle + (i / segments) * totalAngle;
      const a2 = startAngle + ((i + 1) / segments) * totalAngle;

      const x1 = cx + Math.cos(a1) * radius;
      const y1 = cy + Math.sin(a1) * radius;
      const x2 = cx + Math.cos(a2) * radius;
      const y2 = cy + Math.sin(a2) * radius;

      const segLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

      if (isDrawing) {
        this.graphics.beginPath();
        this.graphics.moveTo(x1, y1);
        this.graphics.lineTo(x2, y2);
        this.graphics.strokePath();
      }

      dashRemaining -= segLen;
      if (dashRemaining <= 0) {
        isDrawing = !isDrawing;
        dashRemaining = isDrawing ? dashLength : gapLength;
      }
    }

    return { dashRemaining, isDrawing };
  }

  destroy(): void {
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = undefined;
    }
  }
}
