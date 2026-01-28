export const getRestaurantImageKeyFromUrl = (imageUrl: string): string | null => {
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const path = url.pathname.replace(/^\/+/, "");

    const marker = "restaurant-images/";
    const idx = path.indexOf(marker);
    if (idx === -1) return null;

    return path.slice(idx);
  } catch {
    return null;
  }
};

export const isSameRestaurantImageUrl = (a: string, b: string): boolean => {
  const keyA = getRestaurantImageKeyFromUrl(a);
  const keyB = getRestaurantImageKeyFromUrl(b);
  if (keyA && keyB) return keyA === keyB;
  return a === b;
};
