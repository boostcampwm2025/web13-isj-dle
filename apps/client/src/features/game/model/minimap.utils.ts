export interface ScaleResult {
  scale: number;
  scaledWidth: number;
  scaledHeight: number;
  offsetX: number;
  offsetY: number;
}

export const calculateMinimapScale = (
  mapWidth: number,
  mapHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  paddingY: number = 0,
): ScaleResult => {
  const scaleX = canvasWidth / mapWidth;
  const scaleY = (canvasHeight - paddingY * 2) / mapHeight;
  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = mapWidth * scale;
  const scaledHeight = mapHeight * scale;
  const offsetX = (canvasWidth - scaledWidth) / 2;
  const offsetY = (canvasHeight - scaledHeight) / 2;

  return { scale, scaledWidth, scaledHeight, offsetX, offsetY };
};
