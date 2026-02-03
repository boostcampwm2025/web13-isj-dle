export const ROUTE_PATHS = {
  HOME: "/",
  LOGIN: "/login",
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
