import type { JSX } from "react";

export type RouteNode = {
  default: JSX.Element;
  children?: Record<string, RouteNode>;
};
